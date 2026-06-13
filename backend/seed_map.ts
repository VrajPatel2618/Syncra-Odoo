import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seed() {
  try {
    const customer = await prisma.customer.upsert({
      where: { id: 'universal-customer-1' },
      update: {},
      create: { id: 'universal-customer-1', name: 'Global Tech Corp', email: 'billing@globaltech.com', city: 'New York', creditLimit: 500000, isActive: true }
    });

    const category = await prisma.category.upsert({
      where: { name: 'Universal Electronics' },
      update: {},
      create: { name: 'Universal Electronics', description: 'Universal electronics and hardware' }
    });

    const product = await prisma.product.upsert({
      where: { sku: 'UNI-SRV-002' },
      update: {},
      create: {
        sku: 'UNI-SRV-002', name: 'Cloud Storage Server', description: 'High density storage array',
        categoryId: category.id, salesPrice: 4500, costPrice: 2200, isFinishedGood: true
      }
    });

    const warehouse = await prisma.warehouse.upsert({
      where: { code: 'WH-UNI-MAIN' },
      update: {},
      create: { name: 'Main Distribution Center', code: 'WH-UNI-MAIN', city: 'Chicago' }
    });

    const order1 = await prisma.salesOrder.upsert({
      where: { orderNumber: 'SO-MAP-001' },
      update: {},
      create: {
        orderNumber: 'SO-MAP-001', customerId: customer.id, status: 'CONFIRMED', subtotal: 9000, taxAmount: 1800, totalAmount: 10800,
        items: { create: [{ productId: product.id, quantity: 2, unitPrice: 4500, totalPrice: 9000 }] }
      }
    });

    const order2 = await prisma.salesOrder.upsert({
      where: { orderNumber: 'SO-MAP-002' },
      update: {},
      create: {
        orderNumber: 'SO-MAP-002', customerId: customer.id, status: 'CONFIRMED', subtotal: 4500, taxAmount: 900, totalAmount: 5400,
        items: { create: [{ productId: product.id, quantity: 1, unitPrice: 4500, totalPrice: 4500 }] }
      }
    });

    await prisma.delivery.upsert({
      where: { deliveryNumber: 'DEL-MAP-ONGOING' },
      update: { status: 'ONGOING', currentLat: 40.7128, currentLng: -74.0060 },
      create: { deliveryNumber: 'DEL-MAP-ONGOING', salesOrderId: order1.id, status: 'ONGOING', trackingNumber: 'TRK-OG-001', driverName: 'John Doe', currentLat: 40.7128, currentLng: -74.0060, scheduledDate: new Date() }
    });

    await prisma.delivery.upsert({
      where: { deliveryNumber: 'DEL-MAP-DELAYED' },
      update: { status: 'DELAYED', currentLat: 41.8781, currentLng: -87.6298 },
      create: { deliveryNumber: 'DEL-MAP-DELAYED', salesOrderId: order2.id, status: 'DELAYED', trackingNumber: 'TRK-DLY-002', driverName: 'Mike Smith', currentLat: 41.8781, currentLng: -87.6298, scheduledDate: new Date() }
    });

    console.log("Database seeded successfully with map tracking deliveries.");
  } catch (error) {
    console.error("Error seeding:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
