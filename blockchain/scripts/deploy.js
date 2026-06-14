const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment...");

  // 1. Deploy ERPLedger
  const ERPLedger = await hre.ethers.getContractFactory("ERPLedger");
  const erpLedger = await ERPLedger.deploy();
  await erpLedger.waitForDeployment();
  const erpLedgerAddress = await erpLedger.getAddress();
  console.log(`ERPLedger deployed to: ${erpLedgerAddress}`);

  // 2. Deploy StockVerifier
  const StockVerifier = await hre.ethers.getContractFactory("StockVerifier");
  const stockVerifier = await StockVerifier.deploy();
  await stockVerifier.waitForDeployment();
  const stockVerifierAddress = await stockVerifier.getAddress();
  console.log(`StockVerifier deployed to: ${stockVerifierAddress}`);

  // 3. Authorize StockVerifier to write to ERPLedger
  console.log("Authorizing StockVerifier as a writer in ERPLedger...");
  const tx = await erpLedger.authorizeWriter(stockVerifierAddress, true);
  await tx.wait();
  console.log("StockVerifier authorized successfully.");

  // Save addresses to file
  const deployedAddresses = {
    ERPLedger: erpLedgerAddress,
    StockVerifier: stockVerifierAddress,
    Network: hre.network.name
  };

  const filePath = path.join(__dirname, '..', 'deployed_addresses.json');
  fs.writeFileSync(filePath, JSON.stringify(deployedAddresses, null, 2));
  console.log(`Saved deployed addresses to ${filePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
