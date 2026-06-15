import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Generating Deliveries for Sales Orders...');
  
  const salesOrders = await prisma.salesOrder.findMany({
    where: { status: 'FULLY_DELIVERED' }
  });

  console.log(`Found ${salesOrders.length} delivered sales orders. Creating deliveries...`);

  let count = 0;
  for (const so of salesOrders) {
    const existing = await prisma.delivery.findFirst({ where: { salesOrderId: so.id } });
    if (!existing) {
      await prisma.delivery.create({
        data: {
          deliveryNumber: `DEL-${so.orderNumber.replace('SO-', '')}`,
          salesOrderId: so.id,
          status: 'DELIVERED',
          scheduledDate: so.orderDate,
          deliveredDate: so.deliveryDate || new Date(),
          trackingNumber: `TRK${Math.floor(10000000 + Math.random() * 90000000)}`,
          driverName: ['Ramesh', 'Suresh', 'Abdul', 'Vikram', 'Rajesh'][Math.floor(Math.random() * 5)]
        }
      });
      count++;
    }
  }

  console.log(`Successfully created ${count} Delivery entries.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
