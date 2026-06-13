import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { inventoryService } from '../services/inventory.service';
import { blockchainService } from '../services/blockchain.service';

const router = Router();
const genNumber = (prefix: string) => `${prefix}-${Date.now().toString(36).toUpperCase()}`;

router.get('/', authenticate, asyncHandler(async (_req, res) => {
  const orders = await prisma.salesOrder.findMany({
    include: { customer: true, items: { include: { product: true } }, deliveries: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: orders.map(o => ({ ...o, subtotal: Number(o.subtotal), taxAmount: Number(o.taxAmount), totalAmount: Number(o.totalAmount) })) });
}));

router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const order = await prisma.salesOrder.findUnique({
    where: { id: req.params.id as string },
    include: { customer: true, items: { include: { product: true } }, deliveries: true, invoices: true, payments: true },
  });
  if (!order) throw new AppError('Order not found', 404);
  res.json({ success: true, data: order });
}));

router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES'), asyncHandler(async (req: AuthRequest, res) => {
  const { customerId, items, deliveryDate, notes } = req.body;
  let subtotal = 0;
  const orderItems = items.map((item: { productId: string; quantity: number; unitPrice: number }) => {
    const total = item.quantity * item.unitPrice;
    subtotal += total;
    return { productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice, totalPrice: total };
  });
  const taxAmount = subtotal * 0.18;
  const order = await prisma.salesOrder.create({
    data: {
      orderNumber: genNumber('SO'),
      customerId,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      notes,
      subtotal,
      taxAmount,
      totalAmount: subtotal + taxAmount,
      items: { create: orderItems },
    },
    include: { customer: true, items: { include: { product: true } } },
  });
  res.status(201).json({ success: true, data: order });
}));

router.patch('/:id/confirm', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES'), asyncHandler(async (req: AuthRequest, res) => {
  const order = await prisma.salesOrder.findUnique({
    where: { id: req.params.id as string },
    include: { items: { include: { product: true } } },
  });
  if (!order) throw new AppError('Order not found', 404);
  if (order.status !== 'DRAFT') throw new AppError('Order already confirmed', 400);

  const warehouse = await prisma.warehouse.findFirst({ where: { isActive: true } });
  if (!warehouse) throw new AppError('No active warehouse', 400);

  for (const item of order.items) {
    const freeQty = await inventoryService.getFreeQty(item.productId);
    if (freeQty < item.quantity) {
      const procurement = await inventoryService.checkAndTriggerProcurement(item.productId);
      if (procurement) {
        await prisma.notification.create({
          data: {
            userId: req.user!.id,
            type: 'PROCUREMENT',
            title: 'Stock Shortage Detected',
            message: `${item.product.name} needs ${item.quantity - freeQty} more units. Suggested: ${procurement.action}`,
            link: '/procurement',
          },
        });
      }
    }
    await inventoryService.adjustStock({
      productId: item.productId,
      warehouseId: warehouse.id,
      quantity: Math.min(item.quantity, freeQty),
      movementType: 'RESERVATION',
      referenceType: 'SalesOrder',
      referenceId: order.id,
      userId: req.user!.id,
    });
  }

  const { hash } = await blockchainService.recordAudit({
    eventType: 'SALES_CONFIRMED',
    entityType: 'SalesOrder',
    entityId: order.id,
    data: { orderNumber: order.orderNumber, total: Number(order.totalAmount) },
  });

  const updated = await prisma.salesOrder.update({
    where: { id: order.id },
    data: { status: 'CONFIRMED' },
    include: { customer: true, items: { include: { product: true } } },
  });

  await prisma.auditLog.create({
    data: { userId: req.user!.id, action: 'CONFIRM', entityType: 'SalesOrder', entityId: order.id, blockchainHash: hash, verified: true },
  });

  res.json({ success: true, data: updated });
}));

router.patch('/:id/deliver', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'WAREHOUSE'), asyncHandler(async (req: AuthRequest, res) => {
  const order = await prisma.salesOrder.findUnique({
    where: { id: req.params.id as string },
    include: { items: true },
  });
  if (!order) throw new AppError('Order not found', 404);

  const warehouse = await prisma.warehouse.findFirst({ where: { isActive: true } });
  if (!warehouse) throw new AppError('No active warehouse', 400);

  for (const item of order.items) {
    const deliverQty = item.quantity - item.deliveredQty;
    if (deliverQty > 0) {
      await inventoryService.adjustStock({
        productId: item.productId,
        warehouseId: warehouse.id,
        quantity: deliverQty,
        movementType: 'RELEASE',
        referenceType: 'SalesOrder',
        referenceId: order.id,
        userId: req.user!.id,
      });
      await inventoryService.adjustStock({
        productId: item.productId,
        warehouseId: warehouse.id,
        quantity: deliverQty,
        movementType: 'OUT',
        referenceType: 'SalesOrder',
        referenceId: order.id,
        userId: req.user!.id,
      });
      await prisma.salesItem.update({
        where: { id: item.id },
        data: { deliveredQty: item.quantity },
      });
    }
  }

  const allDelivered = order.items.every(i => i.quantity === i.deliveredQty || i.quantity === i.quantity);
  const { hash } = await blockchainService.recordAudit({
    eventType: 'DELIVERY_COMPLETED',
    entityType: 'SalesOrder',
    entityId: order.id,
    data: { orderNumber: order.orderNumber },
  });

  const updated = await prisma.salesOrder.update({
    where: { id: order.id },
    data: { status: 'FULLY_DELIVERED' },
    include: { customer: true, items: { include: { product: true } } },
  });

  await prisma.delivery.create({
    data: {
      deliveryNumber: genNumber('DEL'),
      salesOrderId: order.id,
      status: 'DELIVERED',
      deliveredDate: new Date(),
      blockchainHash: hash,
    },
  });

  res.json({ success: true, data: updated });
}));

router.post('/:id/invoice', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES'), asyncHandler(async (req: AuthRequest, res) => {
  const order = await prisma.salesOrder.findUnique({ where: { id: req.params.id as string } });
  if (!order) throw new AppError('Order not found', 404);
  
  const existing = await prisma.invoice.findFirst({ where: { salesOrderId: order.id } });
  if (existing) throw new AppError('Order already invoiced', 400);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: genNumber('INV'),
      salesOrderId: order.id,
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      totalAmount: order.totalAmount,
      status: 'PENDING',
      dueDate: new Date(Date.now() + 15 * 86400000), // 15 days from now
    }
  });
  
  res.json({ success: true, data: invoice });
}));

router.post('/:id/pay', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES'), asyncHandler(async (req: AuthRequest, res) => {
  const order = await prisma.salesOrder.findUnique({ where: { id: req.params.id as string } });
  if (!order) throw new AppError('Order not found', 404);
  
  const existing = await prisma.payment.findFirst({ where: { salesOrderId: order.id } });
  if (existing) throw new AppError('Order already paid', 400);

  const payment = await prisma.payment.create({
    data: {
      paymentNumber: genNumber('PAY'),
      customerId: order.customerId,
      salesOrderId: order.id,
      amount: order.totalAmount,
      method: req.body.method || 'BANK_TRANSFER',
      status: 'COMPLETED',
    }
  });
  
  // Also update invoice status if exists
  await prisma.invoice.updateMany({
    where: { salesOrderId: order.id },
    data: { status: 'PAID', paidDate: new Date() }
  });
  
  res.json({ success: true, data: payment });
}));

export default router;
