const hre = require("hardhat");

async function main() {
  console.log("Deploying Syncra Audit Trail contract...");

  const SyncraAuditTrail = await hre.ethers.getContractFactory("SyncraAuditTrail");
  const contract = await SyncraAuditTrail.deploy();

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log(`SyncraAuditTrail deployed to: ${address}`);
  console.log("Add this to backend .env as AUDIT_CONTRACT_ADDRESS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
