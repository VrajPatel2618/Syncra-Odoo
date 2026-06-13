import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const productAdjectives = ["Premium", "Standard", "Industrial", "Commercial", "Eco-friendly", "Heavy Duty", "Lightweight", "Compact", "Advanced", "Smart"];
const productNouns = ["Widget", "Component", "Module", "Assembly", "Processor", "Controller", "Sensor", "Actuator", "Valve", "Motor", "Pump", "Filter", "Connector", "Cable", "Battery"];

function getRandom(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateOrderNumber(prefix: string, index: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${rand}`;
}

async function main() {
  console.log("Starting transaction data entry generation...");

  // 1. Fetch existing Customers and Vendors
  const customers = await prisma.customer.findMany();
  const vendors = await prisma.vendor.findMany();

  if (customers.length === 0 || vendors.length === 0) {
    console.error("Please run the seed-india.ts script first to create customers and vendors!");
    return;
  }

  // 2. Create Categories
  console.log("Creating categories...");
  const categoriesToCreate = ["Electronics", "Mechanical", "Raw Materials", "Packaging", "Office Supplies"];
  const categories = [];
  for (const name of categoriesToCreate) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, description: `Category for ${name}` }
    });
    categories.push(cat);
  }

  // 3. Create 150 Products
  console.log("Creating 150 Products...");
  const products = [];
  for (let i = 0; i < 150; i++) {
    const name = `${getRandom(productAdjectives)} ${getRandom(productNouns)} ${Math.floor(Math.random() * 900) + 100}`;
    const costPrice = Math.floor(100 + Math.random() * 5000);
    const salesPrice = Math.floor(costPrice * (1.2 + Math.random() * 0.5)); // 20% to 70% margin
    
    const product = await prisma.product.create({
      data: {
        sku: `SKU-${Date.now()}-${i}`,
        name,
        categoryId: getRandom(categories).id,
        salesPrice,
        costPrice,
        reorderPoint: Math.floor(10 + Math.random() * 40),
        reorderQty: Math.floor(50 + Math.random() * 150),
        isActive: true
      }
    });
    products.push(product);
  }

  // 4. Ensure Warehouse and setup Inventory
  console.log("Setting up Inventory...");
  let warehouse = await prisma.warehouse.findFirst();
  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: { name: "Main Distribution Center", code: "WH-MDC", city: "Mumbai" }
    });
  }

  for (const product of products) {
    await prisma.inventory.create({
      data: {
        productId: product.id,
        warehouseId: warehouse.id,
        onHandQty: Math.floor(100 + Math.random() * 900)
      }
    });
  }

  // 5. Create 150 Sales Orders
  console.log("Creating 150 Sales Orders...");
  const statuses = ["DRAFT", "CONFIRMED", "IN_PROGRESS", "DELIVERED", "COMPLETED"];
  
  for (let i = 0; i < 150; i++) {
    const customer = getRandom(customers);
    const numItems = Math.floor(1 + Math.random() * 4); // 1 to 4 items
    
    let totalAmount = 0;
    const itemsData = [];
    
    for (let j = 0; j < numItems; j++) {
      const product = getRandom(products);
      const quantity = Math.floor(1 + Math.random() * 20);
      const unitPrice = Number(product.salesPrice);
      const totalPrice = quantity * unitPrice;
      totalAmount += totalPrice;
      
      itemsData.push({
        productId: product.id,
        quantity,
        unitPrice,
        totalPrice,
        deliveredQty: 0
      });
    }

    const taxAmount = totalAmount * 0.18; // 18% GST

    await prisma.salesOrder.create({
      data: {
        orderNumber: generateOrderNumber('SO', i),
        customerId: customer.id,
        status: getRandom(statuses),
        subtotal: totalAmount,
        taxAmount: taxAmount,
        totalAmount: totalAmount + taxAmount,
        items: {
          create: itemsData
        }
      }
    });
  }

  // 6. Create 150 Purchase Orders
  console.log("Creating 150 Purchase Orders...");
  const poStatuses = ["DRAFT", "CONFIRMED", "RECEIVED", "COMPLETED"];
  
  for (let i = 0; i < 150; i++) {
    const vendor = getRandom(vendors);
    const numItems = Math.floor(1 + Math.random() * 4); 
    
    let totalAmount = 0;
    const itemsData = [];
    
    for (let j = 0; j < numItems; j++) {
      const product = getRandom(products);
      const quantity = Math.floor(50 + Math.random() * 200);
      const unitPrice = Number(product.costPrice);
      const totalPrice = quantity * unitPrice;
      totalAmount += totalPrice;
      
      itemsData.push({
        productId: product.id,
        quantity,
        unitPrice,
        totalPrice,
        receivedQty: 0
      });
    }

    const taxAmount = totalAmount * 0.18;

    await prisma.purchaseOrder.create({
      data: {
        orderNumber: generateOrderNumber('PO', i),
        vendorId: vendor.id,
        status: getRandom(poStatuses),
        subtotal: totalAmount,
        taxAmount: taxAmount,
        totalAmount: totalAmount + taxAmount,
        items: {
          create: itemsData
        }
      }
    });
  }

  console.log("Successfully seeded 150 Products, 150 Sales Orders, and 150 Purchase Orders!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
