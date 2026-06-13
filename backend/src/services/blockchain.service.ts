import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logger } from '../lib/logger';

// Load deployed addresses
let ERPLedgerAddress = process.env.ERP_LEDGER_ADDRESS || '';
let StockVerifierAddress = process.env.STOCK_VERIFIER_ADDRESS || '';

try {
  const deployedPath = path.join(__dirname, '../../../blockchain/deployed_addresses.json');
  if (fs.existsSync(deployedPath)) {
    const addresses = JSON.parse(fs.readFileSync(deployedPath, 'utf8'));
    ERPLedgerAddress = addresses.ERPLedger || ERPLedgerAddress;
    StockVerifierAddress = addresses.StockVerifier || StockVerifierAddress;
  }
} catch (e) {
  logger.warn('Could not load deployed_addresses.json', e);
}

// Minimal ABIs required for our service
const ERPLedgerABI = [
  "function createRecord(uint8 _type, string _referenceNumber, string _dataHash, string _metadata) external returns (uint256)",
  "function updateStatus(uint256 _recordId, uint8 _newStatus, string _reason) external",
  "function getRecordByReference(string _ref) external view returns (tuple(uint256 id, uint8 recordType, string referenceNumber, string dataHash, address recordedBy, uint256 timestamp, uint8 status, string metadata))",
  "function getStatusHistory(uint256 _id) external view returns (tuple(uint256 recordId, uint8 oldStatus, uint8 newStatus, string reason, address updatedBy, uint256 timestamp)[])",
  "function verifyDataHash(uint256 _id, string _hash) external view returns (bool)",
  "function getTotalRecords() external view returns (uint256)"
];

const StockVerifierABI = [
  "function recordStockMove(string _moveReference, string _productCode, string _fromLocation, string _toLocation, uint256 _quantity, string _uom, string _dataHash, string _moveType) external returns (uint256)",
  "function getProductHistory(string productCode) external view returns (tuple(string moveReference, string productCode, string fromLocation, string toLocation, uint256 quantity, string uom, string dataHash, address recordedBy, uint256 timestamp, string moveType)[])"
];

class BlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  public erpLedger: ethers.Contract | null = null;
  public stockVerifier: ethers.Contract | null = null;
  private isEnabled: boolean = false;

  constructor() {
    this.isEnabled = process.env.BLOCKCHAIN_ENABLED === 'true';
    if (!this.isEnabled) return;

    try {
      this.provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology');
      
      if (process.env.BLOCKCHAIN_PRIVATE_KEY) {
        this.wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, this.provider);
        
        if (ERPLedgerAddress) {
          this.erpLedger = new ethers.Contract(ERPLedgerAddress, ERPLedgerABI, this.wallet);
        }
        if (StockVerifierAddress) {
          this.stockVerifier = new ethers.Contract(StockVerifierAddress, StockVerifierABI, this.wallet);
        }
      }
    } catch (error) {
      logger.error('Failed to initialize BlockchainService', error);
      this.isEnabled = false;
    }
  }

  public get enabled() { return this.isEnabled; }

  private computeHash(data: any): string {
    const sortedString = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(sortedString).digest('hex');
  }

  public async recordOrder(type: 'sales_order' | 'purchase_order' | 'manufacturing_order', data: any, metadata: any) {
    if (!this.isEnabled || !this.erpLedger) throw new Error("Blockchain not enabled or configured");

    const typeMap = { 'sales_order': 1, 'purchase_order': 2, 'manufacturing_order': 3 };
    const dataHash = this.computeHash(data);
    const metaString = JSON.stringify(metadata);

    const tx = await this.erpLedger.createRecord(typeMap[type], data.reference, dataHash, metaString);
    const receipt = await tx.wait();

    return { txHash: tx.hash, dataHash, block: receipt.blockNumber };
  }

  public async updateOrderStatus(reference: string, newStatus: string, reason: string = '') {
    if (!this.isEnabled || !this.erpLedger) return null;

    const statusMap: Record<string, number> = { 'draft': 0, 'created': 0, 'confirmed': 1, 'in_progress': 2, 'completed': 3, 'delivered': 3, 'cancelled': 4 };
    const statusInt = statusMap[newStatus.toLowerCase()] || 0;

    const record = await this.erpLedger.getRecordByReference(reference);
    const tx = await this.erpLedger.updateStatus(record.id, statusInt, reason);
    const receipt = await tx.wait();

    return { txHash: tx.hash, block: receipt.blockNumber };
  }

  public async recordStockMove(data: any) {
    if (!this.isEnabled || !this.stockVerifier) throw new Error("Blockchain not configured");

    const qtyInt = Math.floor(data.quantity * 1000);
    const dataHash = this.computeHash(data);

    const tx = await this.stockVerifier.recordStockMove(
      data.reference,
      data.productCode,
      data.fromLocation,
      data.toLocation,
      qtyInt,
      data.uom,
      dataHash,
      data.moveType
    );
    const receipt = await tx.wait();

    return { txHash: tx.hash, dataHash, block: receipt.blockNumber };
  }

  public async getStats() {
    if (!this.isEnabled || !this.erpLedger) return { enabled: false };
    try {
      const total = await this.erpLedger.getTotalRecords();
      return {
        enabled: true,
        totalRecords: total.toString(),
        network: process.env.POLYGON_RPC_URL?.includes('amoy') ? 'Polygon Amoy Testnet' : 'Polygon Mainnet',
        erpContract: ERPLedgerAddress
      };
    } catch (error) {
      logger.warn('Blockchain network unreachable for stats', error);
      return { enabled: false, error: 'Blockchain node unreachable' };
    }
  }
}

export const blockchainService = new BlockchainService();
