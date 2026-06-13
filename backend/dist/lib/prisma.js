"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const blockchainQueue_1 = require("./blockchainQueue");
const blockchain_service_1 = require("../services/blockchain.service");
const logger_1 = require("./logger");
const globalForPrisma = globalThis;
const prismaBase = globalForPrisma.prisma ||
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
exports.prisma = prismaBase.$extends({
    query: {
        salesOrder: {
            async update({ args, query }) {
                const result = await query(args);
                const dataStatus = typeof args.data.status === 'string' ? args.data.status : args.data.status?.set;
                if (dataStatus === 'CONFIRMED' && !result.blockchainTxHash) {
                    (0, blockchainQueue_1.enqueueSalesOrderTx)(result.id);
                }
                else if (dataStatus && result.blockchainVerified) {
                    blockchainQueue_1.bgQueue.enqueue(async () => {
                        await blockchain_service_1.blockchainService.updateOrderStatus(result.orderNumber, result.status);
                        logger_1.logger.info(`Status update for ${result.orderNumber} sent to Polygon.`);
                    });
                }
                return result;
            }
        },
        purchaseOrder: {
            async update({ args, query }) {
                const result = await query(args);
                const dataStatus = typeof args.data.status === 'string' ? args.data.status : args.data.status?.set;
                if (dataStatus === 'CONFIRMED' && !result.blockchainTxHash) {
                    (0, blockchainQueue_1.enqueuePurchaseOrderTx)(result.id);
                }
                else if (dataStatus && result.blockchainVerified) {
                    blockchainQueue_1.bgQueue.enqueue(async () => {
                        await blockchain_service_1.blockchainService.updateOrderStatus(result.orderNumber, result.status);
                    });
                }
                return result;
            }
        },
        stockMovement: {
            async create({ args, query }) {
                const result = await query(args);
                if (!result.blockchainTxHash) {
                    (0, blockchainQueue_1.enqueueStockMoveTx)(result.id);
                }
                return result;
            }
        }
    }
});
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = prismaBase;
exports.default = exports.prisma;
