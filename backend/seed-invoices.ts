import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Generating Invoices and Payments for Sales Orders...');
  
  const salesOrders = await prisma.salesOrder.findMany({
    where: { status: 'FULLY_DELIVERED' }
  });

  console.log(`Found ${salesOrders.length} delivered sales orders. Creating Invoices and Payments...`);

  let count = 0;
  for (const so of salesOrders) {
    const existingInvoice = await prisma.invoice.findFirst({ where: { salesOrderId: so.id } });
    if (!existingInvoice) {
      // 1. Create Invoice
      await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-${so.orderNumber.replace('SO-', '')}`,
          salesOrderId: so.id,
          subtotal: so.subtotal,
          taxAmount: so.taxAmount,
          totalAmount: so.totalAmount,
          status: 'PAID',
          dueDate: new Date(so.orderDate.getTime() + 30 * 86400000), // 30 days terms
          paidDate: new Date(so.orderDate.getTime() + 15 * 86400000), // Paid in 15 days
          createdAt: so.orderDate,
        }
      });

      // 2. Create Payment
      await prisma.payment.create({
        data: {
          paymentNumber: `PAY-${so.orderNumber.replace('SO-', '')}`,
          customerId: so.customerId,
          salesOrderId: so.id,
          amount: so.totalAmount,
          method: ['BANK_TRANSFER', 'CREDIT_CARD', 'UPI'][Math.floor(Math.random() * 3)],
          status: 'COMPLETED',
          reference: `REF${Math.floor(10000000 + Math.random() * 90000000)}`,
          createdAt: new Date(so.orderDate.getTime() + 15 * 86400000),
        }
      });

      // 3. Update Sales Order Status to PAID
      await prisma.salesOrder.update({
        where: { id: so.id },
        data: { status: 'PAID' }
      });
      
      count++;
    }
  }

  console.log(`Successfully created ${count} Invoices and Payments, and updated Sales Orders to PAID.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
