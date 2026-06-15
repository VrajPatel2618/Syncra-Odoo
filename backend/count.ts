import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const soCount = await prisma.salesOrder.count();
  const poCount = await prisma.purchaseOrder.count();
  const moCount = await prisma.manufacturingOrder.count();
  const prodCount = await prisma.product.count();
  const custCount = await prisma.customer.count();
  
  console.log({ soCount, poCount, moCount, prodCount, custCount });
}

main().catch(console.error).finally(() => prisma.$disconnect());
