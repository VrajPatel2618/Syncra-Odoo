"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const permissions_1 = require("../lib/permissions");
const blockchain_service_1 = require("../services/blockchain.service");
const router = (0, express_1.Router)();
router.get('/stats', auth_1.authenticate, (0, auth_1.requireModuleAccess)('dashboard'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const level = (0, permissions_1.getAccessLevel)(req.user.role, 'dashboard');
    const isLimited = level === 'limited';
    const [totalProducts, totalCustomers, totalVendors, salesOrders, purchaseOrders, manufacturingOrders, inventory, deliveries,] = await Promise.all([
        prisma_1.default.product.count({ where: { isActive: true } }),
        prisma_1.default.customer.count({ where: { isActive: true } }),
        prisma_1.default.vendor.count({ where: { isActive: true } }),
        prisma_1.default.salesOrder.findMany({ where: isLimited ? { createdById: req.user.id } : {}, include: { items: true } }),
        prisma_1.default.purchaseOrder.findMany(),
        prisma_1.default.manufacturingOrder.findMany(),
        prisma_1.default.inventory.findMany({ include: { product: true } }),
        prisma_1.default.delivery.findMany(),
    ]);
    const totalRevenue = salesOrders
        .filter((o) => o.status === 'FULLY_DELIVERED')
        .reduce((s, o) => s + Number(o.totalAmount), 0);
    const pendingDeliveries = deliveries.filter((d) => d.status !== 'DELIVERED').length;
    const delayedOrders = salesOrders.filter((o) => o.deliveryDate && new Date(o.deliveryDate) < new Date() && o.status !== 'FULLY_DELIVERED').length;
    const lowStockAlerts = inventory.filter((i) => i.onHandQty - i.reservedQty <= i.product.reorderPoint).length;
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
    if (isLimited) {
        return res.json({
            success: true,
            data: {
                totalRevenue,
                salesOrders: salesOrders.length,
                pendingDeliveries,
                delayedOrders,
                monthlySales,
                isLimited: true,
            }
        });
    }
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
            blockchain: await blockchain_service_1.blockchainService.getStats(),
        },
    });
}));
router.get('/activity', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const [auditLogs, movements, notifications] = await Promise.all([
        prisma_1.default.auditLog.findMany({ take: 20, orderBy: { createdAt: 'desc' }, include: { user: { select: { firstName: true, lastName: true } } } }),
        prisma_1.default.stockMovement.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { product: true } }),
        prisma_1.default.notification.findMany({ take: 10, orderBy: { createdAt: 'desc' } }),
    ]);
    res.json({ success: true, data: { auditLogs, movements, notifications } });
}));
exports.default = router;
