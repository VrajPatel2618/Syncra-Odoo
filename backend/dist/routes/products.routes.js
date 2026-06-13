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
const generateSku = () => `SFW-${Date.now().toString(36).toUpperCase()}`;
router.get('/', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { category, search, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await prisma_1.default.product.findMany({
        where: {
            isActive: true,
            ...(category && { categoryId: category }),
            ...(search && {
                OR: [
                    { name: { contains: search } },
                    { sku: { contains: search } },
                ],
            }),
        },
        include: { category: true, inventory: { include: { warehouse: true } } },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
    });
    const enriched = products.map((p) => ({
        ...p,
        salesPrice: Number(p.salesPrice),
        costPrice: Number(p.costPrice),
        totalOnHand: p.inventory.reduce((s, i) => s + i.onHandQty, 0),
        totalReserved: p.inventory.reduce((s, i) => s + i.reservedQty, 0),
        freeQty: p.inventory.reduce((s, i) => s + (i.onHandQty - i.reservedQty), 0),
    }));
    res.json({ success: true, data: enriched });
}));
router.get('/categories', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const categories = await prisma_1.default.category.findMany({ include: { _count: { select: { products: true } } } });
    res.json({ success: true, data: categories });
}));
router.get('/:id', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const product = await prisma_1.default.product.findUnique({
        where: { id: req.params.id },
        include: {
            category: true,
            inventory: { include: { warehouse: true } },
            stockMovements: { take: 20, orderBy: { createdAt: 'desc' } },
        },
    });
    if (!product)
        throw new errorHandler_1.AppError('Product not found', 404);
    res.json({ success: true, data: product });
}));
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('SUPER_ADMIN', 'ADMIN', 'MANAGER'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { name, description, categoryId, salesPrice, costPrice, procurementStrategy, reorderPoint, reorderQty, isRawMaterial, isFinishedGood, imageUrl } = req.body;
    const product = await prisma_1.default.product.create({
        data: {
            sku: generateSku(),
            name,
            description,
            categoryId,
            salesPrice,
            costPrice,
            procurementStrategy: procurementStrategy || 'MTS',
            reorderPoint: reorderPoint || 10,
            reorderQty: reorderQty || 50,
            isRawMaterial: isRawMaterial || false,
            isFinishedGood: isFinishedGood ?? true,
            imageUrl,
            qrCode: `QR-${Date.now()}`,
        },
        include: { category: true },
    });
    res.status(201).json({ success: true, data: product });
}));
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)('SUPER_ADMIN', 'ADMIN', 'MANAGER'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const product = await prisma_1.default.product.update({
        where: { id: req.params.id },
        data: req.body,
        include: { category: true },
    });
    res.json({ success: true, data: product });
}));
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)('SUPER_ADMIN', 'ADMIN'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await prisma_1.default.product.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'Product deactivated' });
}));
exports.default = router;
