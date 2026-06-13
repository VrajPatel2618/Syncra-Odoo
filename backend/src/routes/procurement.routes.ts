import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { inventoryService } from '../services/inventory.service';

const router = Router();

router.get(
  '/rules',
  authenticate,
  asyncHandler(async (_req, res) => {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { inventory: true },
    });

    const rules = await Promise.all(
      products.map(async (p) => {
        const freeQty = p.inventory.reduce((s, i) => s + (i.onHandQty - i.reservedQty), 0);
        const triggered = freeQty <= p.reorderPoint;
        let suggestedAction = 'NONE';
        if (triggered) {
          if (p.procurementStrategy === 'MTS' && p.isFinishedGood) {
            suggestedAction = 'MANUFACTURING';
          } else {
            suggestedAction = 'PURCHASE';
          }
        }
        return {
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          freeQty,
          reorderPoint: p.reorderPoint,
          reorderQty: p.reorderQty,
          strategy: p.procurementStrategy,
          suggestedAction,
          status: triggered ? 'triggered' : 'active',
        };
      })
    );

    res.json({
      success: true,
      data: {
        rules: rules.filter((r) => r.suggestedAction !== 'NONE' || r.status === 'active'),
        summary: {
          shortages: rules.filter((r) => r.status === 'triggered').length,
          suggestedMOs: rules.filter((r) => r.suggestedAction === 'MANUFACTURING').length,
          suggestedPOs: rules.filter((r) => r.suggestedAction === 'PURCHASE').length,
        },
      },
    });
  })
);

router.post(
  '/execute/:productId',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'PURCHASE'),
  asyncHandler(async (req: AuthRequest, res) => {
    const result = await inventoryService.checkAndTriggerProcurement(req.params.productId as string);
    if (!result) {
      return res.json({ success: true, message: 'No procurement action needed', data: null });
    }

    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        type: 'PROCUREMENT',
        title: 'Procurement Executed',
        message: `${result.action} suggested for product with qty ${result.suggestedQty}`,
        link: result.action === 'MANUFACTURING' ? '/manufacturing' : '/purchases',
      },
    });

    res.json({ success: true, data: result });
  })
);

export default router;
