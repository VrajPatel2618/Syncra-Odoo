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
router.get('/orders', auth_1.authenticate, (0, auth_1.requireModuleAccess)('manufacturing'), (0, errorHandler_1.asyncHandler)(async (_req, res) => {
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
router.get('/work-centers', auth_1.authenticate, (0, auth_1.requireModuleAccess)('manufacturing'), (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const centers = await prisma_1.default.workCenter.findMany({ include: { _count: { select: { workOrders: true } } } });
    res.json({ success: true, data: centers });
}));
router.get('/boms', auth_1.authenticate, (0, auth_1.requireModuleAccess)('manufacturing'), (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const boms = await prisma_1.default.billOfMaterial.findMany({
        include: {
            finishedProduct: true,
            components: { include: { product: true } },
            operations: { include: { workCenter: true } },
        },
    });
    res.json({ success: true, data: boms });
}));
router.post('/orders', auth_1.authenticate, (0, auth_1.requireModuleAccess)('manufacturing', true), (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
router.patch('/orders/:id/start', auth_1.authenticate, (0, auth_1.requireModuleAccess)('manufacturing', true), (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
router.patch('/orders/:id/complete', auth_1.authenticate, (0, auth_1.requireModuleAccess)('manufacturing', true), (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
router.post('/boms', auth_1.authenticate, (0, auth_1.requireModuleAccess)('manufacturing', true), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { name, finishedProductId, productionDuration, totalCost, components, operations } = req.body;
    if (!components || components.length === 0)
        throw new errorHandler_1.AppError('BoM must have at least 1 component', 400);
    if (!operations || operations.length === 0)
        throw new errorHandler_1.AppError('BoM must have at least 1 operation', 400);
    const bom = await prisma_1.default.billOfMaterial.create({
        data: {
            name,
            finishedProductId,
            productionDuration,
            totalCost,
            version: "1.0",
            components: {
                create: components.map((c) => ({
                    productId: c.productId,
                    quantity: c.quantity,
                    unit: c.unit || "pcs",
                }))
            },
            operations: {
                create: operations.map((o, idx) => ({
                    workCenterId: o.workCenterId,
                    sequence: o.sequence || idx + 1,
                    name: o.name,
                    duration: o.duration,
                }))
            }
        },
        include: { components: true, operations: true }
    });
    res.status(201).json({ success: true, data: bom });
}));
router.put('/boms/:id', auth_1.authenticate, (0, auth_1.requireModuleAccess)('manufacturing', true), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const id = req.params.id;
    const { name, finishedProductId, productionDuration, totalCost, components, operations } = req.body;
    if (!components || components.length === 0)
        throw new errorHandler_1.AppError('BoM must have at least 1 component', 400);
    if (!operations || operations.length === 0)
        throw new errorHandler_1.AppError('BoM must have at least 1 operation', 400);
    const oldBom = await prisma_1.default.billOfMaterial.findUnique({ where: { id } });
    if (!oldBom)
        throw new errorHandler_1.AppError('BoM not found', 404);
    // Deactivate old version
    await prisma_1.default.billOfMaterial.update({
        where: { id },
        data: { isActive: false }
    });
    // Calculate new version number
    const versionParts = oldBom.version.split('.');
    const newVersion = versionParts.length === 2
        ? `${versionParts[0]}.${parseInt(versionParts[1]) + 1}`
        : `${oldBom.version}.1`;
    const newBom = await prisma_1.default.billOfMaterial.create({
        data: {
            name,
            finishedProductId,
            productionDuration,
            totalCost,
            version: newVersion,
            isActive: true,
            components: {
                create: components.map((c) => ({
                    productId: c.productId,
                    quantity: c.quantity,
                    unit: c.unit || "pcs",
                }))
            },
            operations: {
                create: operations.map((o, idx) => ({
                    workCenterId: o.workCenterId,
                    sequence: o.sequence || idx + 1,
                    name: o.name,
                    duration: o.duration,
                }))
            }
        },
        include: { components: true, operations: true }
    });
    res.json({ success: true, data: newBom });
}));
router.delete('/boms/:id', auth_1.authenticate, (0, auth_1.requireModuleAccess)('manufacturing', true), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await prisma_1.default.billOfMaterial.delete({ where: { id: req.params.id } });
    res.json({ success: true });
}));
router.patch('/boms/:id/status', auth_1.authenticate, (0, auth_1.requireModuleAccess)('manufacturing', true), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { isActive } = req.body;
    const bom = await prisma_1.default.billOfMaterial.update({
        where: { id: req.params.id },
        data: { isActive }
    });
    res.json({ success: true, data: bom });
}));
router.post('/boms/:id/clone', auth_1.authenticate, (0, auth_1.requireModuleAccess)('manufacturing', true), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const id = req.params.id;
    const oldBom = await prisma_1.default.billOfMaterial.findUnique({
        where: { id },
        include: { components: true, operations: true }
    });
    if (!oldBom)
        throw new errorHandler_1.AppError('BoM not found', 404);
    const cloned = await prisma_1.default.billOfMaterial.create({
        data: {
            name: `${oldBom.name} (Clone)`,
            finishedProductId: oldBom.finishedProductId,
            productionDuration: oldBom.productionDuration,
            totalCost: oldBom.totalCost,
            version: "1.0",
            isActive: false,
            components: {
                create: oldBom.components.map((c) => ({
                    productId: c.productId,
                    quantity: c.quantity,
                    unit: c.unit,
                }))
            },
            operations: {
                create: oldBom.operations.map((o) => ({
                    workCenterId: o.workCenterId,
                    sequence: o.sequence,
                    name: o.name,
                    duration: o.duration,
                }))
            }
        },
        include: { components: true, operations: true }
    });
    res.status(201).json({ success: true, data: cloned });
}));
router.get('/boms/:id/impact', auth_1.authenticate, (0, auth_1.requireModuleAccess)('manufacturing'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const id = req.params.id;
    const qty = parseInt(req.query.qty) || 1;
    const bom = await prisma_1.default.billOfMaterial.findUnique({
        where: { id },
        include: {
            components: { include: { product: true } },
            operations: { include: { workCenter: true } }
        }
    });
    if (!bom)
        throw new errorHandler_1.AppError('BoM not found', 404);
    const impact = {
        quantityToProduce: qty,
        components: [],
        totalDuration: 0,
        operations: []
    };
    for (const comp of bom.components) {
        const required = comp.quantity * qty;
        const freeQty = await inventory_service_1.inventoryService.getFreeQty(comp.productId);
        impact.components.push({
            product: comp.product,
            required,
            available: freeQty,
            shortage: Math.max(0, required - freeQty)
        });
    }
    for (const op of bom.operations) {
        const duration = op.duration * qty;
        impact.totalDuration += duration;
        impact.operations.push({
            workCenter: op.workCenter,
            name: op.name,
            duration
        });
    }
    res.json({ success: true, data: impact });
}));
exports.default = router;
