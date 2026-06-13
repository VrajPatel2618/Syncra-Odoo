const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function main() {
  const warehouse = await prisma.warehouse.findFirst();
  const products = await prisma.product.findMany({ take: 3 });
  const user = await prisma.user.findFirst({ where: { email: 'admin@shivfurniture.com' } });

  if (!warehouse || !products.length || !user) {
    console.log('Missing data to create movements');
    return;
  }

  const movements = [
    { product: products[0], type: 'IN', qty: 200, prev: 0, newQty: 200 },
    { product: products[0], type: 'OUT', qty: 50, prev: 200, newQty: 150 },
    { product: products[1], type: 'IN', qty: 100, prev: 0, newQty: 100 },
    { product: products[2], type: 'MANUFACTURING_PRODUCE', qty: 20, prev: 0, newQty: 20 }
  ];

  for (let i = 0; i < movements.length; i++) {
    const m = movements[i];
    const hash = crypto.randomBytes(32).toString('hex');
    
    const mov = await prisma.stockMovement.create({
      data: {
        productId: m.product.id,
        warehouseId: warehouse.id,
        movementType: m.type,
        quantity: m.qty,
        previousQty: m.prev,
        newQty: m.newQty,
        blockchainHash: hash,
        verified: true,
        createdAt: new Date(Date.now() - (10 - i) * 3600000) // spread over the last 10 hours
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: m.type,
        entityType: 'StockMovement',
        entityId: mov.id,
        blockchainHash: hash,
        verified: true,
        createdAt: new Date(Date.now() - (10 - i) * 3600000)
      }
    });
  }

  console.log('Stock movements created!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
