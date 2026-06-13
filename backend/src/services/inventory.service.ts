import prisma from '../lib/prisma';
import { MovementType } from '@prisma/client';
import { blockchainService } from './blockchain.service';
import { AppError } from '../middleware/errorHandler';

export class InventoryService {
  async getFreeQty(productId: string, warehouseId?: string): Promise<number> {
    const where = warehouseId ? { productId, warehouseId } : { productId };
    const inventories = await prisma.inventory.findMany({ where });
    return inventories.reduce((sum, inv) => sum + (inv.onHandQty - inv.reservedQty), 0);
  }

  async adjustStock(params: {
    productId: string;
    warehouseId: string;
    quantity: number;
    movementType: MovementType;
    referenceType?: string;
    referenceId?: string;
    notes?: string;
    userId?: string;
  }) {
    const { productId, warehouseId, quantity, movementType, referenceType, referenceId, notes, userId } = params;

    const inventory = await prisma.inventory.upsert({
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
        if (previousQty < quantity) throw new AppError('Insufficient stock', 400);
        newQty = previousQty - quantity;
        break;
      case 'ADJUSTMENT':
        newQty = quantity;
        break;
      case 'RESERVATION':
        if (inventory.onHandQty - inventory.reservedQty < quantity) {
          throw new AppError('Insufficient free stock to reserve', 400);
        }
        await prisma.inventory.update({
          where: { id: inventory.id },
          data: { reservedQty: inventory.reservedQty + quantity },
        });
        break;
      case 'RELEASE':
        await prisma.inventory.update({
          where: { id: inventory.id },
          data: { reservedQty: Math.max(0, inventory.reservedQty - quantity) },
        });
        break;
      default:
        break;
    }

    if (['IN', 'OUT', 'ADJUSTMENT', 'MANUFACTURING_CONSUME', 'MANUFACTURING_PRODUCE'].includes(movementType)) {
      await prisma.inventory.update({
        where: { id: inventory.id },
        data: { onHandQty: newQty },
      });
    }

    const { hash, txHash } = await blockchainService.recordAudit({
      eventType: 'STOCK_MOVEMENT',
      entityType: 'Inventory',
      entityId: inventory.id,
      data: { productId, warehouseId, movementType, quantity, previousQty, newQty },
    });

    const movement = await prisma.stockMovement.create({
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
        blockchainHash: hash,
        verified: true,
      },
      include: { product: true },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: movementType,
        entityType: 'StockMovement',
        entityId: movement.id,
        newValue: { quantity, previousQty, newQty, txHash },
        blockchainHash: hash,
        verified: true,
      },
    });

    return movement;
  }

  async checkAndTriggerProcurement(productId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return null;

    const freeQty = await this.getFreeQty(productId);
    if (freeQty > product.reorderPoint) return null;

    if (product.procurementStrategy === 'MTS' && product.isFinishedGood) {
      const bom = await prisma.billOfMaterial.findFirst({
        where: { finishedProductId: productId, isActive: true },
      });
      if (bom) {
        return { action: 'MANUFACTURING', productId, suggestedQty: product.reorderQty };
      }
    }

    return { action: 'PURCHASE', productId, suggestedQty: product.reorderQty };
  }
}

export const inventoryService = new InventoryService();
