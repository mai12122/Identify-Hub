import hre from "hardhat";

async function main() {
  console.log("Deploying IdentityRegistry contract...");

  const IdentityRegistry = await hre.ethers.getContractFactory("IdentityRegistry");
  const registry = await IdentityRegistry.deploy();

  await registry.waitForDeployment();

  console.log(`IdentityRegistry contract successfully deployed to: ${await registry.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
