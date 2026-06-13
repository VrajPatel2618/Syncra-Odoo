import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { inventoryService } from '../services/inventory.service';

const router = Router();

const generateSku = () => `SFW-${Date.now().toString(36).toUpperCase()}`;

router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { category, search, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(category && { categoryId: category as string }),
        ...(search && {
          OR: [
            { name: { contains: search as string } },
            { sku: { contains: search as string } },
          ],
        }),
      },
      include: { category: true, inventory: { include: { warehouse: true } } },
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
    });

    const enriched = products.map((p) => ({
      ...p,
      salesPrice: Number(p.salesPrice),
      costPrice: Number(p.costPrice),
      totalOnHand: p.inventory.reduce((s, i) => s + i.onHandQty, 0),
      totalReserved: p.inventory.reduce((s, i) => s + i.reservedQty, 0),
      freeQty: p.inventory.reduce((s, i) => s + (i.onHandQty - i.reservedQty), 0),
    }));

    res.json({ success: true, data: enriched });
  })
);

router.get(
  '/categories',
  authenticate,
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({ include: { _count: { select: { products: true } } } });
    res.json({ success: true, data: categories });
  })
);

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id as string },
      include: {
        category: true,
        inventory: { include: { warehouse: true } },
        stockMovements: { take: 20, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!product) throw new AppError('Product not found', 404);
    res.json({ success: true, data: product });
  })
);

router.post(
  '/',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  asyncHandler(async (req: AuthRequest, res) => {
    const { name, description, categoryId, salesPrice, costPrice, procurementStrategy, reorderPoint, reorderQty, isRawMaterial, isFinishedGood, imageUrl } = req.body;

    const product = await prisma.product.create({
      data: {
        sku: generateSku(),
        name,
        description,
        categoryId,
        salesPrice,
        costPrice,
        procurementStrategy: procurementStrategy || 'MTS',
        reorderPoint: reorderPoint || 10,
        reorderQty: reorderQty || 50,
        isRawMaterial: isRawMaterial || false,
        isFinishedGood: isFinishedGood ?? true,
        imageUrl,
        qrCode: `QR-${Date.now()}`,
      },
      include: { category: true },
    });

    res.status(201).json({ success: true, data: product });
  })
);

router.put(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const product = await prisma.product.update({
      where: { id: req.params.id as string },
      data: req.body,
      include: { category: true },
    });
    res.json({ success: true, data: product });
  })
);

router.delete(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    await prisma.product.update({ where: { id: req.params.id as string }, data: { isActive: false } });
    res.json({ success: true, message: 'Product deactivated' });
  })
);

export default router;
