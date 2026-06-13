"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryService = exports.InventoryService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
class InventoryService {
    async getFreeQty(productId, warehouseId) {
        const where = warehouseId ? { productId, warehouseId } : { productId };
        const inventories = await prisma_1.default.inventory.findMany({ where });
        return inventories.reduce((sum, inv) => sum + (inv.onHandQty - inv.reservedQty), 0);
    }
    async adjustStock(params) {
        const { productId, warehouseId, quantity, movementType, referenceType, referenceId, notes, userId } = params;
        const inventory = await prisma_1.default.inventory.upsert({
            where: { productId_warehouseId: { productId, warehouseId } },
            create: { productId, warehouseId, onHandQty: 0, reservedQty: 0 },
            update: {},
        });
        const previousQty = inventory.onHandQty;
        let newQty = previousQty;
        switch (movementType) {
            case 'IN':
            case 'MANUFACTURING_PRODUCE':
                newQty = previousQty + quantity;
                break;
            case 'OUT':
            case 'MANUFACTURING_CONSUME':
                if (previousQty < quantity)
                    throw new errorHandler_1.AppError('Insufficient stock', 400);
                newQty = previousQty - quantity;
                break;
            case 'ADJUSTMENT':
                newQty = quantity;
                break;
            case 'RESERVATION':
                if (inventory.onHandQty - inventory.reservedQty < quantity) {
                    throw new errorHandler_1.AppError('Insufficient free stock to reserve', 400);
                }
                await prisma_1.default.inventory.update({
                    where: { id: inventory.id },
                    data: { reservedQty: inventory.reservedQty + quantity },
                });
                break;
            case 'RELEASE':
                await prisma_1.default.inventory.update({
                    where: { id: inventory.id },
                    data: { reservedQty: Math.max(0, inventory.reservedQty - quantity) },
                });
                break;
            default:
                break;
        }
        if (['IN', 'OUT', 'ADJUSTMENT', 'MANUFACTURING_CONSUME', 'MANUFACTURING_PRODUCE'].includes(movementType)) {
            await prisma_1.default.inventory.update({
                where: { id: inventory.id },
                data: { onHandQty: newQty },
            });
        }
        const movement = await prisma_1.default.stockMovement.create({
            data: {
                productId,
                warehouseId,
                movementType,
                quantity,
                previousQty,
                newQty: ['RESERVATION', 'RELEASE'].includes(movementType) ? previousQty : newQty,
                referenceType,
                referenceId,
                notes,
            },
            include: { product: true },
        });
        await prisma_1.default.auditLog.create({
            data: {
                userId,
                action: movementType,
                entityType: 'StockMovement',
                entityId: movement.id,
                newValue: JSON.stringify({ quantity, previousQty, newQty }),
            },
        });
        return movement;
    }
    async checkAndTriggerProcurement(productId) {
        const product = await prisma_1.default.product.findUnique({ where: { id: productId } });
        if (!product)
            return null;
        const freeQty = await this.getFreeQty(productId);
        if (freeQty > product.reorderPoint)
            return null;
        if (product.procurementStrategy === 'MTS' && product.isFinishedGood) {
            const bom = await prisma_1.default.billOfMaterial.findFirst({
                where: { finishedProductId: productId, isActive: true },
            });
            if (bom) {
                return { action: 'MANUFACTURING', productId, suggestedQty: product.reorderQty };
            }
        }
        return { action: 'PURCHASE', productId, suggestedQty: product.reorderQty };
    }
}
exports.InventoryService = InventoryService;
exports.inventoryService = new InventoryService();
