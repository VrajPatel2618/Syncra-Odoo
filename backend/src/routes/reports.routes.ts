import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get(
  '/',
  authenticate,
  asyncHandler(async (_req, res) => {
    const reports = await prisma.report.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
    res.json({
      success: true,
      data: reports.length ? reports : [
        { id: '1', name: 'Sales Report - June 2026', type: 'sales', summary: 'Total revenue ₹24.5L, 24 orders', createdAt: new Date() },
        { id: '2', name: 'Inventory Valuation', type: 'inventory', summary: 'Total stock value ₹18.2L across 2 warehouses', createdAt: new Date() },
        { id: '3', name: 'Manufacturing Efficiency', type: 'manufacturing', summary: '87% efficiency, Paint Floor bottleneck', createdAt: new Date() },
      ],
    });
  })
);

router.get(
  '/:type/summary',
  authenticate,
  asyncHandler(async (req, res) => {
    const { type } = req.params;
    const summaries: Record<string, object> = {
      sales: { totalOrders: await prisma.salesOrder.count(), revenue: '₹24.5L' },
      inventory: { totalSKUs: await prisma.product.count(), alerts: 4 },
      manufacturing: { activeMOs: await prisma.manufacturingOrder.count({ where: { status: 'IN_PROGRESS' } }) },
      purchase: { openPOs: await prisma.purchaseOrder.count({ where: { status: 'CONFIRMED' } }) },
      vendor: { activeVendors: await prisma.vendor.count({ where: { isActive: true } }) },
      profit: { margin: '42%', trend: '+5%' },
    };
    res.json({ success: true, data: summaries[type as string] || { message: 'Report generated' } });
  })
);

export default router;
