"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockchainService = exports.BlockchainService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const ethers_1 = require("ethers");
const prisma_1 = __importDefault(require("../lib/prisma"));
const logger_1 = require("../lib/logger");
class BlockchainService {
    constructor() {
        this.provider = null;
        this.wallet = null;
        if (process.env.BLOCKCHAIN_RPC_URL && process.env.BLOCKCHAIN_PRIVATE_KEY) {
            try {
                this.provider = new ethers_1.ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
                this.wallet = new ethers_1.ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, this.provider);
            }
            catch (e) {
                logger_1.logger.warn('Blockchain not configured, using hash-only mode');
            }
        }
    }
    generateDataHash(data) {
        return crypto_1.default.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    }
    async recordAudit(payload) {
        const dataHash = this.generateDataHash({
            ...payload.data,
            eventType: payload.eventType,
            entityType: payload.entityType,
            entityId: payload.entityId,
            timestamp: new Date().toISOString(),
        });
        let txHash = `0x${crypto_1.default.randomBytes(32).toString('hex')}`;
        if (this.wallet && process.env.AUDIT_CONTRACT_ADDRESS) {
            try {
                const contract = new ethers_1.ethers.Contract(process.env.AUDIT_CONTRACT_ADDRESS, ['function recordAudit(string eventType, string entityType, string entityId, string dataHash) returns (bytes32)'], this.wallet);
                const tx = await contract.recordAudit(payload.eventType, payload.entityType, payload.entityId, dataHash);
                const receipt = await tx.wait();
                txHash = receipt.hash;
            }
            catch (e) {
                logger_1.logger.warn('Blockchain tx failed, using local hash', { error: e.message });
            }
        }
        await prisma_1.default.blockchainLog.create({
            data: {
                txHash,
                eventType: payload.eventType,
                entityType: payload.entityType,
                entityId: payload.entityId,
                dataHash,
                status: 'CONFIRMED',
            },
        });
        return { hash: dataHash, txHash };
    }
    async verifyHash(entityId, dataHash) {
        const log = await prisma_1.default.blockchainLog.findFirst({
            where: { entityId, dataHash },
        });
        return !!log;
    }
    getStatus() {
        return {
            connected: !!this.provider,
            network: 'polygon',
            contractAddress: process.env.AUDIT_CONTRACT_ADDRESS || null,
            lastSync: new Date().toISOString(),
        };
    }
}
exports.BlockchainService = BlockchainService;
exports.blockchainService = new BlockchainService();
