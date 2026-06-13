const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const filePath = path.join(__dirname, '..', 'deployed_addresses.json');
  if (!fs.existsSync(filePath)) {
    throw new Error("deployed_addresses.json not found! Run deploy.js first.");
  }
  
  const addresses = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  console.log("Verifying ERPLedger...");
  try {
    await hre.run("verify:verify", {
      address: addresses.ERPLedger,
      constructorArguments: [],
    });
    console.log("ERPLedger verified successfully!");
  } catch (e) {
    console.log("ERPLedger verification failed or already verified:", e.message);
  }

  console.log("Verifying StockVerifier...");
  try {
    await hre.run("verify:verify", {
      address: addresses.StockVerifier,
      constructorArguments: [],
    });
    console.log("StockVerifier verified successfully!");
  } catch (e) {
    console.log("StockVerifier verification failed or already verified:", e.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
