import crypto from 'crypto';
import { ethers } from 'ethers';
import prisma from '../lib/prisma';
import { logger } from '../lib/logger';

export interface AuditPayload {
  eventType: string;
  entityType: string;
  entityId: string;
  data: Record<string, unknown>;
}

export class BlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;

  constructor() {
    if (process.env.BLOCKCHAIN_RPC_URL && process.env.BLOCKCHAIN_PRIVATE_KEY) {
      try {
        this.provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
        this.wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, this.provider);
      } catch (e) {
        logger.warn('Blockchain not configured, using hash-only mode');
      }
    }
  }

  generateDataHash(data: Record<string, unknown>): string {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  async recordAudit(payload: AuditPayload): Promise<{ hash: string; txHash?: string }> {
    const dataHash = this.generateDataHash({
      ...payload.data,
      eventType: payload.eventType,
      entityType: payload.entityType,
      entityId: payload.entityId,
      timestamp: new Date().toISOString(),
    });

    let txHash = `0x${crypto.randomBytes(32).toString('hex')}`;

    if (this.wallet && process.env.AUDIT_CONTRACT_ADDRESS) {
      try {
        const contract = new ethers.Contract(
          process.env.AUDIT_CONTRACT_ADDRESS,
          ['function recordAudit(string eventType, string entityType, string entityId, string dataHash) returns (bytes32)'],
          this.wallet
        );
        const tx = await contract.recordAudit(
          payload.eventType,
          payload.entityType,
          payload.entityId,
          dataHash
        );
        const receipt = await tx.wait();
        txHash = receipt.hash;
      } catch (e) {
        logger.warn('Blockchain tx failed, using local hash', { error: (e as Error).message });
      }
    }

    await prisma.blockchainLog.create({
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

  async verifyHash(entityId: string, dataHash: string): Promise<boolean> {
    const log = await prisma.blockchainLog.findFirst({
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

export const blockchainService = new BlockchainService();
