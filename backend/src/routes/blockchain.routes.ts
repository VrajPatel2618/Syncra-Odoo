import { Router } from 'express';
import { blockchainService } from '../services/blockchain.service';
import { authenticate, requireModuleAccess } from '../middleware/auth';

const router = Router();

router.post('/verify', authenticate, requireModuleAccess('blockchain'), async (req, res) => {
  try {
    if (!blockchainService.enabled || !blockchainService.erpLedger) {
      return res.status(400).json({ error: "Blockchain is not enabled" });
    }

    const { reference, computedHash } = req.body;
    if (!reference || !computedHash) return res.status(400).json({ error: "Missing reference or computedHash" });

    const record = await blockchainService.erpLedger.getRecordByReference(reference);
    const isValid = await blockchainService.erpLedger.verifyDataHash(record.id, computedHash);
    const history = await blockchainService.erpLedger.getStatusHistory(record.id);

    const isAmoy = process.env.POLYGON_RPC_URL?.includes('amoy');
    const explorerBase = isAmoy ? 'https://amoy.polygonscan.com' : 'https://polygonscan.com';

    res.json({
      isValid,
      onChainHash: record.dataHash,
      computedHash,
      statusHistory: history.map((h: any) => ({
        oldStatus: h.oldStatus.toString(),
        newStatus: h.newStatus.toString(),
        reason: h.reason,
        timestamp: h.timestamp.toString(),
        updatedBy: h.updatedBy
      })),
      polygonscanUrl: `${explorerBase}/address/${process.env.ERP_LEDGER_ADDRESS}`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stock-history', authenticate, requireModuleAccess('blockchain'), async (req, res) => {
  try {
    if (!blockchainService.enabled || !blockchainService.stockVerifier) {
      return res.status(400).json({ error: "Blockchain is not enabled" });
    }

    const { productCode } = req.query;
    if (!productCode) return res.status(400).json({ error: "Missing productCode" });

    const history = await blockchainService.stockVerifier.getProductHistory(productCode as string);
    
    res.json(history.map((e: any) => ({
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', authenticate, requireModuleAccess('blockchain'), async (req, res) => {
  try {
    const stats = await blockchainService.getStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
