import { PrismaClient } from '@prisma/client';
import { enqueueSalesOrderTx, enqueuePurchaseOrderTx, enqueueStockMoveTx, bgQueue } from './blockchainQueue';
import { blockchainService } from '../services/blockchain.service';
import logger from './logger';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const prismaBase =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

export const prisma = prismaBase.$extends({
  query: {
    salesOrder: {
      async update({ args, query }) {
        const result = await query(args);
        // If status changed to CONFIRMED, enqueue for blockchain
        if (args.data.status && args.data.status === 'CONFIRMED' && !result.blockchainTxHash) {
          enqueueSalesOrderTx(result.id);
        }
        // If status changed to something else and it's already verified, update status on chain
        else if (args.data.status && result.blockchainVerified) {
          bgQueue.enqueue(async () => {
             await blockchainService.updateOrderStatus(result.orderNumber, result.status);
             logger.info(`Status update for ${result.orderNumber} sent to Polygon.`);
          });
        }
        return result;
      }
    },
    purchaseOrder: {
      async update({ args, query }) {
        const result = await query(args);
        if (args.data.status && args.data.status === 'CONFIRMED' && !result.blockchainTxHash) {
          enqueuePurchaseOrderTx(result.id);
        }
        else if (args.data.status && result.blockchainVerified) {
          bgQueue.enqueue(async () => {
             await blockchainService.updateOrderStatus(result.orderNumber, result.status);
          });
        }
        return result;
      }
    },
    stockMovement: {
      async update({ args, query }) {
        const result = await query(args);
        if (args.data.status && args.data.status === 'COMPLETED' && !result.blockchainTxHash) {
          enqueueStockMoveTx(result.id);
        }
        return result;
      }
    }
  }
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaBase;

export default prisma;
