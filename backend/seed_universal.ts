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
      where: { sku: 'UNI-SRV-001' },
      update: {},
      create: {
        sku: 'UNI-SRV-001', name: 'Enterprise Server Rack', description: 'Standard 42U Server Rack for enterprise data centers',
        categoryId: category.id, salesPrice: 2500, costPrice: 1200, isFinishedGood: true
      }
    });

    const warehouse = await prisma.warehouse.upsert({
      where: { code: 'WH-UNI-MAIN' },
      update: {},
      create: { name: 'Main Distribution Center', code: 'WH-UNI-MAIN', city: 'Chicago' }
    });

    await prisma.inventory.upsert({
      where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } },
      update: { onHandQty: 100 },
      create: { productId: product.id, warehouseId: warehouse.id, onHandQty: 100 }
    });

    const order = await prisma.salesOrder.upsert({
      where: { orderNumber: 'SO-UNI-001' },
      update: {},
      create: {
        orderNumber: 'SO-UNI-001', customerId: customer.id, status: 'CONFIRMED', subtotal: 5000, taxAmount: 900, totalAmount: 5900,
        items: { create: [{ productId: product.id, quantity: 2, unitPrice: 2500, totalPrice: 5000 }] }
      }
    });

    await prisma.delivery.upsert({
      where: { deliveryNumber: 'DEL-UNI-001' },
      update: {},
      create: { deliveryNumber: 'DEL-UNI-001', salesOrderId: order.id, status: 'DELIVERED', trackingNumber: 'TRK-998877', deliveredDate: new Date() }
    });

    const invoice = await prisma.invoice.upsert({
      where: { invoiceNumber: 'INV-UNI-001' },
      update: {},
      create: { invoiceNumber: 'INV-UNI-001', salesOrderId: order.id, subtotal: 5000, taxAmount: 900, totalAmount: 5900, status: 'PAID', paidDate: new Date() }
    });

    await prisma.payment.upsert({
      where: { paymentNumber: 'PAY-UNI-001' },
      update: {},
      create: { paymentNumber: 'PAY-UNI-001', customerId: customer.id, salesOrderId: order.id, amount: 5900, method: 'CREDIT_CARD', status: 'COMPLETED' }
    });

    console.log("Database seeded successfully with Universal entries.");
  } catch (error) {
    console.error("Error seeding:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
