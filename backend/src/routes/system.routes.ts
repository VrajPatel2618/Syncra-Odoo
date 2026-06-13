import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { aiService } from '../services/ai.service';
import { blockchainService } from '../services/blockchain.service';

const router = Router();

router.post('/chat', authenticate, asyncHandler(async (req, res) => {
  const { message } = req.body;
  const result = await aiService.chat(message);
  res.json({ success: true, data: result });
}));

router.get('/insights', authenticate, asyncHandler(async (_req, res) => {
  const insights = await aiService.getInsights();
  res.json({ success: true, data: insights });
}));

router.get('/blockchain/status', authenticate, asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await blockchainService.getStats() });
}));

router.get('/blockchain/logs', authenticate, asyncHandler(async (req, res) => {
  const { limit = '50' } = req.query;
  const logs = await prisma.blockchainLog.findMany({
    take: parseInt(limit as string),
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: logs });
}));

router.get('/audit-logs', authenticate, asyncHandler(async (req, res) => {
  const { limit = '50', entityType } = req.query;
  const logs = await prisma.auditLog.findMany({
    where: entityType ? { entityType: entityType as string } : undefined,
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
    take: parseInt(limit as string),
    orderBy: { createdAt: 'desc' },
  });

  const enrichedLogs = await Promise.all(logs.map(async (log) => {
    let referenceNumber = log.entityId;
    if (!log.entityId) return log;
    try {
      if (log.entityType === 'SalesOrder') {
        const entity = await prisma.salesOrder.findUnique({ where: { id: log.entityId } });
        if (entity) referenceNumber = entity.orderNumber;
      } else if (log.entityType === 'PurchaseOrder') {
        const entity = await prisma.purchaseOrder.findUnique({ where: { id: log.entityId } });
        if (entity) referenceNumber = entity.orderNumber;
      } else if (log.entityType === 'StockMovement') {
        referenceNumber = log.entityId.substring(0, 8); // Because we used substring(0,8) for stock movements on chain
      }
    } catch(e) {}
    return { ...log, entityId: referenceNumber };
  }));

  res.json({ success: true, data: enrichedLogs });
}));

router.get('/notifications', authenticate, asyncHandler(async (req: import('../middleware/auth').AuthRequest, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ success: true, data: notifications });
}));

router.patch('/notifications/:id/read', authenticate, asyncHandler(async (req, res) => {
  await prisma.notification.update({ where: { id: req.params.id as string }, data: { isRead: true } });
  res.json({ success: true });
}));

router.get('/health', asyncHandler(async (_req, res) => {
  let dbStatus = 'healthy';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'unhealthy';
  }
  res.json({
    success: true,
    data: {
      api: 'healthy',
      database: dbStatus,
      blockchain: await blockchainService.getStats(),
      ai: { openai: !!process.env.OPENAI_API_KEY, gemini: !!process.env.GEMINI_API_KEY },
      timestamp: new Date().toISOString(),
    },
  });
}));

export default router;
