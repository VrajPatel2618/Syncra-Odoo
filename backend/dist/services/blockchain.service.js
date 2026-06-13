"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockchainService = void 0;
const ethers_1 = require("ethers");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../lib/logger");
// Load deployed addresses
let ERPLedgerAddress = process.env.ERP_LEDGER_ADDRESS || '';
let StockVerifierAddress = process.env.STOCK_VERIFIER_ADDRESS || '';
try {
    const deployedPath = path_1.default.join(__dirname, '../../../blockchain/deployed_addresses.json');
    if (fs_1.default.existsSync(deployedPath)) {
        const addresses = JSON.parse(fs_1.default.readFileSync(deployedPath, 'utf8'));
        ERPLedgerAddress = addresses.ERPLedger || ERPLedgerAddress;
        StockVerifierAddress = addresses.StockVerifier || StockVerifierAddress;
    }
}
catch (e) {
    logger_1.logger.warn('Could not load deployed_addresses.json', e);
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
    constructor() {
        this.provider = null;
        this.wallet = null;
        this.erpLedger = null;
        this.stockVerifier = null;
        this.isEnabled = false;
        this.isEnabled = process.env.BLOCKCHAIN_ENABLED === 'true';
        if (!this.isEnabled)
            return;
        try {
            this.provider = new ethers_1.ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology');
            if (process.env.BLOCKCHAIN_PRIVATE_KEY) {
                this.wallet = new ethers_1.ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, this.provider);
                if (ERPLedgerAddress) {
                    this.erpLedger = new ethers_1.ethers.Contract(ERPLedgerAddress, ERPLedgerABI, this.wallet);
                }
                if (StockVerifierAddress) {
                    this.stockVerifier = new ethers_1.ethers.Contract(StockVerifierAddress, StockVerifierABI, this.wallet);
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize BlockchainService', error);
            this.isEnabled = false;
        }
    }
    get enabled() { return this.isEnabled; }
    computeHash(data) {
        const sortedString = JSON.stringify(data, Object.keys(data).sort());
        return crypto_1.default.createHash('sha256').update(sortedString).digest('hex');
    }
    async recordOrder(type, data, metadata) {
        if (!this.isEnabled || !this.erpLedger)
            throw new Error("Blockchain not enabled or configured");
        const typeMap = { 'sales_order': 1, 'purchase_order': 2, 'manufacturing_order': 3 };
        const dataHash = this.computeHash(data);
        const metaString = JSON.stringify(metadata);
        const tx = await this.erpLedger.createRecord(typeMap[type], data.reference, dataHash, metaString);
        const receipt = await tx.wait();
        return { txHash: tx.hash, dataHash, block: receipt.blockNumber };
    }
    async updateOrderStatus(reference, newStatus, reason = '') {
        if (!this.isEnabled || !this.erpLedger)
            return null;
        const statusMap = { 'draft': 0, 'created': 0, 'confirmed': 1, 'in_progress': 2, 'completed': 3, 'delivered': 3, 'cancelled': 4 };
        const statusInt = statusMap[newStatus.toLowerCase()] || 0;
        const record = await this.erpLedger.getRecordByReference(reference);
        const tx = await this.erpLedger.updateStatus(record.id, statusInt, reason);
        const receipt = await tx.wait();
        return { txHash: tx.hash, block: receipt.blockNumber };
    }
    async recordStockMove(data) {
        if (!this.isEnabled || !this.stockVerifier)
            throw new Error("Blockchain not configured");
        const qtyInt = Math.floor(data.quantity * 1000);
        const dataHash = this.computeHash(data);
        const tx = await this.stockVerifier.recordStockMove(data.reference, data.productCode, data.fromLocation, data.toLocation, qtyInt, data.uom, dataHash, data.moveType);
        const receipt = await tx.wait();
        return { txHash: tx.hash, dataHash, block: receipt.blockNumber };
    }
    async getStats() {
        if (!this.isEnabled || !this.erpLedger)
            return { enabled: false };
        const total = await this.erpLedger.getTotalRecords();
        return {
            enabled: true,
            totalRecords: total.toString(),
            network: process.env.POLYGON_RPC_URL?.includes('amoy') ? 'Polygon Amoy Testnet' : 'Polygon Mainnet',
            erpContract: ERPLedgerAddress
        };
    }
}
exports.blockchainService = new BlockchainService();
