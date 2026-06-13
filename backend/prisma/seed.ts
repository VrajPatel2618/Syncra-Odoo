import { PrismaClient, UserRole, OrderStatus, PurchaseStatus, ManufacturingStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Syncra ERP database...');

  const password = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@shivfurniture.com' },
    update: {},
    create: {
      email: 'admin@shivfurniture.com',
      password,
      firstName: 'Rajesh',
      lastName: 'Sharma',
      role: UserRole.SUPER_ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'manager@shivfurniture.com' },
    update: {},
    create: {
      email: 'manager@shivfurniture.com',
      password,
      firstName: 'Priya',
      lastName: 'Patel',
      role: UserRole.MANAGER,
    },
  });

  const existingSettings = await prisma.companySettings.findFirst();
  if (!existingSettings) {
    await prisma.companySettings.create({
      data: {
        companyName: 'Shiv Furniture Works',
        tagline: 'Where Inventory Meets Intelligence',
        address: 'Industrial Area, Rajkot, Gujarat 360001',
        phone: '+91 98765 43210',
        email: 'info@shivfurniture.com',
        gstNumber: '24AABCS1429B1Z5',
      },
    });
  }

  const categories = await Promise.all([
    prisma.category.upsert({ where: { name: 'Living Room' }, update: {}, create: { name: 'Living Room', description: 'Sofas, tables, TV units' } }),
    prisma.category.upsert({ where: { name: 'Bedroom' }, update: {}, create: { name: 'Bedroom', description: 'Beds, wardrobes, dressers' } }),
    prisma.category.upsert({ where: { name: 'Office' }, update: {}, create: { name: 'Office', description: 'Desks, chairs, cabinets' } }),
    prisma.category.upsert({ where: { name: 'Raw Materials' }, update: {}, create: { name: 'Raw Materials', description: 'Wood, fabric, hardware' } }),
  ]);

  const warehouses = await Promise.all([
    prisma.warehouse.upsert({ where: { code: 'WH-MAIN' }, update: {}, create: { name: 'Main Warehouse', code: 'WH-MAIN', address: 'Rajkot Industrial Area', city: 'Rajkot', capacity: 5000, zones: { A: 'Finished Goods', B: 'Raw Materials', C: 'Packaging' } } }),
    prisma.warehouse.upsert({ where: { code: 'WH-SOUTH' }, update: {}, create: { name: 'South Distribution Center', code: 'WH-SOUTH', address: 'Ahmedabad', city: 'Ahmedabad', capacity: 3000 } }),
  ]);

  const workCenters = await Promise.all([
    prisma.workCenter.upsert({ where: { code: 'WC-ASM' }, update: {}, create: { name: 'Assembly Line', code: 'WC-ASM', type: 'Assembly', capacity: 100, utilization: 72 } }),
    prisma.workCenter.upsert({ where: { code: 'WC-PNT' }, update: {}, create: { name: 'Paint Floor', code: 'WC-PNT', type: 'Painting', capacity: 80, utilization: 85 } }),
    prisma.workCenter.upsert({ where: { code: 'WC-PKG' }, update: {}, create: { name: 'Packaging Unit', code: 'WC-PKG', type: 'Packaging', capacity: 120, utilization: 65 } }),
  ]);

  const rawProducts = await Promise.all([
    prisma.product.create({ data: { sku: 'RM-WOOD-001', name: 'Teak Wood Plank', categoryId: categories[3].id, costPrice: 2500, salesPrice: 0, isRawMaterial: true, isFinishedGood: false, reorderPoint: 50, reorderQty: 200 } }),
    prisma.product.create({ data: { sku: 'RM-FAB-001', name: 'Premium Fabric Roll', categoryId: categories[3].id, costPrice: 800, salesPrice: 0, isRawMaterial: true, isFinishedGood: false, reorderPoint: 30, reorderQty: 100 } }),
    prisma.product.create({ data: { sku: 'RM-HW-001', name: 'Hardware Kit', categoryId: categories[3].id, costPrice: 350, salesPrice: 0, isRawMaterial: true, isFinishedGood: false, reorderPoint: 100, reorderQty: 500 } }),
  ]);

  const finishedProducts = await Promise.all([
    prisma.product.create({ data: { sku: 'FG-SFA-001', name: 'Royal Teak Sofa Set', categoryId: categories[0].id, costPrice: 45000, salesPrice: 89999, reorderPoint: 5, reorderQty: 20, procurementStrategy: 'MTS' } }),
    prisma.product.create({ data: { sku: 'FG-BED-001', name: 'King Size Bed Frame', categoryId: categories[1].id, costPrice: 28000, salesPrice: 54999, reorderPoint: 8, reorderQty: 15, procurementStrategy: 'MTS' } }),
    prisma.product.create({ data: { sku: 'FG-DESK-001', name: 'Executive Office Desk', categoryId: categories[2].id, costPrice: 18000, salesPrice: 35999, reorderPoint: 10, reorderQty: 25, procurementStrategy: 'MTO' } }),
    prisma.product.create({ data: { sku: 'FG-WDR-001', name: 'Modular Wardrobe', categoryId: categories[1].id, costPrice: 35000, salesPrice: 69999, reorderPoint: 6, reorderQty: 12, procurementStrategy: 'MTS' } }),
    prisma.product.create({ data: { sku: 'FG-CHR-001', name: 'Ergonomic Office Chair', categoryId: categories[2].id, costPrice: 8000, salesPrice: 15999, reorderPoint: 15, reorderQty: 50, procurementStrategy: 'MTS' } }),
  ]);

  for (const product of [...rawProducts, ...finishedProducts]) {
    await prisma.inventory.create({
      data: {
        productId: product.id,
        warehouseId: warehouses[0].id,
        onHandQty: product.isRawMaterial ? 150 : Math.floor(Math.random() * 30) + 5,
        reservedQty: Math.floor(Math.random() * 3),
      },
    });
  }

  const bom = await prisma.billOfMaterial.create({
    data: {
      name: 'Royal Teak Sofa BoM',
      finishedProductId: finishedProducts[0].id,
      productionDuration: 480,
      totalCost: 45000,
      components: {
        create: [
          { productId: rawProducts[0].id, quantity: 8, unit: 'pcs' },
          { productId: rawProducts[1].id, quantity: 12, unit: 'm' },
          { productId: rawProducts[2].id, quantity: 1, unit: 'kit' },
        ],
      },
      operations: {
        create: [
          { workCenterId: workCenters[0].id, sequence: 1, name: 'Frame Assembly', duration: 180 },
          { workCenterId: workCenters[1].id, sequence: 2, name: 'Polish & Paint', duration: 120 },
          { workCenterId: workCenters[2].id, sequence: 3, name: 'Upholstery & Pack', duration: 180 },
        ],
      },
    },
  });

  const customers = await Promise.all([
    prisma.customer.create({ data: { name: 'Modern Homes Pvt Ltd', email: 'orders@modernhomes.com', phone: '+91 9876543210', address: 'Mumbai', city: 'Mumbai', creditLimit: 500000 } }),
    prisma.customer.create({ data: { name: 'Elite Interiors', email: 'purchase@eliteinteriors.com', phone: '+91 9876543211', address: 'Delhi', city: 'Delhi', creditLimit: 300000 } }),
    prisma.customer.create({ data: { name: 'Green Spaces Co', email: 'info@greenspaces.com', phone: '+91 9876543212', address: 'Bangalore', city: 'Bangalore', creditLimit: 200000 } }),
  ]);

  const vendors = await Promise.all([
    prisma.vendor.create({ data: { name: 'Gujarat Timber Suppliers', email: 'sales@gujtimber.com', rating: 4.8, leadTimeDays: 5 } }),
    prisma.vendor.create({ data: { name: 'Premium Fabrics India', email: 'orders@premiumfabrics.com', rating: 4.5, leadTimeDays: 7 } }),
    prisma.vendor.create({ data: { name: 'Steel & Hardware Mart', email: 'supply@steelmart.com', rating: 4.2, leadTimeDays: 3 } }),
  ]);

  await prisma.salesOrder.create({
    data: {
      orderNumber: 'SO-DEMO001',
      customerId: customers[0].id,
      status: OrderStatus.CONFIRMED,
      subtotal: 89999,
      taxAmount: 16199.82,
      totalAmount: 106198.82,
      deliveryDate: new Date(Date.now() + 7 * 86400000),
      items: { create: [{ productId: finishedProducts[0].id, quantity: 1, unitPrice: 89999, totalPrice: 89999 }] },
    },
  });

  await prisma.purchaseOrder.create({
    data: {
      orderNumber: 'PO-DEMO001',
      vendorId: vendors[0].id,
      status: PurchaseStatus.CONFIRMED,
      subtotal: 500000,
      taxAmount: 90000,
      totalAmount: 590000,
      items: { create: [{ productId: rawProducts[0].id, quantity: 200, unitPrice: 2500, totalPrice: 500000 }] },
    },
  });

  await prisma.manufacturingOrder.create({
    data: {
      orderNumber: 'MO-DEMO001',
      bomId: bom.id,
      workCenterId: workCenters[0].id,
      quantity: 5,
      status: ManufacturingStatus.IN_PROGRESS,
      scheduledDate: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      userId: admin.id,
      type: 'LOW_STOCK',
      title: 'Low Stock Alert',
      message: 'Ergonomic Office Chair is approaching reorder point',
      link: '/inventory',
    },
  });

  await prisma.notification.create({
    data: {
      userId: admin.id,
      type: 'AI_INSIGHT',
      title: 'AI Procurement Recommendation',
      message: 'Consider ordering Teak Wood Plank - demand forecast shows 20% increase',
      link: '/ai-analytics',
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('📧 Login: admin@shivfurniture.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
