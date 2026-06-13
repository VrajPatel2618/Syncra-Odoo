"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const ai_service_1 = require("../services/ai.service");
const blockchain_service_1 = require("../services/blockchain.service");
const router = (0, express_1.Router)();
router.post('/chat', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { message } = req.body;
    const result = await ai_service_1.aiService.chat(message);
    res.json({ success: true, data: result });
}));
router.get('/insights', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const insights = await ai_service_1.aiService.getInsights();
    res.json({ success: true, data: insights });
}));
router.get('/blockchain/status', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    res.json({ success: true, data: await blockchain_service_1.blockchainService.getStats() });
}));
router.get('/blockchain/logs', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { limit = '50' } = req.query;
    const logs = await prisma_1.default.blockchainLog.findMany({
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: logs });
}));
router.get('/audit-logs', auth_1.authenticate, (0, auth_1.requireModuleAccess)('audit_log'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { limit = '50', entityType } = req.query;
    const logs = await prisma_1.default.auditLog.findMany({
        where: entityType ? { entityType: entityType } : undefined,
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
    });
    const enrichedLogs = await Promise.all(logs.map(async (log) => {
        let referenceNumber = log.entityId;
        try {
            if (log.entityId && log.entityType === 'SalesOrder') {
                const entity = await prisma_1.default.salesOrder.findUnique({ where: { id: log.entityId } });
                if (entity)
                    referenceNumber = entity.orderNumber;
            }
            else if (log.entityId && log.entityType === 'PurchaseOrder') {
                const entity = await prisma_1.default.purchaseOrder.findUnique({ where: { id: log.entityId } });
                if (entity)
                    referenceNumber = entity.orderNumber;
            }
            else if (log.entityId && log.entityType === 'StockMovement') {
                referenceNumber = log.entityId.substring(0, 8); // Because we used substring(0,8) for stock movements on chain
            }
        }
        catch (e) { }
        return { ...log, entityId: referenceNumber };
    }));
    res.json({ success: true, data: enrichedLogs });
}));
router.get('/notifications', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const notifications = await prisma_1.default.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });
    res.json({ success: true, data: notifications });
}));
router.patch('/notifications/:id/read', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await prisma_1.default.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
    res.json({ success: true });
}));
router.get('/health', (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    let dbStatus = 'healthy';
    try {
        await prisma_1.default.$queryRaw `SELECT 1`;
    }
    catch {
        dbStatus = 'unhealthy';
    }
    res.json({
        success: true,
        data: {
            api: 'healthy',
            database: dbStatus,
            blockchain: await blockchain_service_1.blockchainService.getStats(),
            ai: { openai: !!process.env.OPENAI_API_KEY, gemini: !!process.env.GEMINI_API_KEY },
            timestamp: new Date().toISOString(),
        },
    });
}));
exports.default = router;
