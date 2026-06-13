import { blockchainService } from '../services/blockchain.service';
import prisma from '../lib/prisma';
import { logger } from '../lib/logger';

// Very simple in-memory queue to process blockchain txs asynchronously without blocking the API
class BlockchainQueue {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;

  public async enqueue(task: () => Promise<void>) {
    this.queue.push(task);
    if (!this.processing) {
      this.processNext();
    }
  }

  private async processNext() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }
    this.processing = true;
    const task = this.queue.shift();
    if (task) {
      try {
        await task();
      } catch (error) {
        logger.error('BlockchainQueue Task Error:', error);
      }
    }
    // Process next item after a short delay
    setTimeout(() => this.processNext(), 1000);
  }
}

export const bgQueue = new BlockchainQueue();

export const enqueueSalesOrderTx = (orderId: string) => {
  bgQueue.enqueue(async () => {
    const order = await prisma.salesOrder.findUnique({ where: { id: orderId }, include: { customer: true, items: true } });
    if (!order) return;

    try {
      const data = {
        reference: order.orderNumber,
        customer: order.customer.name,
        orderDate: order.orderDate.toISOString(),
        totalAmount: order.totalAmount.toString(),
        linesCount: order.items.length
      };
      
      const result = await blockchainService.recordOrder('sales_order', data, { customer: data.customer, total: data.totalAmount });
      
      await prisma.salesOrder.update({
        where: { id: order.id },
        data: {
          blockchainTxHash: result.txHash,
          blockchainBlock: result.block,
          blockchainVerified: true
        }
      });
      await new Promise(r => setTimeout(r, 2000));
      const latestLog = await prisma.auditLog.findFirst({ where: { entityId: order.id }, orderBy: { createdAt: 'desc' } });
      if (latestLog) {
        await prisma.auditLog.update({ where: { id: latestLog.id }, data: { blockchainHash: result.dataHash, verified: true } });
      }
      logger.info(`SalesOrder ${order.orderNumber} successfully recorded on Polygon.`);
    } catch (e: any) {
      logger.error(`Failed to record SalesOrder ${order.orderNumber} on blockchain`, e);
    }
  });
};

export const enqueuePurchaseOrderTx = (orderId: string) => {
  bgQueue.enqueue(async () => {
    const order = await prisma.purchaseOrder.findUnique({ where: { id: orderId }, include: { vendor: true, items: true } });
    if (!order) return;

    try {
      const data = {
        reference: order.orderNumber,
        vendor: order.vendor.name,
        orderDate: order.orderDate.toISOString(),
        totalAmount: order.totalAmount.toString(),
      };
      
      const result = await blockchainService.recordOrder('purchase_order', data, { vendor: data.vendor, total: data.totalAmount });
      
      await prisma.purchaseOrder.update({
        where: { id: order.id },
        data: {
          blockchainTxHash: result.txHash,
          blockchainBlock: result.block,
          blockchainVerified: true
        }
      });
      const latestLog = await prisma.auditLog.findFirst({ where: { entityId: order.id }, orderBy: { createdAt: 'desc' } });
      if (latestLog) {
        await prisma.auditLog.update({ where: { id: latestLog.id }, data: { blockchainHash: result.dataHash, verified: true } });
      }
      logger.info(`PurchaseOrder ${order.orderNumber} successfully recorded on Polygon.`);
    } catch (e: any) {
      logger.error(`Failed to record PO ${order.orderNumber} on blockchain`, e);
    }
  });
};

export const enqueueStockMoveTx = (moveId: string) => {
  bgQueue.enqueue(async () => {
    const move = await prisma.stockMovement.findUnique({ where: { id: moveId }, include: { product: true } });
    if (!move) return;

    try {
      const data = {
        reference: move.id.substring(0, 8),
        productCode: move.product.sku,
        fromLocation: 'VARIES',
        toLocation: move.warehouseId || 'VARIES',
        quantity: move.quantity,
        uom: 'pcs',
        moveType: move.movementType
      };
      
      const result = await blockchainService.recordStockMove(data);
      
      await prisma.stockMovement.update({
        where: { id: move.id },
        data: {
          blockchainTxHash: result.txHash,
          blockchainBlock: result.block,
          blockchainVerified: true
        }
      });
      await new Promise(r => setTimeout(r, 2000));
      const latestLog = await prisma.auditLog.findFirst({ where: { entityId: move.id }, orderBy: { createdAt: 'desc' } });
      if (latestLog) {
        await prisma.auditLog.update({ where: { id: latestLog.id }, data: { blockchainHash: result.dataHash, verified: true } });
      }
      logger.info(`StockMovement ${move.id} successfully recorded on Polygon.`);
    } catch (e: any) {
      logger.error(`Failed to record StockMove ${move.id} on blockchain`, e);
    }
  });
};
