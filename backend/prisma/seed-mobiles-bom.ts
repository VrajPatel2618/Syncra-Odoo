import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Mobile BoM database...');

  // 1. Ensure Categories exist
  const electronicsCat = await prisma.category.upsert({
    where: { name: 'Electronics' },
    update: {},
    create: { name: 'Electronics', description: 'Smartphones, Laptops, Gadgets' },
  });
  const componentsCat = await prisma.category.upsert({
    where: { name: 'Components' },
    update: {},
    create: { name: 'Components', description: 'Raw materials, Circuit boards' },
  });

  // 2. Ensure WorkCenters exist
  const wcSMT = await prisma.workCenter.upsert({
    where: { code: 'WC-SMT' },
    update: {},
    create: { name: 'SMT Assembly Line', code: 'WC-SMT', type: 'Assembly', capacity: 200, utilization: 82 },
  });
  const wcScreen = await prisma.workCenter.upsert({
    where: { code: 'WC-SCREEN' },
    update: {},
    create: { name: 'Screen Calibration Lab', code: 'WC-SCREEN', type: 'Calibration', capacity: 100, utilization: 70 },
  });
  const wcQA = await prisma.workCenter.upsert({
    where: { code: 'WC-QA' },
    update: {},
    create: { name: 'Quality Assurance Lab', code: 'WC-QA', type: 'Testing', capacity: 50, utilization: 90 },
  });
  const wcPkg = await prisma.workCenter.upsert({
    where: { code: 'WC-PKG' },
    update: {},
    create: { name: 'Final Packaging', code: 'WC-PKG', type: 'Packaging', capacity: 300, utilization: 60 },
  });

  // 3. Create Mobile Components
  const pcb = await prisma.product.upsert({
    where: { sku: 'COMP-PCB-PROMAX' },
    update: {},
    create: { sku: 'COMP-PCB-PROMAX', name: 'ProMax Logic Board', categoryId: componentsCat.id, costPrice: 85, isRawMaterial: true, isFinishedGood: false },
  });
  const oled = await prisma.product.upsert({
    where: { sku: 'COMP-OLED-6.7' },
    update: {},
    create: { sku: 'COMP-OLED-6.7', name: '6.7" Super Retina OLED', categoryId: componentsCat.id, costPrice: 150, isRawMaterial: true, isFinishedGood: false },
  });
  const batt = await prisma.product.upsert({
    where: { sku: 'COMP-BATT-4500' },
    update: {},
    create: { sku: 'COMP-BATT-4500', name: '4500mAh Li-ion Battery', categoryId: componentsCat.id, costPrice: 35, isRawMaterial: true, isFinishedGood: false },
  });
  const camera = await prisma.product.upsert({
    where: { sku: 'COMP-CAM-48MP' },
    update: {},
    create: { sku: 'COMP-CAM-48MP', name: '48MP Triple Camera Module', categoryId: componentsCat.id, costPrice: 90, isRawMaterial: true, isFinishedGood: false },
  });
  const casing = await prisma.product.upsert({
    where: { sku: 'COMP-CASE-TITANIUM' },
    update: {},
    create: { sku: 'COMP-CASE-TITANIUM', name: 'Titanium Enclosure', categoryId: componentsCat.id, costPrice: 65, isRawMaterial: true, isFinishedGood: false },
  });

  // 4. Add inventory for these components so we can test "Impact" and manufacturing
  const warehouse = await prisma.warehouse.findFirst();
  if (warehouse) {
    const comps = [pcb, oled, batt, camera, casing];
    for (const comp of comps) {
      await prisma.inventory.upsert({
        where: { productId_warehouseId: { productId: comp.id, warehouseId: warehouse.id } },
        update: { onHandQty: 5000 },
        create: { productId: comp.id, warehouseId: warehouse.id, onHandQty: 5000 },
      });
    }
  }

  // 5. Create Finished Product
  const mobile = await prisma.product.upsert({
    where: { sku: 'ELEC-SP-PROMAX' },
    update: {},
    create: { sku: 'ELEC-SP-PROMAX', name: 'Smartphone Pro Max', categoryId: electronicsCat.id, costPrice: 425, salesPrice: 1199, isRawMaterial: false, isFinishedGood: true },
  });

  // 6. Create Bill of Materials
  await prisma.billOfMaterial.create({
    data: {
      name: 'Smartphone Pro Max Standard BoM',
      finishedProductId: mobile.id,
      version: '1.0',
      productionDuration: 120, // total mins
      totalCost: 425,
      isActive: true,
      components: {
        create: [
          { productId: pcb.id, quantity: 1, unit: 'pcs' },
          { productId: oled.id, quantity: 1, unit: 'pcs' },
          { productId: batt.id, quantity: 1, unit: 'pcs' },
          { productId: camera.id, quantity: 1, unit: 'pcs' },
          { productId: casing.id, quantity: 1, unit: 'pcs' },
        ],
      },
      operations: {
        create: [
          { workCenterId: wcSMT.id, sequence: 1, name: 'PCB Assembly & Soldering', duration: 30 },
          { workCenterId: wcScreen.id, sequence: 2, name: 'Screen Calibration & Attachment', duration: 40 },
          { workCenterId: wcQA.id, sequence: 3, name: 'Final QA Testing', duration: 35 },
          { workCenterId: wcPkg.id, sequence: 4, name: 'Retail Packaging', duration: 15 },
        ],
      },
    },
  });

  console.log('✅ Mobile BoM Dataset Seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
