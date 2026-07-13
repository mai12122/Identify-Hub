import { Profile, Credential, SimulatedWallet, Transaction, Block } from './types';

// Standard Simulated Private Keys / Addresses (similar to standard Hardhat accounts)
export const SIMULATED_WALLETS: SimulatedWallet[] = [
  {
    name: 'Contract Admin (Platform)',
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    role: 'Admin',
    balance: '100.00'
  },
  {
    name: 'CamTech University (Issuer)',
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    role: 'Issuer',
    balance: '100.00'
  },
  {
    name: 'Ministry of Transportation (Issuer)',
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    privateKey: '0x5de4111e5ebcd3602f6208a8a864a8f1178127614e1279f9031d8c42170e6ec1',
    role: 'Issuer',
    balance: '100.00'
  },
  {
    name: 'Alice (User / Subject)',
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    privateKey: '0x7c852118294e51e653712a81e05800f419141742a042883a4e9db7e7a4f77c27',
    role: 'User',
    balance: '10.50'
  },
  {
    name: 'Bob Johnson (Verifier / Employer)',
    address: '0x15d34AAf54a67C6430441f02d2394537881452ec',
    privateKey: '0x47e171e0ec89d035785afbde0c9f1a0282a2af8e12d4d84f23b20293122c4f2e',
    role: 'Verifier',
    balance: '5.25'
  }
];

export class SimulatedEVM {
  public profiles: Record<string, Profile> = {};
  public credentials: Record<number, Credential> = {};
  public authorizedIssuers: Record<string, boolean> = {};
  public balances: Record<string, number> = {};
  public credentialCount = 0;
  
  public transactions: Transaction[] = [];
  public blocks: Block[] = [];
  public currentBlockNumber = 0;

  constructor() {
    // Set initial balances
    SIMULATED_WALLETS.forEach(w => {
      this.balances[w.address.toLowerCase()] = parseFloat(w.balance);
    });

    // Admin is authorized issuer
    const adminAddr = SIMULATED_WALLETS[0].address.toLowerCase();
    this.authorizedIssuers[adminAddr] = true;

    // Prefill default issuers
    const uniAddr = SIMULATED_WALLETS[1].address.toLowerCase();
    const dmvAddr = SIMULATED_WALLETS[2].address.toLowerCase();
    this.authorizedIssuers[uniAddr] = true;
    this.authorizedIssuers[dmvAddr] = true;

    // Seed initial Genesis block
    this.createBlock([], '0x0000000000000000000000000000000000000000000000000000000000000000');

    // Seed some credentials and profile for Alice so the dashboard looks beautiful out of the box!
    this.seedInitialData();
  }

