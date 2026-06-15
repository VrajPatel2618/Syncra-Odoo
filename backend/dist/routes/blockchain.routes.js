"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const blockchain_service_1 = require("../services/blockchain.service");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/verify', auth_1.authenticate, (0, auth_1.requireModuleAccess)('blockchain'), async (req, res) => {
    try {
        if (!blockchain_service_1.blockchainService.enabled || !blockchain_service_1.blockchainService.erpLedger || !blockchain_service_1.blockchainService.stockVerifier) {
            return res.status(400).json({ error: "Blockchain is not fully enabled" });
        }
        const { reference, computedHash } = req.body;
        if (!reference || !computedHash)
            return res.status(400).json({ error: "Missing reference or computedHash" });
        const ref = reference.trim();
        const hashToVerify = computedHash.trim();
        let isValid = false;
        let onChainHash = '';
        let statusHistory = [];
        // Try ERPLedger first
        const record = await blockchain_service_1.blockchainService.erpLedger.getRecordByReference(ref);
        if (record && record.id > 0n) {
            isValid = await blockchain_service_1.blockchainService.erpLedger.verifyDataHash(record.id, hashToVerify);
            onChainHash = record.dataHash;
            const history = await blockchain_service_1.blockchainService.erpLedger.getStatusHistory(record.id);
            statusHistory = history.map((h) => ({
                oldStatus: h.oldStatus.toString(),
                newStatus: h.newStatus.toString(),
                reason: h.reason,
                timestamp: h.timestamp.toString(),
                updatedBy: h.updatedBy
            }));
        }
        else {
            // Try StockVerifier if not found in ERPLedger
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            const stockMove = await prisma.stockMovement.findFirst({
                where: { id: { startsWith: ref } },
                include: { product: true }
            });
            await prisma.$disconnect();
            if (stockMove && stockMove.product) {
                const history = await blockchain_service_1.blockchainService.stockVerifier.getProductHistory(stockMove.product.sku);
                const move = history.find((h) => h.moveReference === ref);
                if (move) {
                    isValid = (move.dataHash === hashToVerify);
                    onChainHash = move.dataHash;
                }
                else {
                    return res.status(404).json({ error: "Record not found on blockchain." });
                }
            }
            else {
                return res.status(404).json({ error: "Record not found in ERP Ledger or Stock Verifier." });
            }
        }
        const isAmoy = process.env.POLYGON_RPC_URL?.includes('amoy');
        const explorerBase = isAmoy ? 'https://amoy.polygonscan.com' : 'https://polygonscan.com';
        res.json({
            isValid,
            onChainHash,
            computedHash: hashToVerify,
            statusHistory,
            polygonscanUrl: `${explorerBase}/address/${process.env.ERP_LEDGER_ADDRESS}`
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/stock-history', auth_1.authenticate, (0, auth_1.requireModuleAccess)('blockchain'), async (req, res) => {
    try {
        if (!blockchain_service_1.blockchainService.enabled || !blockchain_service_1.blockchainService.stockVerifier) {
            return res.status(400).json({ error: "Blockchain is not enabled" });
        }
        const { productCode } = req.query;
        if (!productCode)
            return res.status(400).json({ error: "Missing productCode" });
        const history = await blockchain_service_1.blockchainService.stockVerifier.getProductHistory(productCode);
        res.json(history.map((e) => ({
            moveReference: e.moveReference,
            productCode: e.productCode,
            fromLocation: e.fromLocation,
            toLocation: e.toLocation,
            quantity: Number(e.quantity) / 1000,
            uom: e.uom,
            dataHash: e.dataHash,
            timestamp: e.timestamp.toString(),
            moveType: e.moveType
        })));
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/stats', auth_1.authenticate, (0, auth_1.requireModuleAccess)('blockchain'), async (req, res) => {
    try {
        const stats = await blockchain_service_1.blockchainService.getStats();
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
