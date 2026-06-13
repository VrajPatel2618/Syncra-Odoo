import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticate, authorize, AuthRequest, requireModuleAccess } from '../middleware/auth';
import { inventoryService } from '../services/inventory.service';

const router = Router();

  '/',
  authenticate,
  requireModuleAccess('inventory'),
  asyncHandler(async (_req, res) => {
    const inventory = await prisma.inventory.findMany({
      include: { product: { include: { category: true } }, warehouse: true },
      orderBy: { updatedAt: 'desc' },
    });

    const enriched = inventory.map((i) => ({
      ...i,
      freeQty: i.onHandQty - i.reservedQty,
      isLowStock: i.onHandQty - i.reservedQty <= i.product.reorderPoint,
    }));

    res.json({ success: true, data: enriched });
  })
);

  '/movements',
  authenticate,
  requireModuleAccess('inventory'),
  asyncHandler(async (req, res) => {
    const { productId, limit = '50' } = req.query;
    const movements = await prisma.stockMovement.findMany({
      where: productId ? { productId: productId as string } : undefined,
      include: { product: true },
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: movements });
  })
);

  '/alerts',
  authenticate,
  requireModuleAccess('inventory'),
  asyncHandler(async (_req, res) => {
    const inventory = await prisma.inventory.findMany({
      include: { product: true, warehouse: true },
    });
    const alerts = inventory
      .filter((i) => i.onHandQty - i.reservedQty <= i.product.reorderPoint)
      .map((i) => ({
        productId: i.productId,
        productName: i.product.name,
        sku: i.product.sku,
        warehouse: i.warehouse.name,
        onHandQty: i.onHandQty,
        reservedQty: i.reservedQty,
        freeQty: i.onHandQty - i.reservedQty,
        reorderPoint: i.product.reorderPoint,
        severity: i.onHandQty - i.reservedQty <= 0 ? 'critical' : 'warning',
      }));
    res.json({ success: true, data: alerts });
  })
);

  '/adjust',
  authenticate,
  requireModuleAccess('inventory', true),
  asyncHandler(async (req: AuthRequest, res) => {
    const { productId, warehouseId, quantity, movementType, notes } = req.body;
    const movement = await inventoryService.adjustStock({
      productId,
      warehouseId,
      quantity,
      movementType: movementType || 'ADJUSTMENT',
      notes,
      userId: req.user!.id,
    });
    res.json({ success: true, data: movement });
  })
);

  '/transfer',
  authenticate,
  requireModuleAccess('inventory', true),
  asyncHandler(async (req: AuthRequest, res) => {
    const { productId, fromWarehouseId, toWarehouseId, quantity } = req.body;

    await inventoryService.adjustStock({
      productId,
      warehouseId: fromWarehouseId,
      quantity,
      movementType: 'OUT',
      referenceType: 'TRANSFER',
      notes: `Transfer to warehouse ${toWarehouseId}`,
      userId: req.user!.id,
    });

    const movement = await inventoryService.adjustStock({
      productId,
      warehouseId: toWarehouseId,
      quantity,
      movementType: 'IN',
      referenceType: 'TRANSFER',
      notes: `Transfer from warehouse ${fromWarehouseId}`,
      userId: req.user!.id,
    });

    res.json({ success: true, data: movement });
  })
);

export default router;
