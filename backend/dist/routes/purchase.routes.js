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
const genNumber = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}`;
router.get('/', auth_1.authenticate, (0, auth_1.requireModuleAccess)('purchase'), (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const orders = await prisma_1.default.purchaseOrder.findMany({
        include: { vendor: true, items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: orders });
}));
router.post('/', auth_1.authenticate, (0, auth_1.requireModuleAccess)('purchase', true), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { vendorId, items, expectedDate, notes } = req.body;
    let subtotal = 0;
    const orderItems = items.map((item) => {
        const total = item.quantity * item.unitPrice;
        subtotal += total;
        return { productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice, totalPrice: total };
    });
    const taxAmount = subtotal * 0.18;
    const order = await prisma_1.default.purchaseOrder.create({
        data: {
            orderNumber: genNumber('PO'),
            vendorId,
            expectedDate: expectedDate ? new Date(expectedDate) : null,
            notes,
            subtotal,
            taxAmount,
            totalAmount: subtotal + taxAmount,
            items: { create: orderItems },
        },
        include: { vendor: true, items: { include: { product: true } } },
    });
    res.status(201).json({ success: true, data: order });
}));
router.patch('/:id/confirm', auth_1.authenticate, (0, auth_1.requireModuleAccess)('purchase', true), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const order = await prisma_1.default.purchaseOrder.update({
        where: { id: req.params.id },
        data: { status: 'CONFIRMED' },
        include: { vendor: true, items: true },
    });
    await prisma_1.default.auditLog.create({
        data: { userId: req.user.id, action: 'CONFIRM', entityType: 'PurchaseOrder', entityId: order.id },
    });
    res.json({ success: true, data: order });
}));
router.patch('/:id/receive', auth_1.authenticate, (0, auth_1.requireModuleAccess)('purchase', true), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const order = await prisma_1.default.purchaseOrder.findUnique({
        where: { id: req.params.id },
        include: { items: true },
    });
    if (!order)
        throw new errorHandler_1.AppError('Order not found', 404);
    const warehouse = await prisma_1.default.warehouse.findFirst({ where: { isActive: true } });
    if (!warehouse)
        throw new errorHandler_1.AppError('No active warehouse', 400);
    for (const item of order.items) {
        const receiveQty = item.quantity - item.receivedQty;
        if (receiveQty > 0) {
            await inventory_service_1.inventoryService.adjustStock({
                productId: item.productId,
                warehouseId: warehouse.id,
                quantity: receiveQty,
                movementType: 'IN',
                referenceType: 'PurchaseOrder',
                referenceId: order.id,
                userId: req.user.id,
            });
            await prisma_1.default.purchaseItem.update({
                where: { id: item.id },
                data: { receivedQty: item.quantity },
            });
        }
    }
    const updated = await prisma_1.default.purchaseOrder.update({
        where: { id: order.id },
        data: { status: 'FULLY_RECEIVED' },
        include: { vendor: true, items: { include: { product: true } } },
    });
    res.json({ success: true, data: updated });
}));
exports.default = router;