  private seedInitialData() {
    const aliceAddr = SIMULATED_WALLETS[3].address.toLowerCase();
    const uniAddr = SIMULATED_WALLETS[1].address.toLowerCase();
    const dmvAddr = SIMULATED_WALLETS[2].address.toLowerCase();

    // Alice profile
    this.profiles[aliceAddr] = {
      name: 'Alice Smith',
      email: 'alice.smith@example.com',
      metadataURI: 'ipfs://QmYwAPzwn5QMpMaWu8D9L2LGcVTzj63Zz5dQJ2u2b89fFf',
      createdAt: Math.floor(Date.now() / 1000) - 86400 * 5, // 5 days ago
      exists: true
    };

    // Issue university degree
    this.credentialCount++;
    this.credentials[this.credentialCount] = {
      id: this.credentialCount,
      subject: SIMULATED_WALLETS[3].address, // Alice
      issuer: SIMULATED_WALLETS[1].address,  // CamTech Uni
      credentialType: 'Bachelor of Computer Science',
      dataHash: '0x8f7c9e0d1b3a5f4e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e',
      issueDate: Math.floor(Date.now() / 1000) - 86400 * 4,
      expiryDate: 0, // Never
      isRevoked: false,
      exists: true
    };

    // Issue Driver's License
    this.credentialCount++;
    this.credentials[this.credentialCount] = {
      id: this.credentialCount,
      subject: SIMULATED_WALLETS[3].address, // Alice
      issuer: SIMULATED_WALLETS[2].address,  // DMV
      credentialType: 'Digital Driver License (Class A)',
      dataHash: '0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
      issueDate: Math.floor(Date.now() / 1000) - 86400 * 3,
      expiryDate: Math.floor(Date.now() / 1000) + 86400 * 365, // 1 year expiry
      isRevoked: false,
      exists: true
    };

    // Set simulated transaction records for these seed actions
    this.addSimulatedTransaction(
      SIMULATED_WALLETS[0].address,
      '0x0000000000000000000000000000000000000000', // Deploy Contract
      '0.0',
      'constructor',
      [],
      'Success'
    );

    this.addSimulatedTransaction(
      SIMULATED_WALLETS[0].address,
      '0xIdentityRegistryContractAddress',
      '0.0',
      'authorizeIssuer',
      [uniAddr, 'true'],
      'Success'
    );

    this.addSimulatedTransaction(
      SIMULATED_WALLETS[0].address,
      '0xIdentityRegistryContractAddress',
      '0.0',
      'authorizeIssuer',
      [dmvAddr, 'true'],
      'Success'
    );

    this.addSimulatedTransaction(
      aliceAddr,
      '0xIdentityRegistryContractAddress',
      '0.0',
      'createOrUpdateProfile',
      ['Alice Smith', 'alice.smith@example.com', 'ipfs://QmYwAP...'],
      'Success'
    );

    this.addSimulatedTransaction(
      uniAddr,
      '0xIdentityRegistryContractAddress',
      '0.0',
      'issueCredential',
      [aliceAddr, 'Bachelor of Computer Science', '0x8f7c9e0d...', '0'],
      'Success'
    );

    this.addSimulatedTransaction(
      dmvAddr,
      '0xIdentityRegistryContractAddress',
      '0.0',
      'issueCredential',
      [aliceAddr, 'Digital Driver License (Class A)', '0x3a4b5c6d...', '1815392000'],
      'Success'
    );
  }

  private addSimulatedTransaction(
    from: string,
    to: string,
    value: string,
    method: string,
    args: string[],
    status: 'Success' | 'Failed'
  ) {
    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const gasUsed = 21000 + Math.floor(Math.random() * 80000);
    
    // Deduct gas from sender balance (1 gas = 10 Gwei = 0.00000001 ETH, so e.g. 50000 gas = 0.0005 ETH)
    const sender = from.toLowerCase();
    const gasFeeEth = (gasUsed * 20) / 100000000; // simulated 20 gwei gas price
    if (this.balances[sender]) {
      this.balances[sender] = Math.max(0, this.balances[sender] - gasFeeEth);
    }

    const tx: Transaction = {
      hash: txHash,
      blockNumber: this.currentBlockNumber + 1,
      from,
      to,
      value,
      gasUsed,
      method,
      args,
      status,
      timestamp: Math.floor(Date.now() / 1000)
    };

    this.transactions.push(tx);
    this.createBlock([tx]);
    return tx;
  }

  private createBlock(txs: Transaction[], forcedParentHash?: string) {
    this.currentBlockNumber++;
    const blockHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const parent = forcedParentHash || (this.blocks.length > 0 ? this.blocks[this.blocks.length - 1].hash : '0x0000000000000000000000000000000000000000000000000000000000000000');
    
    const block: Block = {
      number: this.currentBlockNumber,
      hash: blockHash,
      parentHash: parent,
      timestamp: Math.floor(Date.now() / 1000),
      transactions: txs,
      miner: '0x0000000000000000000000000000000000000000'
    };
    this.blocks.push(block);
  }

  // Contract Methods Simulated
  public createOrUpdateProfile(from: string, name: string, email: string, metadataURI: string) {
    if (!name || !email) {
      this.addSimulatedTransaction(from, '0xIdentityRegistryContractAddress', '0.0', 'createOrUpdateProfile', [name, email, metadataURI], 'Failed');
      throw new Error('Name and Email are required.');
    }

    this.profiles[from.toLowerCase()] = {
      name,
      email,
      metadataURI,
      createdAt: Math.floor(Date.now() / 1000),
      exists: true
    };

    const tx = this.addSimulatedTransaction(
      from,
      '0xIdentityRegistryContractAddress',
      '0.0',
      'createOrUpdateProfile',
      [name, email, metadataURI],
      'Success'
    );
    return tx;
  }

