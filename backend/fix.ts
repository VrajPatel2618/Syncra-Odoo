import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.salesOrder.updateMany({
    where: { status: 'DELIVERED' },
    data: { status: 'FULLY_DELIVERED' }
  });
  console.log(`Updated ${result.count} SalesOrders from DELIVERED to FULLY_DELIVERED`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
