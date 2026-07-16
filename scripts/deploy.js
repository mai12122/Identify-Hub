import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer = await provider.getSigner(0);
  console.log(`Using deployer account: ${await signer.getAddress()}`);

  // Load IdentityRegistry artifact
  const registryArtifactPath = path.join(__dirname, "../artifacts/contracts/IdentityRegistry.sol/IdentityRegistry.json");
  const registryArtifact = JSON.parse(fs.readFileSync(registryArtifactPath, "utf8"));
  
  console.log("Deploying IdentityRegistry contract...");
  const RegistryFactory = new ethers.ContractFactory(registryArtifact.abi, registryArtifact.bytecode, signer);
  const registry = await RegistryFactory.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`IdentityRegistry contract successfully deployed to: ${registryAddress}`);

  // Load IdentityToken artifact
  const tokenArtifactPath = path.join(__dirname, "../artifacts/contracts/IdentityToken.sol/IdentityToken.json");
  const tokenArtifact = JSON.parse(fs.readFileSync(tokenArtifactPath, "utf8"));

  console.log("Deploying IdentityToken contract...");
  const TokenFactory = new ethers.ContractFactory(tokenArtifact.abi, tokenArtifact.bytecode, signer);
  // Initial supply of 1,000,000 tokens (18 decimals)
  const token = await TokenFactory.deploy(1000000);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log(`IdentityToken contract successfully deployed to: ${tokenAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
