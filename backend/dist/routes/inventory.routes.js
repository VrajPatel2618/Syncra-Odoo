"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const inventory_service_1 = require("../services/inventory.service");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, (0, auth_1.requireModuleAccess)('inventory'), (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const inventory = await prisma_1.default.inventory.findMany({
        include: { product: { include: { category: true } }, warehouse: true },
        orderBy: { updatedAt: 'desc' },
    });
    const enriched = inventory.map((i) => ({
        ...i,
        freeQty: i.onHandQty - i.reservedQty,
        isLowStock: i.onHandQty - i.reservedQty <= i.product.reorderPoint,
    }));
    res.json({ success: true, data: enriched });
}));
router.get('/movements', auth_1.authenticate, (0, auth_1.requireModuleAccess)('inventory'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { productId, limit = '50' } = req.query;
    const movements = await prisma_1.default.stockMovement.findMany({
        where: productId ? { productId: productId } : undefined,
        include: { product: true },
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: movements });
}));
router.get('/alerts', auth_1.authenticate, (0, auth_1.requireModuleAccess)('inventory'), (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const inventory = await prisma_1.default.inventory.findMany({
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
}));
router.post('/adjust', auth_1.authenticate, (0, auth_1.requireModuleAccess)('inventory', true), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { productId, warehouseId, quantity, movementType, notes } = req.body;
    const movement = await inventory_service_1.inventoryService.adjustStock({
        productId,
        warehouseId,
        quantity,
        movementType: movementType || 'ADJUSTMENT',
        notes,
        userId: req.user.id,
    });
    res.json({ success: true, data: movement });
}));
router.post('/transfer', auth_1.authenticate, (0, auth_1.requireModuleAccess)('inventory', true), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { productId, fromWarehouseId, toWarehouseId, quantity } = req.body;
    await inventory_service_1.inventoryService.adjustStock({
        productId,
        warehouseId: fromWarehouseId,
        quantity,
        movementType: 'OUT',
        referenceType: 'TRANSFER',
        notes: `Transfer to warehouse ${toWarehouseId}`,
        userId: req.user.id,
    });
    const movement = await inventory_service_1.inventoryService.adjustStock({
        productId,
        warehouseId: toWarehouseId,
        quantity,
        movementType: 'IN',
        referenceType: 'TRANSFER',
        notes: `Transfer from warehouse ${fromWarehouseId}`,
        userId: req.user.id,
    });
    res.json({ success: true, data: movement });
}));
exports.default = router;
