"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const blockchain_service_1 = require("../services/blockchain.service");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/verify', auth_1.authenticate, (0, auth_1.requireModuleAccess)('blockchain'), async (req, res) => {
    try {
        if (!blockchain_service_1.blockchainService.enabled || !blockchain_service_1.blockchainService.erpLedger) {
            return res.status(400).json({ error: "Blockchain is not enabled" });
        }
        const { reference, computedHash } = req.body;
        if (!reference || !computedHash)
            return res.status(400).json({ error: "Missing reference or computedHash" });
        const record = await blockchain_service_1.blockchainService.erpLedger.getRecordByReference(reference);
        const isValid = await blockchain_service_1.blockchainService.erpLedger.verifyDataHash(record.id, computedHash);
        const history = await blockchain_service_1.blockchainService.erpLedger.getStatusHistory(record.id);
        const isAmoy = process.env.POLYGON_RPC_URL?.includes('amoy');
        const explorerBase = isAmoy ? 'https://amoy.polygonscan.com' : 'https://polygonscan.com';
        res.json({
            isValid,
            onChainHash: record.dataHash,
            computedHash,
            statusHistory: history.map((h) => ({
                oldStatus: h.oldStatus.toString(),
                newStatus: h.newStatus.toString(),
                reason: h.reason,
                timestamp: h.timestamp.toString(),
                updatedBy: h.updatedBy
            })),
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
