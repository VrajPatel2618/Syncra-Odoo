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
router.get('/rules', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const products = await prisma_1.default.product.findMany({
        where: { isActive: true },
        include: { inventory: true },
    });
    const rules = await Promise.all(products.map(async (p) => {
        const freeQty = p.inventory.reduce((s, i) => s + (i.onHandQty - i.reservedQty), 0);
        const triggered = freeQty <= p.reorderPoint;
        let suggestedAction = 'NONE';
        if (triggered) {
            if (p.procurementStrategy === 'MTS' && p.isFinishedGood) {
                suggestedAction = 'MANUFACTURING';
            }
            else {
                suggestedAction = 'PURCHASE';
            }
        }
        return {
            productId: p.id,
            productName: p.name,
            sku: p.sku,
            freeQty,
            reorderPoint: p.reorderPoint,
            reorderQty: p.reorderQty,
            strategy: p.procurementStrategy,
            suggestedAction,
            status: triggered ? 'triggered' : 'active',
        };
    }));
    res.json({
        success: true,
        data: {
            rules: rules.filter((r) => r.suggestedAction !== 'NONE' || r.status === 'active'),
            summary: {
                shortages: rules.filter((r) => r.status === 'triggered').length,
                suggestedMOs: rules.filter((r) => r.suggestedAction === 'MANUFACTURING').length,
                suggestedPOs: rules.filter((r) => r.suggestedAction === 'PURCHASE').length,
            },
        },
    });
}));
router.post('/execute/:productId', auth_1.authenticate, (0, auth_1.authorize)('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'PURCHASE'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await inventory_service_1.inventoryService.checkAndTriggerProcurement(req.params.productId);
    if (!result) {
        return res.json({ success: true, message: 'No procurement action needed', data: null });
    }
    await prisma_1.default.notification.create({
        data: {
            userId: req.user.id,
            type: 'PROCUREMENT',
            title: 'Procurement Executed',
            message: `${result.action} suggested for product with qty ${result.suggestedQty}`,
            link: result.action === 'MANUFACTURING' ? '/manufacturing' : '/purchases',
        },
    });
    res.json({ success: true, data: result });
}));
exports.default = router;
