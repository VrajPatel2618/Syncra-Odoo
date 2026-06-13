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

  // 3. Authorize StockVerifier to write to ERPLedger if needed (Optional depending on exact architecture, usually they are separate)
  // But let's authorize the deployer as a writer explicitly just in case
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deployer ${deployer.address} is automatically authorized as owner/writer.`);

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
