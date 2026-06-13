import { PrismaClient } from '@prisma/client';
import { enqueueSalesOrderTx, enqueuePurchaseOrderTx, enqueueStockMoveTx, bgQueue } from './blockchainQueue';
import { blockchainService } from '../services/blockchain.service';
import { logger } from './logger';

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
        const dataStatus = typeof args.data.status === 'string' ? args.data.status : (args.data.status as any)?.set;
        
        if (dataStatus === 'CONFIRMED' && !result.blockchainTxHash) {
          enqueueSalesOrderTx(result.id as string);
        } else if (dataStatus && result.blockchainVerified) {
          bgQueue.enqueue(async () => {
             await blockchainService.updateOrderStatus(result.orderNumber as string, result.status as string);
             logger.info(`Status update for ${result.orderNumber} sent to Polygon.`);
          });
        }
        return result;
      }
    },
    purchaseOrder: {
      async update({ args, query }) {
        const result = await query(args);
        const dataStatus = typeof args.data.status === 'string' ? args.data.status : (args.data.status as any)?.set;
        
        if (dataStatus === 'CONFIRMED' && !result.blockchainTxHash) {
          enqueuePurchaseOrderTx(result.id as string);
        } else if (dataStatus && result.blockchainVerified) {
          bgQueue.enqueue(async () => {
             await blockchainService.updateOrderStatus(result.orderNumber as string, result.status as string);
          });
        }
        return result;
      }
    },
    stockMovement: {
      async create({ args, query }) {
        const result = await query(args);
        if (!result.blockchainTxHash) {
          enqueueStockMoveTx(result.id as string);
        }
        return result;
      }
    }
  }
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaBase;

export default prisma;
