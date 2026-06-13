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
router.get('/orders', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const orders = await prisma_1.default.manufacturingOrder.findMany({
        include: {
            bom: { include: { finishedProduct: true, components: { include: { product: true } } } },
            workCenter: true,
            workOrders: true,
        },
        orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: orders });
}));
router.get('/work-centers', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const centers = await prisma_1.default.workCenter.findMany({ include: { _count: { select: { workOrders: true } } } });
    res.json({ success: true, data: centers });
}));
router.get('/boms', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const boms = await prisma_1.default.billOfMaterial.findMany({
        include: {
            finishedProduct: true,
            components: { include: { product: true } },
            operations: { include: { workCenter: true } },
        },
    });
    res.json({ success: true, data: boms });
}));
router.post('/orders', auth_1.authenticate, (0, auth_1.authorize)('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MANUFACTURING'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { bomId, quantity, workCenterId, scheduledDate } = req.body;
    const order = await prisma_1.default.manufacturingOrder.create({
        data: {
            orderNumber: genNumber('MO'),
            bomId,
            quantity,
            workCenterId,
            scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
            status: 'PLANNED',
        },
        include: { bom: { include: { finishedProduct: true, components: { include: { product: true } } } } },
    });
    res.status(201).json({ success: true, data: order });
}));
router.patch('/orders/:id/start', auth_1.authenticate, (0, auth_1.authorize)('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MANUFACTURING'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const order = await prisma_1.default.manufacturingOrder.findUnique({
        where: { id: req.params.id },
        include: { bom: { include: { components: true, operations: { include: { workCenter: true } } } } },
    });
    if (!order)
        throw new errorHandler_1.AppError('MO not found', 404);
    const warehouse = await prisma_1.default.warehouse.findFirst({ where: { isActive: true } });
    if (!warehouse)
        throw new errorHandler_1.AppError('No active warehouse', 400);
    for (const comp of order.bom.components) {
        const needed = comp.quantity * order.quantity;
        const freeQty = await inventory_service_1.inventoryService.getFreeQty(comp.productId);
        if (freeQty < needed)
            throw new errorHandler_1.AppError(`Insufficient ${comp.productId} for manufacturing`, 400);
        await inventory_service_1.inventoryService.adjustStock({
            productId: comp.productId,
            warehouseId: warehouse.id,
            quantity: needed,
            movementType: 'RESERVATION',
            referenceType: 'ManufacturingOrder',
            referenceId: order.id,
            userId: req.user.id,
        });
    }
    for (const op of order.bom.operations) {
        await prisma_1.default.workOrder.create({
            data: {
                orderNumber: genNumber('WO'),
                manufacturingOrderId: order.id,
                workCenterId: op.workCenterId,
                status: 'PENDING',
            },
        });
    }
    const updated = await prisma_1.default.manufacturingOrder.update({
        where: { id: order.id },
        data: { status: 'IN_PROGRESS' },
        include: { workOrders: { include: { workCenter: true } }, bom: { include: { finishedProduct: true } } },
    });
    res.json({ success: true, data: updated });
}));
router.patch('/orders/:id/complete', auth_1.authenticate, (0, auth_1.authorize)('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MANUFACTURING'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const order = await prisma_1.default.manufacturingOrder.findUnique({
        where: { id: req.params.id },
        include: { bom: { include: { components: true, finishedProduct: true } } },
    });
    if (!order)
        throw new errorHandler_1.AppError('MO not found', 404);
    const warehouse = await prisma_1.default.warehouse.findFirst({ where: { isActive: true } });
    if (!warehouse)
        throw new errorHandler_1.AppError('No active warehouse', 400);
    for (const comp of order.bom.components) {
        const needed = comp.quantity * order.quantity;
        await inventory_service_1.inventoryService.adjustStock({
            productId: comp.productId,
            warehouseId: warehouse.id,
            quantity: needed,
            movementType: 'RELEASE',
            referenceType: 'ManufacturingOrder',
            referenceId: order.id,
            userId: req.user.id,
        });
        await inventory_service_1.inventoryService.adjustStock({
            productId: comp.productId,
            warehouseId: warehouse.id,
            quantity: needed,
            movementType: 'MANUFACTURING_CONSUME',
            referenceType: 'ManufacturingOrder',
            referenceId: order.id,
            userId: req.user.id,
        });
    }
    await inventory_service_1.inventoryService.adjustStock({
        productId: order.bom.finishedProductId,
        warehouseId: warehouse.id,
        quantity: order.quantity,
        movementType: 'MANUFACTURING_PRODUCE',
        referenceType: 'ManufacturingOrder',
        referenceId: order.id,
        userId: req.user.id,
    });
    const { hash } = await blockchain_service_1.blockchainService.recordAudit({
        eventType: 'MANUFACTURING_COMPLETED',
        entityType: 'ManufacturingOrder',
        entityId: order.id,
        data: { orderNumber: order.orderNumber, quantity: order.quantity },
    });
    await prisma_1.default.workOrder.updateMany({
        where: { manufacturingOrderId: order.id },
        data: { status: 'COMPLETED', endTime: new Date() },
    });
    const updated = await prisma_1.default.manufacturingOrder.update({
        where: { id: order.id },
        data: { status: 'COMPLETED', producedQty: order.quantity, completedDate: new Date() },
        include: { bom: { include: { finishedProduct: true } } },
    });
    res.json({ success: true, data: updated });
}));
exports.default = router;
