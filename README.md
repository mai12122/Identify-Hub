# Decentralized Identity Hub (W3C DID Registry)

Welcome to the **Decentralized Identity Hub**, a fullstack Web3 application for issuing, managing, and verifying decentralized identities (DIDs) and cryptographic credentials on the blockchain.

This project features both a browser-based simulated EVM sandbox for rapid prototyping, and a real Hardhat development environment for deploying Solidity smart contracts.

---

## 🛠️ Tech Stack & Components
* **Smart Contracts**: Solidity (`0.8.20`), Hardhat, Ethers.js (v6)
* **Frontend**: React (v19), TypeScript, Vite, Tailwind CSS, Lucide Icons
* **Mock Blockchain**: A simulated client-side EVM node inside the browser (`mockBlockchain.ts`) for zero-gas sandbox testing.

---

## 🚀 Step-by-Step Setup Guide

Follow these steps to run the application, start a local blockchain node, deploy your contracts, and configure MetaMask.

### 1. Run the Frontend App
1. Install project dependencies:
   ```bash
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open the DApp in your browser at [http://localhost:5173](http://localhost:5173).

---

### 2. Start the Local Blockchain Node
Run a local Hardhat network node in the background to simulate the Ethereum ledger:
```bash
npx hardhat node
```
*This command starts an RPC server on `http://127.0.0.1:8545` and generates 20 default accounts pre-funded with 10,000 test ETH.*

---

### 3. Deploy the Smart Contracts
To deploy the `IdentityRegistry` and the custom `IdentityToken (IDT)` ERC-20 utility token to your local node, run:
```bash
node scripts/deploy.js
```
Upon successful deployment, your terminal will print the deployed contract addresses:
* **IdentityRegistry**: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
* **IdentityToken (IDT)**: `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`

---

## 🦊 MetaMask Configuration

To interact with your locally deployed contracts using MetaMask, follow these configuration steps:

### 1. Add the Local Hardhat Network to MetaMask
1. Open the MetaMask extension.
2. Click the network selector dropdown at the top-left (e.g. **Ethereum Mainnet**).
3. Click **Add Network** -> **Add a network manually** and enter:
   * **Network Name**: `Hardhat Localhost`
   * **New RPC URL**: `http://127.0.0.1:8545`
   * **Chain ID**: `31337`
   * **Currency Symbol**: `ETH`
4. Click **Save** and select the network.

### 2. Import the Hardhat Admin Account
To access the 10,000 test ETH and the minted initial supply of IDT tokens, import the Hardhat deployer account:
1. In MetaMask, click the account selector dropdown (e.g. **Account 1**) and choose **Add account or hardware wallet** -> **Import account**.
2. Paste the private key of the deployer:
   ```text
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
3. Click **Import**. The account will appear as **Imported Account 2** with a balance of `~10,000 ETH` (on your localhost network).

### 3. Import the Custom Token (IDT)
1. Ensure you are connected to the **Hardhat Localhost** network and have **Imported Account 2** selected.
2. Select the **Tokens** tab in MetaMask.
3. Click the **Network: Ethereum** filter dropdown (next to the filter icon) if it is shown, or scroll down and click **Import tokens** -> **Add a custom token**.
4. Under **Token contract address**, paste the deployed `IdentityToken` address:
   ```text
   0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
   ```
5. MetaMask will auto-detect:
   * **Token symbol**: `IDT`
   * **Token decimal**: `18`
6. Click **Next** -> **Import**. Your balance of **1,000,000 IDT** will now be visible in MetaMask!

---

## 🔄 App Architecture & Working Process

The DApp operates in two modes which you can toggle under **Ledger Connectivity** in the sidebar:

### 🟢 Sandbox Mode (Simulated EVM)
* **How it works**: Uses client-side JavaScript state (`mockBlockchain.ts`) to simulate a blockchain.
* **Preloaded Personas**:
  * **Contract Admin**: Platform deployer.
  * **CamTech University / Ministry of Transportation**: Authorized issuers who can sign and issue credentials.
  * **Alice**: The end user holding profile credentials.
  * **Bob Johnson**: Verifier checking Alice's credentials.
* **Best for**: Rapid prototyping, demonstrating workflows, and testing verification flows instantly with zero setup or gas.

### 🦊 MetaMask Mode (Live Local Node)
* **How it works**: Connects to the local running Hardhat RPC node using standard Ethers.js provider bindings.
* **Process**:
  1. User initiates a transaction (e.g., updating profile or issuing credentials) in the DApp.
  2. MetaMask prompts a popup to review gas fees and sign the payload.
  3. The transaction is mined block-by-block on the Hardhat local node.
  4. Real-time events are emitted by `IdentityRegistry.sol` to update the frontend state.
