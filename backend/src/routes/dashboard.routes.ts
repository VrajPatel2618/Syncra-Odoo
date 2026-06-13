import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { inventoryService } from '../services/inventory.service';
import { blockchainService } from '../services/blockchain.service';

const router = Router();

router.get(
  '/stats',
  authenticate,
  asyncHandler(async (_req, res) => {
    const [
      totalProducts,
      totalCustomers,
      totalVendors,
      salesOrders,
      purchaseOrders,
      manufacturingOrders,
      inventory,
      deliveries,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.customer.count({ where: { isActive: true } }),
      prisma.vendor.count({ where: { isActive: true } }),
      prisma.salesOrder.findMany({ include: { items: true } }),
      prisma.purchaseOrder.findMany(),
      prisma.manufacturingOrder.findMany(),
      prisma.inventory.findMany({ include: { product: true } }),
      prisma.delivery.findMany(),
    ]);

    const totalRevenue = salesOrders
      .filter((o) => o.status === 'FULLY_DELIVERED')
      .reduce((s, o) => s + Number(o.totalAmount), 0);

    const pendingDeliveries = deliveries.filter((d) => d.status !== 'DELIVERED').length;
    const delayedOrders = salesOrders.filter(
      (o) => o.deliveryDate && new Date(o.deliveryDate) < new Date() && o.status !== 'FULLY_DELIVERED'
    ).length;

    const lowStockAlerts = inventory.filter(
      (i) => i.onHandQty - i.reservedQty <= i.product.reorderPoint
    ).length;

    const monthlySales = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const monthOrders = salesOrders.filter((o) => {
        const d = new Date(o.orderDate);
        return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
      });
      return {
        month: date.toLocaleString('en', { month: 'short' }),
        revenue: monthOrders.reduce((s, o) => s + Number(o.totalAmount), 0),
        orders: monthOrders.length,
      };
    });

    res.json({
      success: true,
      data: {
        kpis: {
          totalSalesOrders: salesOrders.length,
          pendingDeliveries,
          manufacturingOrders: manufacturingOrders.filter((m) => m.status === 'IN_PROGRESS').length,
          delayedOrders,
          inventoryAlerts: lowStockAlerts,
          totalRevenue,
          totalProducts,
          totalCustomers,
          totalVendors,
        },
        charts: { monthlySales },
        blockchain: blockchainService.getStatus(),
      },
    });
  })
);

router.get(
  '/activity',
  authenticate,
  asyncHandler(async (_req, res) => {
    const [auditLogs, movements, notifications] = await Promise.all([
      prisma.auditLog.findMany({ take: 20, orderBy: { createdAt: 'desc' }, include: { user: { select: { firstName: true, lastName: true } } } }),
      prisma.stockMovement.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { product: true } }),
      prisma.notification.findMany({ take: 10, orderBy: { createdAt: 'desc' } }),
    ]);
    res.json({ success: true, data: { auditLogs, movements, notifications } });
  })
);

export default router;
