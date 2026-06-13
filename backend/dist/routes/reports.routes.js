"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const reports = await prisma_1.default.report.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
    res.json({
        success: true,
        data: reports.length ? reports : [
            { id: '1', name: 'Sales Report - June 2026', type: 'sales', summary: 'Total revenue ₹24.5L, 24 orders', createdAt: new Date() },
            { id: '2', name: 'Inventory Valuation', type: 'inventory', summary: 'Total stock value ₹18.2L across 2 warehouses', createdAt: new Date() },
            { id: '3', name: 'Manufacturing Efficiency', type: 'manufacturing', summary: '87% efficiency, Paint Floor bottleneck', createdAt: new Date() },
        ],
    });
}));
router.get('/:type/summary', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { type } = req.params;
    const summaries = {
        sales: { totalOrders: await prisma_1.default.salesOrder.count(), revenue: '₹24.5L' },
        inventory: { totalSKUs: await prisma_1.default.product.count(), alerts: 4 },
        manufacturing: { activeMOs: await prisma_1.default.manufacturingOrder.count({ where: { status: 'IN_PROGRESS' } }) },
        purchase: { openPOs: await prisma_1.default.purchaseOrder.count({ where: { status: 'CONFIRMED' } }) },
        vendor: { activeVendors: await prisma_1.default.vendor.count({ where: { isActive: true } }) },
        profit: { margin: '42%', trend: '+5%' },
    };
    res.json({ success: true, data: summaries[type] || { message: 'Report generated' } });
}));
exports.default = router;
