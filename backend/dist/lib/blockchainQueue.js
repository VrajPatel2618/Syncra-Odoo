"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enqueueStockMoveTx = exports.enqueuePurchaseOrderTx = exports.enqueueSalesOrderTx = exports.bgQueue = void 0;
const blockchain_service_1 = require("../services/blockchain.service");
const prisma_1 = __importDefault(require("../lib/prisma"));
const logger_1 = require("../lib/logger");
// Very simple in-memory queue to process blockchain txs asynchronously without blocking the API
class BlockchainQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
    }
    async enqueue(task) {
        this.queue.push(task);
        if (!this.processing) {
            this.processNext();
        }
    }
    async processNext() {
        if (this.queue.length === 0) {
            this.processing = false;
            return;
        }
        this.processing = true;
        const task = this.queue.shift();
        if (task) {
            try {
                await task();
            }
            catch (error) {
                logger_1.logger.error('BlockchainQueue Task Error:', error);
            }
        }
        // Process next item after a short delay
        setTimeout(() => this.processNext(), 1000);
    }
}
exports.bgQueue = new BlockchainQueue();
const enqueueSalesOrderTx = (orderId) => {
    exports.bgQueue.enqueue(async () => {
        const order = await prisma_1.default.salesOrder.findUnique({ where: { id: orderId }, include: { customer: true, items: true } });
        if (!order)
            return;
        try {
            const data = {
                reference: order.orderNumber,
                customer: order.customer.name,
                orderDate: order.orderDate.toISOString(),
                totalAmount: order.totalAmount.toString(),
                linesCount: order.items.length
            };
            const result = await blockchain_service_1.blockchainService.recordOrder('sales_order', data, { customer: data.customer, total: data.totalAmount });
            await prisma_1.default.salesOrder.update({
                where: { id: order.id },
                data: {
                    blockchainTxHash: result.txHash,
                    blockchainBlock: result.block,
                    blockchainVerified: true
                }
            });
            await new Promise(r => setTimeout(r, 2000));
            const latestLog = await prisma_1.default.auditLog.findFirst({ where: { entityId: order.id }, orderBy: { createdAt: 'desc' } });
            if (latestLog) {
                await prisma_1.default.auditLog.update({ where: { id: latestLog.id }, data: { blockchainHash: result.dataHash, verified: true } });
            }
            logger_1.logger.info(`SalesOrder ${order.orderNumber} successfully recorded on Polygon.`);
        }
        catch (e) {
            logger_1.logger.error(`Failed to record SalesOrder ${order.orderNumber} on blockchain`, e);
        }
    });
};
exports.enqueueSalesOrderTx = enqueueSalesOrderTx;
const enqueuePurchaseOrderTx = (orderId) => {
    exports.bgQueue.enqueue(async () => {
        const order = await prisma_1.default.purchaseOrder.findUnique({ where: { id: orderId }, include: { vendor: true, items: true } });
        if (!order)
            return;
        try {
            const data = {
                reference: order.orderNumber,
                vendor: order.vendor.name,
                orderDate: order.orderDate.toISOString(),
                totalAmount: order.totalAmount.toString(),
            };
            const result = await blockchain_service_1.blockchainService.recordOrder('purchase_order', data, { vendor: data.vendor, total: data.totalAmount });
            await prisma_1.default.purchaseOrder.update({
                where: { id: order.id },
                data: {
                    blockchainTxHash: result.txHash,
                    blockchainBlock: result.block,
                    blockchainVerified: true
                }
            });
            const latestLog = await prisma_1.default.auditLog.findFirst({ where: { entityId: order.id }, orderBy: { createdAt: 'desc' } });
            if (latestLog) {
                await prisma_1.default.auditLog.update({ where: { id: latestLog.id }, data: { blockchainHash: result.dataHash, verified: true } });
            }
            logger_1.logger.info(`PurchaseOrder ${order.orderNumber} successfully recorded on Polygon.`);
        }
        catch (e) {
            logger_1.logger.error(`Failed to record PO ${order.orderNumber} on blockchain`, e);
        }
    });
};
exports.enqueuePurchaseOrderTx = enqueuePurchaseOrderTx;
const enqueueStockMoveTx = (moveId) => {
    exports.bgQueue.enqueue(async () => {
        const move = await prisma_1.default.stockMovement.findUnique({ where: { id: moveId }, include: { product: true } });
        if (!move)
            return;
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
            const result = await blockchain_service_1.blockchainService.recordStockMove(data);
            await prisma_1.default.stockMovement.update({
                where: { id: move.id },
                data: {
                    blockchainTxHash: result.txHash,
                    blockchainBlock: result.block,
                    blockchainVerified: true
                }
            });
            await new Promise(r => setTimeout(r, 2000));
            const latestLog = await prisma_1.default.auditLog.findFirst({ where: { entityId: move.id }, orderBy: { createdAt: 'desc' } });
            if (latestLog) {
                await prisma_1.default.auditLog.update({ where: { id: latestLog.id }, data: { blockchainHash: result.dataHash, verified: true } });
            }
            logger_1.logger.info(`StockMovement ${move.id} successfully recorded on Polygon.`);
        }
        catch (e) {
            logger_1.logger.error(`Failed to record StockMove ${move.id} on blockchain`, e);
        }
    });
};
exports.enqueueStockMoveTx = enqueueStockMoveTx;
