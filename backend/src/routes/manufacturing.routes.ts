import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { inventoryService } from '../services/inventory.service';
import { blockchainService } from '../services/blockchain.service';

const router = Router();
const genNumber = (prefix: string) => `${prefix}-${Date.now().toString(36).toUpperCase()}`;

router.get('/orders', authenticate, asyncHandler(async (_req, res) => {
  const orders = await prisma.manufacturingOrder.findMany({
    include: {
      bom: { include: { finishedProduct: true, components: { include: { product: true } } } },
      workCenter: true,
      workOrders: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: orders });
}));

router.get('/work-centers', authenticate, asyncHandler(async (_req, res) => {
  const centers = await prisma.workCenter.findMany({ include: { _count: { select: { workOrders: true } } } });
  res.json({ success: true, data: centers });
}));

router.get('/boms', authenticate, asyncHandler(async (_req, res) => {
  const boms = await prisma.billOfMaterial.findMany({
    include: {
      finishedProduct: true,
      components: { include: { product: true } },
      operations: { include: { workCenter: true } },
    },
  });
  res.json({ success: true, data: boms });
}));

router.post('/orders', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MANUFACTURING'), asyncHandler(async (req, res) => {
  const { bomId, quantity, workCenterId, scheduledDate } = req.body;
  const order = await prisma.manufacturingOrder.create({
    data: {
      orderNumber: genNumber('MO'),
      bomId,
      quantity,
      workCenterId,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      status: 'PLANNED',
    },
    include: { bom: { include: { finishedProduct: true, components: { include: { product: true } } } } },
  });
  res.status(201).json({ success: true, data: order });
}));

router.patch('/orders/:id/start', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MANUFACTURING'), asyncHandler(async (req: AuthRequest, res) => {
  const order = await prisma.manufacturingOrder.findUnique({
    where: { id: req.params.id as string },
    include: { bom: { include: { components: true, operations: { include: { workCenter: true } } } } },
  });
  if (!order) throw new AppError('MO not found', 404);

  const warehouse = await prisma.warehouse.findFirst({ where: { isActive: true } });
  if (!warehouse) throw new AppError('No active warehouse', 400);

  for (const comp of order.bom.components) {
    const needed = comp.quantity * order.quantity;
    const freeQty = await inventoryService.getFreeQty(comp.productId);
    if (freeQty < needed) throw new AppError(`Insufficient ${comp.productId} for manufacturing`, 400);
    await inventoryService.adjustStock({
      productId: comp.productId,
      warehouseId: warehouse.id,
      quantity: needed,
      movementType: 'RESERVATION',
      referenceType: 'ManufacturingOrder',
      referenceId: order.id,
      userId: req.user!.id,
    });
  }

  for (const op of order.bom.operations) {
    await prisma.workOrder.create({
      data: {
        orderNumber: genNumber('WO'),
        manufacturingOrderId: order.id,
        workCenterId: op.workCenterId,
        status: 'PENDING',
      },
    });
  }

  const updated = await prisma.manufacturingOrder.update({
    where: { id: order.id },
    data: { status: 'IN_PROGRESS' },
    include: { workOrders: { include: { workCenter: true } }, bom: { include: { finishedProduct: true } } },
  });

  res.json({ success: true, data: updated });
}));

router.patch('/orders/:id/complete', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MANUFACTURING'), asyncHandler(async (req: AuthRequest, res) => {
  const order = await prisma.manufacturingOrder.findUnique({
    where: { id: req.params.id as string },
    include: { bom: { include: { components: true, finishedProduct: true } } },
  });
  if (!order) throw new AppError('MO not found', 404);

  const warehouse = await prisma.warehouse.findFirst({ where: { isActive: true } });
  if (!warehouse) throw new AppError('No active warehouse', 400);

  for (const comp of order.bom.components) {
    const needed = comp.quantity * order.quantity;
    await inventoryService.adjustStock({
      productId: comp.productId,
      warehouseId: warehouse.id,
      quantity: needed,
      movementType: 'RELEASE',
      referenceType: 'ManufacturingOrder',
      referenceId: order.id,
      userId: req.user!.id,
    });
    await inventoryService.adjustStock({
      productId: comp.productId,
      warehouseId: warehouse.id,
      quantity: needed,
      movementType: 'MANUFACTURING_CONSUME',
      referenceType: 'ManufacturingOrder',
      referenceId: order.id,
      userId: req.user!.id,
    });
  }

  await inventoryService.adjustStock({
    productId: order.bom.finishedProductId,
    warehouseId: warehouse.id,
    quantity: order.quantity,
    movementType: 'MANUFACTURING_PRODUCE',
    referenceType: 'ManufacturingOrder',
    referenceId: order.id,
    userId: req.user!.id,
  });

  const { hash } = await blockchainService.recordAudit({
    eventType: 'MANUFACTURING_COMPLETED',
    entityType: 'ManufacturingOrder',
    entityId: order.id,
    data: { orderNumber: order.orderNumber, quantity: order.quantity },
  });

  await prisma.workOrder.updateMany({
    where: { manufacturingOrderId: order.id },
    data: { status: 'COMPLETED', endTime: new Date() },
  });

  const updated = await prisma.manufacturingOrder.update({
    where: { id: order.id },
    data: { status: 'COMPLETED', producedQty: order.quantity, completedDate: new Date() },
    include: { bom: { include: { finishedProduct: true } } },
  });

  res.json({ success: true, data: updated });
}));

export default router;
