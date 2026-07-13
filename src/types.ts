export interface Profile {
  name: string;
  email: string;
  metadataURI: string;
  createdAt: number;
  exists: boolean;
}

export interface Credential {
  id: number;
  subject: string;
  issuer: string;
  credentialType: string;
  dataHash: string;
  issueDate: number;
  expiryDate: number; // 0 means never expires
  isRevoked: boolean;
  exists: boolean;
}

export interface SimulatedWallet {
  name: string;
  address: string;
  privateKey: string;
  role: 'User' | 'Admin' | 'Issuer' | 'Verifier';
  balance: string; // ETH
}

export interface Transaction {
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  value: string;
  gasUsed: number;
  method: string;
  args: string[];
  status: 'Success' | 'Failed';
  timestamp: number;
}

export interface Block {
  number: number;
  hash: string;
  parentHash: string;
  timestamp: number;
  transactions: Transaction[];
  miner: string;
}
