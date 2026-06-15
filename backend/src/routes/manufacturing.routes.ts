import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticate, authorize, AuthRequest, requireModuleAccess } from '../middleware/auth';
import { inventoryService } from '../services/inventory.service';
import { blockchainService } from '../services/blockchain.service';

const router = Router();
const genNumber = (prefix: string) => `${prefix}-${Date.now().toString(36).toUpperCase()}`;

router.get('/orders', authenticate, requireModuleAccess('manufacturing'), asyncHandler(async (_req, res) => {
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

router.get('/work-centers', authenticate, requireModuleAccess('manufacturing'), asyncHandler(async (_req, res) => {
  const centers = await prisma.workCenter.findMany({ include: { _count: { select: { workOrders: true } } } });
  res.json({ success: true, data: centers });
}));

router.get('/boms', authenticate, requireModuleAccess('manufacturing'), asyncHandler(async (_req, res) => {
  const boms = await prisma.billOfMaterial.findMany({
    include: {
      finishedProduct: true,
      components: { include: { product: true } },
      operations: { include: { workCenter: true } },
    },
  });
  res.json({ success: true, data: boms });
}));

router.post('/orders', authenticate, requireModuleAccess('manufacturing', true), asyncHandler(async (req, res) => {
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

router.patch('/orders/:id/start', authenticate, requireModuleAccess('manufacturing', true), asyncHandler(async (req: AuthRequest, res) => {
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

router.patch('/orders/:id/complete', authenticate, requireModuleAccess('manufacturing', true), asyncHandler(async (req: AuthRequest, res) => {
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

router.post('/boms', authenticate, requireModuleAccess('manufacturing', true), asyncHandler(async (req, res) => {
  const { name, finishedProductId, productionDuration, totalCost, qualityStandard, components, operations } = req.body;
  if (!components || components.length === 0) throw new AppError('BoM must have at least 1 component', 400);
  if (!operations || operations.length === 0) throw new AppError('BoM must have at least 1 operation', 400);

  const bom = await prisma.billOfMaterial.create({
    data: {
      name,
      finishedProductId,
      productionDuration,
      totalCost,
      qualityStandard,
      version: "1.0",
      components: {
        create: components.map((c: any) => ({
          productId: c.productId,
          quantity: c.quantity,
          unit: c.unit || "pcs",
        }))
      },
      operations: {
        create: operations.map((o: any, idx: number) => ({
          workCenterId: o.workCenterId,
          sequence: o.sequence || idx + 1,
          name: o.name,
          duration: o.duration,
        }))
      }
    },
    include: { components: true, operations: true }
  });
  res.status(201).json({ success: true, data: bom });
}));

router.put('/boms/:id', authenticate, requireModuleAccess('manufacturing', true), asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const { name, finishedProductId, productionDuration, totalCost, qualityStandard, components, operations } = req.body;
  
  if (!components || components.length === 0) throw new AppError('BoM must have at least 1 component', 400);
  if (!operations || operations.length === 0) throw new AppError('BoM must have at least 1 operation', 400);

  const oldBom = await prisma.billOfMaterial.findUnique({ where: { id } });
  if (!oldBom) throw new AppError('BoM not found', 404);

  // Deactivate old version
  await prisma.billOfMaterial.update({
    where: { id },
    data: { isActive: false }
  });

  // Calculate new version number
  const versionParts = oldBom.version.split('.');
  const newVersion = versionParts.length === 2 
    ? `${versionParts[0]}.${parseInt(versionParts[1]) + 1}` 
    : `${oldBom.version}.1`;

  const newBom = await prisma.billOfMaterial.create({
    data: {
      name,
      finishedProductId,
      productionDuration,
      totalCost,
      qualityStandard,
      version: newVersion,
      isActive: true,
      components: {
        create: components.map((c: any) => ({
          productId: c.productId,
          quantity: c.quantity,
          unit: c.unit || "pcs",
        }))
      },
      operations: {
        create: operations.map((o: any, idx: number) => ({
          workCenterId: o.workCenterId,
          sequence: o.sequence || idx + 1,
          name: o.name,
          duration: o.duration,
        }))
      }
    },
    include: { components: true, operations: true }
  });

  res.json({ success: true, data: newBom });
}));

router.delete('/boms/:id', authenticate, requireModuleAccess('manufacturing', true), asyncHandler(async (req, res) => {
  await prisma.billOfMaterial.delete({ where: { id: req.params.id as string } });
  res.json({ success: true });
}));

router.patch('/boms/:id/status', authenticate, requireModuleAccess('manufacturing', true), asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const bom = await prisma.billOfMaterial.update({
    where: { id: req.params.id as string },
    data: { isActive }
  });
  res.json({ success: true, data: bom });
}));

router.post('/boms/:id/clone', authenticate, requireModuleAccess('manufacturing', true), asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const oldBom = await prisma.billOfMaterial.findUnique({ 
    where: { id },
    include: { components: true, operations: true }
  });
  if (!oldBom) throw new AppError('BoM not found', 404);

  const cloned = await prisma.billOfMaterial.create({
    data: {
      name: `${oldBom.name} (Clone)`,
      finishedProductId: oldBom.finishedProductId,
      productionDuration: oldBom.productionDuration,
      totalCost: oldBom.totalCost,
      qualityStandard: oldBom.qualityStandard,
      version: "1.0",
      isActive: false,
      components: {
        create: oldBom.components.map((c: any) => ({
          productId: c.productId,
          quantity: c.quantity,
          unit: c.unit,
        }))
      },
      operations: {
        create: oldBom.operations.map((o: any) => ({
          workCenterId: o.workCenterId,
          sequence: o.sequence,
          name: o.name,
          duration: o.duration,
        }))
      }
    },
    include: { components: true, operations: true }
  });

  res.status(201).json({ success: true, data: cloned });
}));

router.get('/boms/:id/impact', authenticate, requireModuleAccess('manufacturing'), asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const qty = parseInt(req.query.qty as string) || 1;
  
  const bom = await prisma.billOfMaterial.findUnique({
    where: { id },
    include: { 
      components: { include: { product: true } }, 
      operations: { include: { workCenter: true } }
    }
  });
  if (!bom) throw new AppError('BoM not found', 404);

  const impact = {
    quantityToProduce: qty,
    components: [] as any[],
    totalDuration: 0,
    operations: [] as any[]
  };

  for (const comp of bom.components) {
    const required = comp.quantity * qty;
    const freeQty = await inventoryService.getFreeQty(comp.productId);
    impact.components.push({
      product: (comp as any).product,
      required,
      available: freeQty,
      shortage: Math.max(0, required - freeQty)
    });
  }

  for (const op of bom.operations) {
    const duration = op.duration * qty;
    impact.totalDuration += duration;
    impact.operations.push({
      workCenter: (op as any).workCenter,
      name: op.name,
      duration
    });
  }

  res.json({ success: true, data: impact });
}));

export default router;
