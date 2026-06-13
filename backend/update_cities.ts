import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function updateCities() {
  try {
    const customers = await prisma.customer.findMany();
    
    for (const customer of customers) {
      let newCity = customer.city;
      if (customer.city === 'New York') newCity = 'Mumbai';
      else if (customer.city === 'San Jose') newCity = 'Bangalore';
      else if (customer.city === 'Chicago') newCity = 'Delhi';
      else if (customer.city === 'San Francisco') newCity = 'Pune';
      else if (customer.city === 'Los Angeles') newCity = 'Ahmedabad';
      
      if (newCity !== customer.city) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: { city: newCity }
        });
      }
    }
    
    const warehouses = await prisma.warehouse.findMany();
    for (const wh of warehouses) {
      let newCity = wh.city;
      if (wh.city === 'Chicago') newCity = 'Delhi';
      else if (wh.city === 'New York') newCity = 'Mumbai';
      
      if (newCity !== wh.city) {
        await prisma.warehouse.update({
          where: { id: wh.id },
          data: { city: newCity }
        });
      }
    }
    
    console.log("Cities updated to Indian locations.");
  } catch (error) {
    console.error("Error updating cities:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCities();