  public issueCredential(from: string, subject: string, credentialType: string, dataHash: string, expiryTimestamp: number) {
    const sender = from.toLowerCase();
    const isAuthorized = this.authorizedIssuers[sender] || sender === SIMULATED_WALLETS[0].address.toLowerCase();
    
    if (!isAuthorized) {
      this.addSimulatedTransaction(from, '0xIdentityRegistryContractAddress', '0.0', 'issueCredential', [subject, credentialType, dataHash, expiryTimestamp.toString()], 'Failed');
      throw new Error('Sender is not an authorized issuer.');
    }

    if (!subject || !credentialType || !dataHash) {
      this.addSimulatedTransaction(from, '0xIdentityRegistryContractAddress', '0.0', 'issueCredential', [subject, credentialType, dataHash, expiryTimestamp.toString()], 'Failed');
      throw new Error('Subject address, credential type, and data hash are required.');
    }

    this.credentialCount++;
    const cred: Credential = {
      id: this.credentialCount,
      subject,
      issuer: from,
      credentialType,
      dataHash,
      issueDate: Math.floor(Date.now() / 1000),
      expiryDate: expiryTimestamp,
      isRevoked: false,
      exists: true
    };

    this.credentials[this.credentialCount] = cred;

    const tx = this.addSimulatedTransaction(
      from,
      '0xIdentityRegistryContractAddress',
      '0.0',
      'issueCredential',
      [subject, credentialType, dataHash, expiryTimestamp.toString()],
      'Success'
    );
    return { tx, id: this.credentialCount };
  }

  public revokeCredential(from: string, id: number) {
    const cred = this.credentials[id];
    if (!cred || !cred.exists) {
      this.addSimulatedTransaction(from, '0xIdentityRegistryContractAddress', '0.0', 'revokeCredential', [id.toString()], 'Failed');
      throw new Error('Credential does not exist.');
    }

    const sender = from.toLowerCase();
    const adminAddr = SIMULATED_WALLETS[0].address.toLowerCase();
    const isIssuer = cred.issuer.toLowerCase() === sender;
    const isAdmin = sender === adminAddr;

    if (!isIssuer && !isAdmin) {
      this.addSimulatedTransaction(from, '0xIdentityRegistryContractAddress', '0.0', 'revokeCredential', [id.toString()], 'Failed');
      throw new Error('Only the issuing address or admin can revoke this credential.');
    }

    if (cred.isRevoked) {
      this.addSimulatedTransaction(from, '0xIdentityRegistryContractAddress', '0.0', 'revokeCredential', [id.toString()], 'Failed');
      throw new Error('Credential is already revoked.');
    }

    cred.isRevoked = true;

    const tx = this.addSimulatedTransaction(
      from,
      '0xIdentityRegistryContractAddress',
      '0.0',
      'revokeCredential',
      [id.toString()],
      'Success'
    );
    return tx;
  }

  public authorizeIssuer(from: string, issuer: string, status: boolean) {
    const sender = from.toLowerCase();
    const adminAddr = SIMULATED_WALLETS[0].address.toLowerCase();
    
    if (sender !== adminAddr) {
      this.addSimulatedTransaction(from, '0xIdentityRegistryContractAddress', '0.0', 'authorizeIssuer', [issuer, status.toString()], 'Failed');
      throw new Error('Only admin can authorize or deauthorize issuers.');
    }

    this.authorizedIssuers[issuer.toLowerCase()] = status;

    const tx = this.addSimulatedTransaction(
      from,
      '0xIdentityRegistryContractAddress',
      '0.0',
      'authorizeIssuer',
      [issuer, status.toString()],
      'Success'
    );
    return tx;
  }

  public verifyCredential(id: number) {
    const cred = this.credentials[id];
    if (!cred || !cred.exists) {
      return { isValid: false, message: 'Credential not found' };
    }

    const now = Math.floor(Date.now() / 1000);
    const expired = cred.expiryDate > 0 && now > cred.expiryDate;
    const isValid = !cred.isRevoked && !expired;

    let message = 'Credential is valid and cryptographically active on-chain!';
    if (cred.isRevoked) {
      message = 'Credential was revoked by the issuer on-chain!';
    } else if (expired) {
      message = 'Credential has expired!';
    }

    return {
      isValid,
      message,
      credential: cred
    };
  }
}
