import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
const prisma = new PrismaClient();

async function main() {
  console.log('Generating Audit Logs for Sales Orders...');
  
  const salesOrders = await prisma.salesOrder.findMany({
    include: { customer: true }
  });

  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  let count = 0;
  for (const so of salesOrders) {
    const hash = crypto.createHash('sha256').update(JSON.stringify(so)).digest('hex');
    
    await prisma.auditLog.create({
      data: {
        userId: adminUser?.id,
        action: 'CREATED_AND_VERIFIED_ON_CHAIN',
        entityType: 'SalesOrder',
        entityId: so.id,
        blockchainHash: `0x${hash}`,
        createdAt: so.orderDate,
        verified: true,
        previousValue: null,
        newValue: JSON.stringify({ status: so.status, total: so.totalAmount })
      }
    });

    count++;
  }

  // Generate some generic system logs
  for (let i = 0; i < 50; i++) {
    const hash = crypto.createHash('sha256').update(`sys_log_${i}`).digest('hex');
    await prisma.auditLog.create({
      data: {
        userId: adminUser?.id,
        action: 'SYSTEM_HEALTH_CHECK',
        entityType: 'System',
        entityId: `SYS-${1000 + i}`,
        blockchainHash: `0x${hash}`,
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 30),
        verified: true
      }
    });
    count++;
  }

  console.log(`Successfully created ${count} Audit Logs.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
