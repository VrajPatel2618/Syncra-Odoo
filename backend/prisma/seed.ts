import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('🌱 Seeding Universal ERP database with Indian Mobile Context & 150 Transactions...');

  // 1. Roles & Users
  const password = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@universal.com' },
    update: { role: 'ADMIN', department: 'Management' },
    create: { email: 'admin@universal.com', password, firstName: 'Aarav', lastName: 'Sharma', role: 'ADMIN', department: 'Management' },
  });

  await prisma.user.upsert({ where: { email: 'salesmgr@universal.com' }, update: {}, create: { email: 'salesmgr@universal.com', password, firstName: 'Priya', lastName: 'Patel', role: 'SALES_MANAGER', department: 'Sales' } });
  await prisma.user.upsert({ where: { email: 'salesexec@universal.com' }, update: {}, create: { email: 'salesexec@universal.com', password, firstName: 'Rohan', lastName: 'Singh', role: 'SALES_EXECUTIVE', department: 'Sales' } });
  await prisma.user.upsert({ where: { email: 'purchasemgr@universal.com' }, update: {}, create: { email: 'purchasemgr@universal.com', password, firstName: 'Ananya', lastName: 'Gupta', role: 'PURCHASE_MANAGER', department: 'Procurement' } });
  await prisma.user.upsert({ where: { email: 'warehousemgr@universal.com' }, update: {}, create: { email: 'warehousemgr@universal.com', password, firstName: 'Vikram', lastName: 'Rao', role: 'WAREHOUSE_MANAGER', department: 'Logistics' } });
  await prisma.user.upsert({ where: { email: 'productionmgr@universal.com' }, update: {}, create: { email: 'productionmgr@universal.com', password, firstName: 'Sanjay', lastName: 'Menon', role: 'PRODUCTION_MANAGER', department: 'Manufacturing' } });

  // 2. Company Settings
  const existingSettings = await prisma.companySettings.findFirst();
  if (!existingSettings) {
    await prisma.companySettings.create({
      data: {
        companyName: 'Bharat Electronics Manufacturing',
        tagline: 'Make in India. For the World.',
        address: 'Electronic City Phase 1, Hosur Road',
        phone: '+91 80 5555 1234',
        email: 'contact@bharatelectronics.in',
        gstNumber: '29AAAAA0000A1Z5',
        currency: 'INR',
        timezone: 'Asia/Kolkata'
      },
    });
  }

  // 3. Mobile Specific Categories
  const categories = await Promise.all([
    prisma.category.upsert({ where: { name: 'Smartphones' }, update: {}, create: { name: 'Smartphones', description: 'Finished Flagship Devices' } }),
    prisma.category.upsert({ where: { name: 'Processors' }, update: {}, create: { name: 'Processors', description: 'Mobile SoCs and Logic Boards' } }),
    prisma.category.upsert({ where: { name: 'Displays' }, update: {}, create: { name: 'Displays', description: 'OLED, AMOLED, and LCD Screens' } }),
    prisma.category.upsert({ where: { name: 'Batteries' }, update: {}, create: { name: 'Batteries', description: 'Lithium-ion Power Cells' } }),
    prisma.category.upsert({ where: { name: 'Chassis' }, update: {}, create: { name: 'Chassis', description: 'Titanium, Aluminum, and Glass enclosures' } }),
    prisma.category.upsert({ where: { name: 'Camera Modules' }, update: {}, create: { name: 'Camera Modules', description: 'Optical Sensors and Lenses' } }),
  ]);

  const catMap = {
    smartphones: categories[0].id,
    processors: categories[1].id,
    displays: categories[2].id,
    batteries: categories[3].id,
    chassis: categories[4].id,
    cameras: categories[5].id,
  };

  // 4. Warehouses & Work Centers
  const warehouses = await Promise.all([
    prisma.warehouse.upsert({ where: { code: 'WH-BLR' }, update: {}, create: { name: 'Bangalore Hub', code: 'WH-BLR', address: 'Electronic City Phase 2', city: 'Bangalore', capacity: 500000 } }),
    prisma.warehouse.upsert({ where: { code: 'WH-NOIDA' }, update: {}, create: { name: 'Noida Assembly Park', code: 'WH-NOIDA', address: 'Sector 62', city: 'Noida', capacity: 300000 } }),
    prisma.warehouse.upsert({ where: { code: 'WH-CHENNAI' }, update: {}, create: { name: 'Sriperumbudur Hub', code: 'WH-CHENNAI', address: 'SIPCOT Industrial Park', city: 'Chennai', capacity: 400000 } }),
  ]);

  const workCenters = await Promise.all([
    prisma.workCenter.upsert({ where: { code: 'WC-SMT' }, update: {}, create: { name: 'Logic Board SMT Line', code: 'WC-SMT', type: 'Assembly', capacity: 1000, utilization: 85 } }),
    prisma.workCenter.upsert({ where: { code: 'WC-CHASSIS' }, update: {}, create: { name: 'Chassis Integration', code: 'WC-CHASSIS', type: 'Assembly', capacity: 800, utilization: 75 } }),
    prisma.workCenter.upsert({ where: { code: 'WC-SCREEN' }, update: {}, create: { name: 'Display Calibration', code: 'WC-SCREEN', type: 'Assembly', capacity: 600, utilization: 92 } }),
    prisma.workCenter.upsert({ where: { code: 'WC-QA' }, update: {}, create: { name: 'Quality Assurance Lab', code: 'WC-QA', type: 'Testing', capacity: 200, utilization: 90 } }),
    prisma.workCenter.upsert({ where: { code: 'WC-PKG' }, update: {}, create: { name: 'Final Packaging', code: 'WC-PKG', type: 'Packaging', capacity: 1500, utilization: 60 } }),
  ]);

  // 5. Mobile Vendors
  const vendors = await Promise.all([
    prisma.vendor.create({ data: { name: 'Qualcomm India', email: 'supply@qualcomm.in', city: 'Hyderabad', rating: 4.9, leadTimeDays: 14 } }),
    prisma.vendor.create({ data: { name: 'Samsung Display India', email: 'orders@samsungdisplay.in', city: 'Noida', rating: 4.8, leadTimeDays: 20 } }),
    prisma.vendor.create({ data: { name: 'TSMC Global', email: 'wafers@tsmc.com', city: 'Mumbai', rating: 4.9, leadTimeDays: 45 } }),
    prisma.vendor.create({ data: { name: 'Sony Optics', email: 'sensors@sony.in', city: 'Bangalore', rating: 4.7, leadTimeDays: 10 } }),
    prisma.vendor.create({ data: { name: 'ATL Batteries', email: 'batteries@atl.in', city: 'Chennai', rating: 4.5, leadTimeDays: 7 } }),
  ]);

  // 6. Components
  const appleRaw = await Promise.all([
    prisma.product.create({ data: { sku: 'A17-PRO-CHIP', name: 'A17 Pro SoC', categoryId: catMap.processors, costPrice: 11000, salesPrice: 0, isRawMaterial: true, isFinishedGood: false, reorderPoint: 5000, reorderQty: 20000 } }),
    prisma.product.create({ data: { sku: 'APL-OLED-61', name: '6.1" Super Retina XDR', categoryId: catMap.displays, costPrice: 9000, salesPrice: 0, isRawMaterial: true, isFinishedGood: false, reorderPoint: 3000, reorderQty: 10000 } }),
    prisma.product.create({ data: { sku: 'APL-BATT-3274', name: '3274mAh Apple Battery', categoryId: catMap.batteries, costPrice: 1600, salesPrice: 0, isRawMaterial: true, isFinishedGood: false, reorderPoint: 5000, reorderQty: 15000 } }),
    prisma.product.create({ data: { sku: 'APL-TITAN-FRM', name: 'Titanium Grade 5 Frame', categoryId: catMap.chassis, costPrice: 4000, salesPrice: 0, isRawMaterial: true, isFinishedGood: false, reorderPoint: 4000, reorderQty: 12000 } }),
    prisma.product.create({ data: { sku: 'APL-CAM-48MP', name: '48MP Main Camera Module', categoryId: catMap.cameras, costPrice: 5500, salesPrice: 0, isRawMaterial: true, isFinishedGood: false, reorderPoint: 5000, reorderQty: 15000 } }),
  ]);

  const samsungRaw = await Promise.all([
    prisma.product.create({ data: { sku: 'SD-8-GEN-3', name: 'Snapdragon 8 Gen 3', categoryId: catMap.processors, costPrice: 11500, salesPrice: 0, isRawMaterial: true, isFinishedGood: false, reorderPoint: 4000, reorderQty: 15000 } }),
    prisma.product.create({ data: { sku: 'SAM-AMOLED-68', name: '6.8" Dynamic AMOLED 2X', categoryId: catMap.displays, costPrice: 10500, salesPrice: 0, isRawMaterial: true, isFinishedGood: false, reorderPoint: 2500, reorderQty: 8000 } }),
    prisma.product.create({ data: { sku: 'SAM-BATT-5000', name: '5000mAh Samsung Battery', categoryId: catMap.batteries, costPrice: 1800, salesPrice: 0, isRawMaterial: true, isFinishedGood: false, reorderPoint: 4500, reorderQty: 12000 } }),
    prisma.product.create({ data: { sku: 'SAM-TITAN-FRM', name: 'Titanium Edge Frame', categoryId: catMap.chassis, costPrice: 4500, salesPrice: 0, isRawMaterial: true, isFinishedGood: false, reorderPoint: 3500, reorderQty: 10000 } }),
    prisma.product.create({ data: { sku: 'SAM-CAM-200MP', name: '200MP ISOCELL Sensor', categoryId: catMap.cameras, costPrice: 7000, salesPrice: 0, isRawMaterial: true, isFinishedGood: false, reorderPoint: 4000, reorderQty: 10000 } }),
  ]);

  const googleRaw = await Promise.all([
    prisma.product.create({ data: { sku: 'TENSOR-G3', name: 'Google Tensor G3', categoryId: catMap.processors, costPrice: 9000, salesPrice: 0, isRawMaterial: true, isFinishedGood: false, reorderPoint: 3000, reorderQty: 10000 } }),
    prisma.product.create({ data: { sku: 'GOOG-ACTUA-67', name: '6.7" Super Actua Display', categoryId: catMap.displays, costPrice: 8500, salesPrice: 0, isRawMaterial: true, isFinishedGood: false, reorderPoint: 2000, reorderQty: 6000 } }),
    prisma.product.create({ data: { sku: 'GOOG-BATT-5050', name: '5050mAh Pixel Battery', categoryId: catMap.batteries, costPrice: 1700, salesPrice: 0, isRawMaterial: true, isFinishedGood: false, reorderPoint: 3000, reorderQty: 8000 } }),
    prisma.product.create({ data: { sku: 'GOOG-ALUM-FRM', name: '100% Recycled Aluminum Frame', categoryId: catMap.chassis, costPrice: 2500, salesPrice: 0, isRawMaterial: true, isFinishedGood: false, reorderPoint: 4000, reorderQty: 12000 } }),
    prisma.product.create({ data: { sku: 'GOOG-CAM-50MP', name: '50MP Octa PD Wide Camera', categoryId: catMap.cameras, costPrice: 5000, salesPrice: 0, isRawMaterial: true, isFinishedGood: false, reorderPoint: 3500, reorderQty: 9000 } }),
  ]);

  const allRaw = [...appleRaw, ...samsungRaw, ...googleRaw];

  // 7. Flagship Finished Goods
  const finishedProducts = await Promise.all([
    prisma.product.create({ data: { sku: 'IPHONE-15-PRO', name: 'Apple iPhone 15 Pro', categoryId: catMap.smartphones, costPrice: 31100, salesPrice: 134900, reorderPoint: 500, reorderQty: 2000, procurementStrategy: 'MTS' } }),
    prisma.product.create({ data: { sku: 'GALAXY-S24-ULTRA', name: 'Samsung Galaxy S24 Ultra', categoryId: catMap.smartphones, costPrice: 35300, salesPrice: 129999, reorderPoint: 400, reorderQty: 1500, procurementStrategy: 'MTS' } }),
    prisma.product.create({ data: { sku: 'PIXEL-8-PRO', name: 'Google Pixel 8 Pro', categoryId: catMap.smartphones, costPrice: 26700, salesPrice: 106999, reorderPoint: 300, reorderQty: 1000, procurementStrategy: 'MTS' } }),
  ]);

  // 8. Bills of Materials (Recipes)
  const appleBom = await prisma.billOfMaterial.create({
    data: {
      name: 'iPhone 15 Pro Assembly',
      finishedProductId: finishedProducts[0].id,
      productionDuration: 45,
      totalCost: 31100,
      qualityStandard: 'Premium Grade A',
      components: { create: appleRaw.map(r => ({ productId: r.id, quantity: 1, unit: 'pcs' })) },
      operations: { create: [
          { workCenterId: workCenters[0].id, sequence: 1, name: 'Logic Board Integration', duration: 10 },
          { workCenterId: workCenters[1].id, sequence: 2, name: 'Chassis & Battery Assembly', duration: 15 },
          { workCenterId: workCenters[2].id, sequence: 3, name: 'Display Pairing', duration: 10 },
          { workCenterId: workCenters[3].id, sequence: 4, name: 'Diagnostic Testing', duration: 5 },
          { workCenterId: workCenters[4].id, sequence: 5, name: 'Retail Packaging', duration: 5 },
      ] },
    },
  });

  const samsungBom = await prisma.billOfMaterial.create({
    data: {
      name: 'Galaxy S24 Ultra Assembly',
      finishedProductId: finishedProducts[1].id,
      productionDuration: 50,
      totalCost: 35300,
      qualityStandard: 'ISO 9001:2015',
      components: { create: samsungRaw.map(r => ({ productId: r.id, quantity: 1, unit: 'pcs' })) },
      operations: { create: [
          { workCenterId: workCenters[0].id, sequence: 1, name: 'Motherboard Mounting', duration: 12 },
          { workCenterId: workCenters[1].id, sequence: 2, name: 'Frame & Battery Seal', duration: 18 },
          { workCenterId: workCenters[2].id, sequence: 3, name: 'AMOLED Calibration', duration: 10 },
          { workCenterId: workCenters[3].id, sequence: 4, name: 'Camera & Quality Test', duration: 6 },
          { workCenterId: workCenters[4].id, sequence: 5, name: 'Boxing', duration: 4 },
      ] },
    },
  });

  const googleBom = await prisma.billOfMaterial.create({
    data: {
      name: 'Pixel 8 Pro Assembly',
      finishedProductId: finishedProducts[2].id,
      productionDuration: 40,
      totalCost: 26700,
      qualityStandard: 'Standard Plus',
      components: { create: googleRaw.map(r => ({ productId: r.id, quantity: 1, unit: 'pcs' })) },
      operations: { create: [
          { workCenterId: workCenters[0].id, sequence: 1, name: 'Tensor Chip Seating', duration: 8 },
          { workCenterId: workCenters[1].id, sequence: 2, name: 'Aluminum Frame Assm', duration: 15 },
          { workCenterId: workCenters[2].id, sequence: 3, name: 'Actua Display Assm', duration: 8 },
          { workCenterId: workCenters[3].id, sequence: 4, name: 'AI & Hardware Diagnostics', duration: 6 },
          { workCenterId: workCenters[4].id, sequence: 5, name: 'Eco-Packaging', duration: 3 },
      ] },
    },
  });

  const boms = [appleBom, samsungBom, googleBom];

  // 10. Customers & Orders (Indian Context)
  const customers = await Promise.all([
    prisma.customer.create({ data: { name: 'Reliance Digital', email: 'procurement@reliancedigital.in', city: 'Mumbai', creditLimit: 50000000 } }),
    prisma.customer.create({ data: { name: 'Croma Electronics', email: 'orders@croma.in', city: 'Pune', creditLimit: 40000000 } }),
    prisma.customer.create({ data: { name: 'Sangeetha Mobiles', email: 'supply@sangeetha.in', city: 'Bangalore', creditLimit: 20000000 } }),
    prisma.customer.create({ data: { name: 'Poorvika Mobiles', email: 'orders@poorvika.in', city: 'Chennai', creditLimit: 25000000 } }),
    prisma.customer.create({ data: { name: 'Vijay Sales', email: 'procure@vijaysales.in', city: 'Delhi', creditLimit: 30000000 } }),
  ]);

  console.log('Generating 150 historical transactions (Purchases, Manufacturing, Sales)...');

  // Track inventory manually to ensure accuracy
  const stockMap: Record<string, number> = {};
  [...allRaw, ...finishedProducts].forEach(p => stockMap[p.id] = 0);

  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  // --- 150 PURCHASE ORDERS (INBOUND RAW MATERIALS) ---
  for (let i = 1; i <= 150; i++) {
    const pDate = randomDate(sixMonthsAgo, now);
    const v = vendors[Math.floor(Math.random() * vendors.length)];
    const numItems = Math.floor(Math.random() * 3) + 1;
    const itemsData = [];
    let subtotal = 0;

    for (let j = 0; j < numItems; j++) {
      const comp = allRaw[Math.floor(Math.random() * allRaw.length)];
      const qty = (Math.floor(Math.random() * 20) + 10) * 100; // 1000 to 3000
      const price = Number(comp.costPrice);
      const tot = qty * price;
      subtotal += tot;
      stockMap[comp.id] += qty; // Add to inventory
      itemsData.push({ productId: comp.id, quantity: qty, unitPrice: price, receivedQty: qty, totalPrice: tot });
    }

    await prisma.purchaseOrder.create({
      data: {
        orderNumber: `PO-IND-${1000 + i}`,
        vendorId: v.id,
        status: 'RECEIVED',
        orderDate: pDate,
        expectedDate: new Date(pDate.getTime() + 10 * 86400000),
        subtotal: subtotal,
        taxAmount: subtotal * 0.18,
        totalAmount: subtotal * 1.18,
        items: { create: itemsData }
      }
    });
  }

  // --- 150 MANUFACTURING ORDERS (PRODUCTION) ---
  for (let i = 1; i <= 150; i++) {
    const mDate = randomDate(sixMonthsAgo, now);
    const bomIdx = Math.floor(Math.random() * boms.length);
    const selectedBom = boms[bomIdx];
    const fpId = selectedBom.finishedProductId;
    const qty = (Math.floor(Math.random() * 5) + 1) * 100; // 100 to 500

    // Deduct raw materials, Add Finished Goods
    let componentsList = [];
    if (bomIdx === 0) componentsList = appleRaw;
    else if (bomIdx === 1) componentsList = samsungRaw;
    else componentsList = googleRaw;

    componentsList.forEach(c => { stockMap[c.id] -= qty; });
    stockMap[fpId] += qty;

    await prisma.manufacturingOrder.create({
      data: {
        orderNumber: `MO-BLR-${2000 + i}`,
        bomId: selectedBom.id,
        workCenterId: workCenters[0].id,
        quantity: qty,
        producedQty: qty,
        status: 'COMPLETED',
        scheduledDate: new Date(mDate.getTime() - 2 * 86400000),
        completedDate: mDate,
        createdAt: mDate,
      }
    });
  }

  // --- 150 SALES ORDERS (OUTBOUND FINISHED GOODS) ---
  for (let i = 1; i <= 150; i++) {
    const sDate = randomDate(sixMonthsAgo, now);
    const c = customers[Math.floor(Math.random() * customers.length)];
    const numItems = Math.floor(Math.random() * 2) + 1;
    const itemsData = [];
    let subtotal = 0;

    for (let j = 0; j < numItems; j++) {
      const fp = finishedProducts[Math.floor(Math.random() * finishedProducts.length)];
      const qty = (Math.floor(Math.random() * 5) + 1) * 50; // 50 to 300
      const price = Number(fp.salesPrice);
      const tot = qty * price;
      subtotal += tot;
      stockMap[fp.id] -= qty; // Deduct from inventory
      itemsData.push({ productId: fp.id, quantity: qty, unitPrice: price, deliveredQty: qty, totalPrice: tot });
    }

    const statuses = ['DRAFT', 'IN_PROGRESS', 'FULLY_DELIVERED', 'PAID'];
    const status = statuses[i % 4];

    const so = await prisma.salesOrder.create({
      data: {
        orderNumber: `SO-B2B-${3000 + i}`,
        customerId: c.id,
        status: status,
        orderDate: sDate,
        deliveryDate: new Date(sDate.getTime() + 5 * 86400000),
        subtotal: subtotal,
        taxAmount: subtotal * 0.18,
        totalAmount: subtotal * 1.18,
        items: { create: itemsData }
      }
    });

    // Create Audit Log for the transaction
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(JSON.stringify(so)).digest('hex');
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
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

    if (status === 'FULLY_DELIVERED' || status === 'PAID') {
      await prisma.delivery.create({
        data: {
          deliveryNumber: `DEL-B2B-${3000 + i}`,
          salesOrderId: so.id,
          status: 'DELIVERED',
          scheduledDate: sDate,
          deliveredDate: new Date(sDate.getTime() + 5 * 86400000),
          trackingNumber: `TRK${Math.floor(10000000 + Math.random() * 90000000)}`,
          driverName: ['Ramesh', 'Suresh', 'Abdul', 'Vikram', 'Rajesh'][Math.floor(Math.random() * 5)]
        }
      });
    }

    if (status === 'PAID') {
      await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-B2B-${3000 + i}`,
          salesOrderId: so.id,
          subtotal: so.subtotal,
          taxAmount: so.taxAmount,
          totalAmount: so.totalAmount,
          status: 'PAID',
          dueDate: new Date(sDate.getTime() + 30 * 86400000),
          paidDate: new Date(sDate.getTime() + 15 * 86400000),
          createdAt: sDate,
        }
      });

      await prisma.payment.create({
        data: {
          paymentNumber: `PAY-B2B-${3000 + i}`,
          customerId: so.customerId,
          salesOrderId: so.id,
          amount: so.totalAmount,
          method: ['BANK_TRANSFER', 'CREDIT_CARD', 'UPI'][Math.floor(Math.random() * 3)],
          status: 'COMPLETED',
          reference: `REF${Math.floor(10000000 + Math.random() * 90000000)}`,
          createdAt: new Date(sDate.getTime() + 15 * 86400000),
        }
      });
    }
  }

  // Finalize inventory safely (Ensure no negatives from random logic)
  for (const product of [...allRaw, ...finishedProducts]) {
    const finalQty = Math.max(stockMap[product.id], 50); // Provide buffer if random logic went negative
    await prisma.inventory.create({
      data: {
        productId: product.id,
        warehouseId: warehouses[0].id,
        onHandQty: finalQty,
        reservedQty: Math.floor(finalQty * 0.1),
      },
    });
  }

  console.log('✅ 150 Transactions generated accurately.');
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
