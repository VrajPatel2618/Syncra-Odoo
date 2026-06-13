import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const cities = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur", 
  "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Vadodara", 
  "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Kalyan-Dombivli", "Vasai-Virar", "Varanasi", 
  "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Navi Mumbai", "Allahabad", "Howrah", "Ranchi", "Gwalior", "Jabalpur", 
  "Coimbatore", "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kota", "Chandigarh", "Guwahati", "Solapur"
];

const firstNames = ["Rajesh", "Priya", "Amit", "Anita", "Suresh", "Sunita", "Vikram", "Sneha", "Rahul", "Pooja", "Arun", "Deepa", "Karan", "Kavita", "Ravi", "Meena", "Sanjay", "Ritu", "Ajay", "Swati", "Manoj", "Kiran", "Vijay", "Divya", "Anil", "Geeta", "Dinesh", "Sita", "Mahesh", "Neha"];
const lastNames = ["Sharma", "Patel", "Singh", "Kumar", "Gupta", "Deshmukh", "Joshi", "Chauhan", "Reddy", "Iyer", "Nair", "Das", "Bose", "Chatterjee", "Mishra", "Pandey", "Yadav", "Verma", "Tiwari", "Agarwal", "Bansal", "Chopra", "Kapur", "Mehta", "Shah", "Desai", "Doshi", "Kulkarni", "Patil", "Pawar"];
const businessTypes = ["Enterprises", "Traders", "Industries", "Technologies", "Solutions", "Corporation", "Exports", "Global", "Agency", "Associates"];

function getRandom(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomPhone() {
  return "+91" + Math.floor(6000000000 + Math.random() * 4000000000).toString();
}

function getRandomGst() {
  const stateCode = Math.floor(10 + Math.random() * 20); // 10 to 30
  const pan = "ABCDE" + Math.floor(1000 + Math.random() * 9000) + "F";
  return stateCode + pan + "1Z" + Math.floor(1 + Math.random() * 9);
}

async function main() {
  console.log("Starting data entry generation...");
  
  // Generate 150 Customers
  let customersCreated = 0;
  for (let i = 0; i < 150; i++) {
    const isCompany = Math.random() > 0.5;
    const name = isCompany 
      ? `${getRandom(lastNames)} ${getRandom(businessTypes)}` 
      : `${getRandom(firstNames)} ${getRandom(lastNames)}`;
      
    const email = `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@example.com`;
    const city = getRandom(cities);
    const address = `${Math.floor(1 + Math.random() * 999)}, ${getRandom(firstNames)} Nagar, ${city}, India`;
    const creditLimit = Math.floor(10000 + Math.random() * 90000);

    await prisma.customer.create({
      data: {
        name,
        email,
        phone: getRandomPhone(),
        address,
        city,
        gstNumber: getRandomGst(),
        creditLimit,
        isActive: true
      }
    });
    customersCreated++;
  }
  console.log(`Created ${customersCreated} Customers.`);

  // Generate 50 Vendors
  let vendorsCreated = 0;
  for (let i = 0; i < 50; i++) {
    const name = `${getRandom(firstNames)} ${getRandom(lastNames)} ${getRandom(businessTypes)}`;
    const email = `vendor_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}@supplier.in`;
    const city = getRandom(cities);
    const address = `Plot No ${Math.floor(1 + Math.random() * 100)}, Industrial Area, ${city}`;
    const rating = parseFloat((3 + Math.random() * 2).toFixed(1)); // 3.0 to 5.0

    await prisma.vendor.create({
      data: {
        name,
        email,
        phone: getRandomPhone(),
        address,
        city,
        gstNumber: getRandomGst(),
        rating,
        leadTimeDays: Math.floor(2 + Math.random() * 12),
        isActive: true
      }
    });
    vendorsCreated++;
  }
  console.log(`Created ${vendorsCreated} Vendors.`);
  
  console.log("Successfully seeded 200 India-based records!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
