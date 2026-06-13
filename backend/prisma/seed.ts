import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Universal ERP database...');

  const password = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@universal.com' },
    update: {},
    create: {
      email: 'admin@universal.com',
      password,
      firstName: 'Alice',
      lastName: 'Smith',
      role: 'SUPER_ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'manager@universal.com' },
    update: {},
    create: {
      email: 'manager@universal.com',
      password,
      firstName: 'Bob',
      lastName: 'Jones',
      role: 'MANAGER',
    },
  });

  const existingSettings = await prisma.companySettings.findFirst();
  if (!existingSettings) {
    await prisma.companySettings.create({
      data: {
        companyName: 'Universal Systems Inc.',
        tagline: 'Intelligent Enterprise Management',
        address: '100 Innovation Drive, Tech Park',
        phone: '+1 800 555 0199',
        email: 'info@universal.com',
        gstNumber: 'UNV-123456789',
      },
    });
  }

  const categories = await Promise.all([
    prisma.category.upsert({ where: { name: 'Electronics' }, update: {}, create: { name: 'Electronics', description: 'Smartphones, Laptops, Gadgets' } }),
    prisma.category.upsert({ where: { name: 'Apparel' }, update: {}, create: { name: 'Apparel', description: 'Clothing, Shoes, Accessories' } }),
    prisma.category.upsert({ where: { name: 'Home & Kitchen' }, update: {}, create: { name: 'Home & Kitchen', description: 'Appliances, Cookware' } }),
    prisma.category.upsert({ where: { name: 'Components' }, update: {}, create: { name: 'Components', description: 'Raw materials, Circuit boards, Fabrics' } }),
  ]);

  const warehouses = await Promise.all([
    prisma.warehouse.upsert({ where: { code: 'WH-CENTRAL' }, update: {}, create: { name: 'Central Logistics Hub', code: 'WH-CENTRAL', address: 'Tech Park Blvd', city: 'San Jose', capacity: 10000, zones: JSON.stringify({ A: 'High Value Electronics', B: 'Apparel', C: 'Components' }) } }),
    prisma.warehouse.upsert({ where: { code: 'WH-EAST' }, update: {}, create: { name: 'East Coast Distribution', code: 'WH-EAST', address: 'Commerce St', city: 'New York', capacity: 5000 } }),
  ]);

  const workCenters = await Promise.all([
    prisma.workCenter.upsert({ where: { code: 'WC-SMT' }, update: {}, create: { name: 'SMT Assembly Line', code: 'WC-SMT', type: 'Assembly', capacity: 200, utilization: 82 } }),
    prisma.workCenter.upsert({ where: { code: 'WC-QA' }, update: {}, create: { name: 'Quality Assurance Lab', code: 'WC-QA', type: 'Testing', capacity: 50, utilization: 90 } }),
    prisma.workCenter.upsert({ where: { code: 'WC-PKG' }, update: {}, create: { name: 'Final Packaging', code: 'WC-PKG', type: 'Packaging', capacity: 300, utilization: 60 } }),
  ]);

  const rawProducts = await Promise.all([
    prisma.product.create({ data: { sku: 'COMP-PCB-01', name: 'Standard Logic Board', categoryId: categories[3].id, costPrice: 45, salesPrice: 0, isRawMaterial: true, isFinishedGood: false, reorderPoint: 500, reorderQty: 2000 } }),
    prisma.product.create({ data: { sku: 'COMP-SCR-01', name: 'OLED Display Panel', categoryId: categories[3].id, costPrice: 120, salesPrice: 0, isRawMaterial: true, isFinishedGood: false, reorderPoint: 200, reorderQty: 1000 } }),
    prisma.product.create({ data: { sku: 'COMP-BATT-01', name: 'Lithium-Ion Battery', categoryId: categories[3].id, costPrice: 25, salesPrice: 0, isRawMaterial: true, isFinishedGood: false, reorderPoint: 1000, reorderQty: 5000 } }),
  ]);

  const finishedProducts = await Promise.all([
    prisma.product.create({ data: { sku: 'ELEC-SP-X1', name: 'Smartphone X1', categoryId: categories[0].id, costPrice: 250, salesPrice: 899, reorderPoint: 100, reorderQty: 500, procurementStrategy: 'MTS' } }),
    prisma.product.create({ data: { sku: 'ELEC-LT-PRO', name: 'Pro Laptop 15"', categoryId: categories[0].id, costPrice: 600, salesPrice: 1499, reorderPoint: 50, reorderQty: 200, procurementStrategy: 'MTS' } }),
    prisma.product.create({ data: { sku: 'APP-TSH-01', name: 'Graphic T-Shirt (M)', categoryId: categories[1].id, costPrice: 5, salesPrice: 25, reorderPoint: 500, reorderQty: 1000, procurementStrategy: 'MTS' } }),
    prisma.product.create({ data: { sku: 'HOME-BLND-01', name: 'Smart Blender', categoryId: categories[2].id, costPrice: 40, salesPrice: 120, reorderPoint: 150, reorderQty: 400, procurementStrategy: 'MTS' } }),
  ]);

  for (const product of [...rawProducts, ...finishedProducts]) {
    await prisma.inventory.create({
      data: {
        productId: product.id,
        warehouseId: warehouses[0].id,
        onHandQty: product.isRawMaterial ? 1500 : Math.floor(Math.random() * 300) + 50,
        reservedQty: Math.floor(Math.random() * 20),
      },
    });
  }

  // Create Stock Movements to populate history
  for (const product of [...rawProducts, ...finishedProducts]) {
    const qty = Math.floor(Math.random() * 100) + 50;
    const hash = crypto.randomBytes(32).toString('hex');
    const mov = await prisma.stockMovement.create({
      data: {
        productId: product.id,
        warehouseId: warehouses[0].id,
        movementType: 'IN',
        quantity: qty,
        previousQty: 0,
        newQty: qty,
        blockchainHash: hash,
        verified: true,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 86400000))
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: 'IN',
        entityType: 'StockMovement',
        entityId: mov.id,
        blockchainHash: hash,
        verified: true,
        createdAt: mov.createdAt
      }
    });
  }

  const bom = await prisma.billOfMaterial.create({
    data: {
      name: 'Smartphone X1 BoM',
      finishedProductId: finishedProducts[0].id,
      productionDuration: 60,
      totalCost: 250,
      components: {
        create: [
          { productId: rawProducts[0].id, quantity: 1, unit: 'pcs' },
          { productId: rawProducts[1].id, quantity: 1, unit: 'pcs' },
          { productId: rawProducts[2].id, quantity: 1, unit: 'pcs' },
        ],
      },
      operations: {
        create: [
          { workCenterId: workCenters[0].id, sequence: 1, name: 'Board Assembly', duration: 20 },
          { workCenterId: workCenters[1].id, sequence: 2, name: 'Quality Testing', duration: 30 },
          { workCenterId: workCenters[2].id, sequence: 3, name: 'Packaging', duration: 10 },
        ],
      },
    },
  });

  const customers = await Promise.all([
    prisma.customer.create({ data: { name: 'TechHaven Retail', email: 'orders@techhaven.com', phone: '+1 555 0100', address: 'Silicon Valley', city: 'San Jose', creditLimit: 50000 } }),
    prisma.customer.create({ data: { name: 'MegaMart Chain', email: 'purchase@megamart.com', phone: '+1 555 0101', address: 'Midtown', city: 'Chicago', creditLimit: 100000 } }),
    prisma.customer.create({ data: { name: 'Style Outlet', email: 'info@styleoutlet.com', phone: '+1 555 0102', address: 'Fashion District', city: 'New York', creditLimit: 20000 } }),
  ]);

  const vendors = await Promise.all([
    prisma.vendor.create({ data: { name: 'Global Tech Components', email: 'sales@globaltech.com', rating: 4.9, leadTimeDays: 14 } }),
    prisma.vendor.create({ data: { name: 'Display Innovators', email: 'orders@displays.com', rating: 4.6, leadTimeDays: 20 } }),
    prisma.vendor.create({ data: { name: 'Textile Source', email: 'supply@textilesource.com', rating: 4.3, leadTimeDays: 7 } }),
  ]);

  await prisma.salesOrder.create({
    data: {
      orderNumber: 'SO-UNV001',
      customerId: customers[0].id,
      status: 'CONFIRMED',
      subtotal: 8990,
      taxAmount: 899,
      totalAmount: 9889,
      deliveryDate: new Date(Date.now() + 3 * 86400000),
      items: { create: [{ productId: finishedProducts[0].id, quantity: 10, unitPrice: 899, totalPrice: 8990 }] },
    },
  });

  await prisma.purchaseOrder.create({
    data: {
      orderNumber: 'PO-UNV001',
      vendorId: vendors[0].id,
      status: 'CONFIRMED',
      subtotal: 45000,
      taxAmount: 4500,
      totalAmount: 49500,
      items: { create: [{ productId: rawProducts[0].id, quantity: 1000, unitPrice: 45, totalPrice: 45000 }] },
    },
  });

  await prisma.manufacturingOrder.create({
    data: {
      orderNumber: 'MO-UNV001',
      bomId: bom.id,
      workCenterId: workCenters[0].id,
      quantity: 50,
      status: 'IN_PROGRESS',
      scheduledDate: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      userId: admin.id,
      type: 'LOW_STOCK',
      title: 'Low Stock Alert',
      message: 'Graphic T-Shirt (M) is approaching reorder point',
      link: '/inventory',
    },
  });

  await prisma.notification.create({
    data: {
      userId: admin.id,
      type: 'AI_INSIGHT',
      title: 'AI Procurement Recommendation',
      message: 'Consider ordering Lithium-Ion Battery - demand forecast shows 15% increase next quarter',
      link: '/ai-analytics',
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('📧 Login: admin@universal.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
