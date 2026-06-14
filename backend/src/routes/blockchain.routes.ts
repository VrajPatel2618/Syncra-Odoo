import { Router } from 'express';
import { blockchainService } from '../services/blockchain.service';
import { authenticate, requireModuleAccess } from '../middleware/auth';

const router = Router();

router.post('/verify', authenticate, requireModuleAccess('blockchain'), async (req, res) => {
  try {
    if (!blockchainService.enabled || !blockchainService.erpLedger || !blockchainService.stockVerifier) {
      return res.status(400).json({ error: "Blockchain is not fully enabled" });
    }

    const { reference, computedHash } = req.body;
    if (!reference || !computedHash) return res.status(400).json({ error: "Missing reference or computedHash" });

    const ref = reference.trim();
    const hashToVerify = computedHash.trim();

    let isValid = false;
    let onChainHash = '';
    let statusHistory: any[] = [];

    // Try ERPLedger first
    const record = await blockchainService.erpLedger.getRecordByReference(ref);
    if (record && record.id > 0n) {
      isValid = await blockchainService.erpLedger.verifyDataHash(record.id, hashToVerify);
      onChainHash = record.dataHash;
      const history = await blockchainService.erpLedger.getStatusHistory(record.id);
      statusHistory = history.map((h: any) => ({
        oldStatus: h.oldStatus.toString(),
        newStatus: h.newStatus.toString(),
        reason: h.reason,
        timestamp: h.timestamp.toString(),
        updatedBy: h.updatedBy
      }));
    } else {
      // Try StockVerifier if not found in ERPLedger
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      const stockMove = await prisma.stockMovement.findFirst({ 
        where: { id: { startsWith: ref } },
        include: { product: true }
      });
      await prisma.$disconnect();

      if (stockMove && stockMove.product) {
        const history = await blockchainService.stockVerifier.getProductHistory(stockMove.product.sku);
        const move = history.find((h: any) => h.moveReference === ref);
        if (move) {
          isValid = (move.dataHash === hashToVerify);
          onChainHash = move.dataHash;
        } else {
          return res.status(404).json({ error: "Record not found on blockchain." });
        }
      } else {
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
