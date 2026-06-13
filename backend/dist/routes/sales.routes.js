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
const blockchain_service_1 = require("../services/blockchain.service");
const router = (0, express_1.Router)();
const genNumber = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}`;
router.get('/', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const orders = await prisma_1.default.salesOrder.findMany({
        include: { customer: true, items: { include: { product: true } }, deliveries: true },
        orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: orders.map(o => ({ ...o, subtotal: Number(o.subtotal), taxAmount: Number(o.taxAmount), totalAmount: Number(o.totalAmount) })) });
}));
router.get('/:id', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const order = await prisma_1.default.salesOrder.findUnique({
        where: { id: req.params.id },
        include: { customer: true, items: { include: { product: true } }, deliveries: true, invoices: true, payments: true },
    });
    if (!order)
        throw new errorHandler_1.AppError('Order not found', 404);
    res.json({ success: true, data: order });
}));
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { customerId, items, deliveryDate, notes } = req.body;
    let subtotal = 0;
    const orderItems = items.map((item) => {
        const total = item.quantity * item.unitPrice;
        subtotal += total;
        return { productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice, totalPrice: total };
    });
    const taxAmount = subtotal * 0.18;
    const order = await prisma_1.default.salesOrder.create({
        data: {
            orderNumber: genNumber('SO'),
            customerId,
            deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
            notes,
            subtotal,
            taxAmount,
            totalAmount: subtotal + taxAmount,
            items: { create: orderItems },
        },
        include: { customer: true, items: { include: { product: true } } },
    });
    res.status(201).json({ success: true, data: order });
}));
router.patch('/:id/confirm', auth_1.authenticate, (0, auth_1.authorize)('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const order = await prisma_1.default.salesOrder.findUnique({
        where: { id: req.params.id },
        include: { items: { include: { product: true } } },
    });
    if (!order)
        throw new errorHandler_1.AppError('Order not found', 404);
    if (order.status !== 'DRAFT')
        throw new errorHandler_1.AppError('Order already confirmed', 400);
    const warehouse = await prisma_1.default.warehouse.findFirst({ where: { isActive: true } });
    if (!warehouse)
        throw new errorHandler_1.AppError('No active warehouse', 400);
    for (const item of order.items) {
        const freeQty = await inventory_service_1.inventoryService.getFreeQty(item.productId);
        if (freeQty < item.quantity) {
            const procurement = await inventory_service_1.inventoryService.checkAndTriggerProcurement(item.productId);
            if (procurement) {
                await prisma_1.default.notification.create({
                    data: {
                        userId: req.user.id,
                        type: 'PROCUREMENT',
                        title: 'Stock Shortage Detected',
                        message: `${item.product.name} needs ${item.quantity - freeQty} more units. Suggested: ${procurement.action}`,
                        link: '/procurement',
                    },
                });
            }
        }
        await inventory_service_1.inventoryService.adjustStock({
            productId: item.productId,
            warehouseId: warehouse.id,
            quantity: Math.min(item.quantity, freeQty),
            movementType: 'RESERVATION',
            referenceType: 'SalesOrder',
            referenceId: order.id,
            userId: req.user.id,
        });
    }
    const { hash } = await blockchain_service_1.blockchainService.recordAudit({
        eventType: 'SALES_CONFIRMED',
        entityType: 'SalesOrder',
        entityId: order.id,
        data: { orderNumber: order.orderNumber, total: Number(order.totalAmount) },
    });
    const updated = await prisma_1.default.salesOrder.update({
        where: { id: order.id },
        data: { status: 'CONFIRMED' },
        include: { customer: true, items: { include: { product: true } } },
    });
    await prisma_1.default.auditLog.create({
        data: { userId: req.user.id, action: 'CONFIRM', entityType: 'SalesOrder', entityId: order.id, blockchainHash: hash, verified: true },
    });
    res.json({ success: true, data: updated });
}));
router.patch('/:id/deliver', auth_1.authenticate, (0, auth_1.authorize)('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'WAREHOUSE'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const order = await prisma_1.default.salesOrder.findUnique({
        where: { id: req.params.id },
        include: { items: true },
    });
    if (!order)
        throw new errorHandler_1.AppError('Order not found', 404);
    const warehouse = await prisma_1.default.warehouse.findFirst({ where: { isActive: true } });
    if (!warehouse)
        throw new errorHandler_1.AppError('No active warehouse', 400);
    for (const item of order.items) {
        const deliverQty = item.quantity - item.deliveredQty;
        if (deliverQty > 0) {
            await inventory_service_1.inventoryService.adjustStock({
                productId: item.productId,
                warehouseId: warehouse.id,
                quantity: deliverQty,
                movementType: 'RELEASE',
                referenceType: 'SalesOrder',
                referenceId: order.id,
                userId: req.user.id,
            });
            await inventory_service_1.inventoryService.adjustStock({
                productId: item.productId,
                warehouseId: warehouse.id,
                quantity: deliverQty,
                movementType: 'OUT',
                referenceType: 'SalesOrder',
                referenceId: order.id,
                userId: req.user.id,
            });
            await prisma_1.default.salesItem.update({
                where: { id: item.id },
                data: { deliveredQty: item.quantity },
            });
        }
    }
    const allDelivered = order.items.every(i => i.quantity === i.deliveredQty || i.quantity === i.quantity);
    const { hash } = await blockchain_service_1.blockchainService.recordAudit({
        eventType: 'DELIVERY_COMPLETED',
        entityType: 'SalesOrder',
        entityId: order.id,
        data: { orderNumber: order.orderNumber },
    });
    const updated = await prisma_1.default.salesOrder.update({
        where: { id: order.id },
        data: { status: 'FULLY_DELIVERED' },
        include: { customer: true, items: { include: { product: true } } },
    });
    await prisma_1.default.delivery.create({
        data: {
            deliveryNumber: genNumber('DEL'),
            salesOrderId: order.id,
            status: 'DELIVERED',
            deliveredDate: new Date(),
            blockchainHash: hash,
        },
    });
    res.json({ success: true, data: updated });
}));
exports.default = router;
