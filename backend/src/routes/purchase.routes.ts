import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { inventoryService } from '../services/inventory.service';
import { blockchainService } from '../services/blockchain.service';

const router = Router();
const genNumber = (prefix: string) => `${prefix}-${Date.now().toString(36).toUpperCase()}`;

router.get('/', authenticate, asyncHandler(async (_req, res) => {
  const orders = await prisma.purchaseOrder.findMany({
    include: { vendor: true, items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: orders });
}));

router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'PURCHASE'), asyncHandler(async (req, res) => {
  const { vendorId, items, expectedDate, notes } = req.body;
  let subtotal = 0;
  const orderItems = items.map((item: { productId: string; quantity: number; unitPrice: number }) => {
    const total = item.quantity * item.unitPrice;
    subtotal += total;
    return { productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice, totalPrice: total };
  });
  const taxAmount = subtotal * 0.18;
  const order = await prisma.purchaseOrder.create({
    data: {
      orderNumber: genNumber('PO'),
      vendorId,
      expectedDate: expectedDate ? new Date(expectedDate) : null,
      notes,
      subtotal,
      taxAmount,
      totalAmount: subtotal + taxAmount,
      items: { create: orderItems },
    },
    include: { vendor: true, items: { include: { product: true } } },
  });
  res.status(201).json({ success: true, data: order });
}));

router.patch('/:id/confirm', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'PURCHASE'), asyncHandler(async (req: AuthRequest, res) => {
  const order = await prisma.purchaseOrder.update({
    where: { id: req.params.id as string },
    data: { status: 'CONFIRMED' },
    include: { vendor: true, items: true },
  });
  const { hash } = await blockchainService.recordAudit({
    eventType: 'PURCHASE_CONFIRMED',
    entityType: 'PurchaseOrder',
    entityId: order.id,
    data: { orderNumber: order.orderNumber },
  });
  await prisma.auditLog.create({
    data: { userId: req.user!.id, action: 'CONFIRM', entityType: 'PurchaseOrder', entityId: order.id, blockchainHash: hash, verified: true },
  });
  res.json({ success: true, data: order });
}));

router.patch('/:id/receive', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'WAREHOUSE', 'PURCHASE'), asyncHandler(async (req: AuthRequest, res) => {
  const order = await prisma.purchaseOrder.findUnique({
    where: { id: req.params.id as string },
    include: { items: true },
  });
  if (!order) throw new AppError('Order not found', 404);

  const warehouse = await prisma.warehouse.findFirst({ where: { isActive: true } });
  if (!warehouse) throw new AppError('No active warehouse', 400);

  for (const item of order.items) {
    const receiveQty = item.quantity - item.receivedQty;
    if (receiveQty > 0) {
      await inventoryService.adjustStock({
        productId: item.productId,
        warehouseId: warehouse.id,
        quantity: receiveQty,
        movementType: 'IN',
        referenceType: 'PurchaseOrder',
        referenceId: order.id,
        userId: req.user!.id,
      });
      await prisma.purchaseItem.update({
        where: { id: item.id },
        data: { receivedQty: item.quantity },
      });
    }
  }

  const { hash } = await blockchainService.recordAudit({
    eventType: 'GOODS_RECEIVED',
    entityType: 'PurchaseOrder',
    entityId: order.id,
    data: { orderNumber: order.orderNumber },
  });

  const updated = await prisma.purchaseOrder.update({
    where: { id: order.id },
    data: { status: 'FULLY_RECEIVED' },
    include: { vendor: true, items: { include: { product: true } } },
  });

  res.json({ success: true, data: updated });
}));

export default router;
