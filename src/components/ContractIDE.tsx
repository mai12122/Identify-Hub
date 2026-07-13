import React, { useState } from 'react';
import { FileCode, Play, Cpu, ShieldAlert, CheckCircle2, Copy } from 'lucide-react';

const SOLIDITY_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IdentityRegistry
 * @dev Decentralized Identity (DID) system for issuing, managing, and verifying credentials.
 */
contract IdentityRegistry {
    struct Profile {
        string name;
        string email;
        string metadataURI; // IPFS hash or DID document URL
        uint256 createdAt;
        bool exists;
    }

    struct Credential {
        uint256 id;
        address subject;
        address issuer;
        string credentialType; // e.g., "Degree", "KYC", "Employment"
        string dataHash;       // Cryptographic hash of the credential data
        uint256 issueDate;
        uint256 expiryDate;
        bool isRevoked;
        bool exists;
    }

    // Mappings
    mapping(address => Profile) public profiles;
    mapping(uint256 => Credential) public credentials;
    mapping(address => bool) public authorizedIssuers;
    
    uint256 public credentialCount;
    address public admin;

    // Events
    event ProfileUpdated(address indexed user, string name, string email, string metadataURI);
    event CredentialIssued(uint256 indexed id, address indexed subject, address indexed issuer, string credentialType);
    event CredentialRevoked(uint256 indexed id, address indexed issuer);
    event IssuerAuthorized(address indexed issuer, bool status);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyIssuer() {
        require(authorizedIssuers[msg.sender] || msg.sender == admin, "Not an authorized issuer");
        _;
    }

    constructor() {
        admin = msg.sender;
        authorizedIssuers[msg.sender] = true; // Admin is issuer by default
    }

    function authorizeIssuer(address issuer, bool status) external onlyAdmin {
        authorizedIssuers[issuer] = status;
        emit IssuerAuthorized(issuer, status);
    }

    function createOrUpdateProfile(
        string calldata name,
        string calldata email,
        string calldata metadataURI
    ) external {
        profiles[msg.sender] = Profile({
            name: name,
            email: email,
            metadataURI: metadataURI,
            createdAt: block.timestamp,
            exists: true
        });
        emit ProfileUpdated(msg.sender, name, email, metadataURI);
    }

    function issueCredential(
        address subject,
        string calldata credentialType,
        string calldata dataHash,
        uint256 expiryDate
    ) external onlyIssuer returns (uint256) {
        require(subject != address(0), "Invalid subject address");
        
        credentialCount++;
        credentials[credentialCount] = Credential({
            id: credentialCount,
            subject: subject,
            issuer: msg.sender,
            credentialType: credentialType,
            dataHash: dataHash,
            issueDate: block.timestamp,
            expiryDate: expiryDate,
            isRevoked: false,
            exists: true
        });

        emit CredentialIssued(credentialCount, subject, msg.sender, credentialType);
        return credentialCount;
    }

    function revokeCredential(uint256 id) external {
        require(credentials[id].exists, "Credential does not exist");
        require(credentials[id].issuer == msg.sender || msg.sender == admin, "Only issuer or admin can revoke");
        require(!credentials[id].isRevoked, "Already revoked");

        credentials[id].isRevoked = true;
        emit CredentialRevoked(id, msg.sender);
    }

    function verifyCredential(uint256 id) external view returns (
        bool isValid,
        address subject,
        address issuer,
        string memory credentialType,
        string memory dataHash,
        uint256 expiryDate,
        bool isRevoked
    ) {
        Credential memory cred = credentials[id];
        if (!cred.exists) {
            return (false, address(0), address(0), "", "", 0, false);
        }

        bool expired = cred.expiryDate > 0 && block.timestamp > cred.expiryDate;
        isValid = !cred.isRevoked && !expired;

        return (
            isValid,
            cred.subject,
            cred.issuer,
            cred.credentialType,
            cred.dataHash,
            cred.expiryDate,
            cred.isRevoked
        );
    }
}`;

const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "id", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "subject", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "issuer", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "credentialType", "type": "string" }
    ],
    "name": "CredentialIssued",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "issuer", "type": "address" },
      { "internalType": "bool", "name": "status", "type": "bool" }
    ],
    "name": "authorizeIssuer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "string", "name": "email", "type": "string" },
      { "internalType": "string", "name": "metadataURI", "type": "string" }
    ],
    "name": "createOrUpdateProfile",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "subject", "type": "address" },
      { "internalType": "string", "name": "credentialType", "type": "string" },
      { "internalType": "string", "name": "dataHash", "type": "string" },
      { "internalType": "uint256", "name": "expiryDate", "type": "uint256" }
    ],
    "name": "issueCredential",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export default function ContractIDE() {
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiled, setCompiled] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCompile = () => {
    setIsCompiling(true);
    setTimeout(() => {
      setIsCompiling(false);
      setCompiled(true);
    }, 1200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(SOLIDITY_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="contract-ide" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full font-mono">
      {/* Code Editor */}
      <div className="lg:col-span-8 flex flex-col bg-zinc-900/20 border border-zinc-900/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.3)] min-h-[500px]">
        <div className="flex items-center justify-between px-4.5 py-3 bg-zinc-950/60 border-b border-zinc-900/50">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
            </div>
            <span className="text-xs text-zinc-400 font-mono pl-2 font-medium">IdentityRegistry.sol</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="p-2 text-xs text-zinc-400 hover:text-zinc-100 bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/60 rounded-xl transition-all duration-200 cursor-pointer"
              title="Copy Solidity Code"
            >
              {copied ? 'Copied!' : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleCompile}
              disabled={isCompiling}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-zinc-50 bg-emerald-600 hover:bg-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] border border-emerald-500/20 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-40"
            >
              <Play className={`w-3.5 h-3.5 ${isCompiling ? 'animate-spin' : ''}`} />
              <span>{isCompiling ? 'Compiling...' : 'Compile Contract'}</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-emerald-400/80 leading-relaxed max-h-[600px] bg-zinc-950/40">
          <pre className="whitespace-pre-wrap">{SOLIDITY_CODE}</pre>
        </div>
      </div>

      {/* Compile Logs and Details */}
      <div className="lg:col-span-4 flex flex-col space-y-6">
        {/* Compiler Status */}
        <div className="bg-zinc-900/20 border border-zinc-900/80 backdrop-blur-md rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
          <h3 className="text-sm font-semibold font-display tracking-tight text-zinc-200 mb-3.5 flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Compiler Status</span>
          </h3>

          {isCompiling ? (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs text-zinc-400 font-mono">Running solc v0.8.20...</p>
            </div>
          ) : compiled ? (
            <div className="space-y-4">
              <div className="flex items-start space-x-3 bg-emerald-950/10 border border-emerald-500/15 p-3.5 rounded-xl text-emerald-400 shadow-[0_4px_20px_rgba(16,185,129,0.01)]">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-emerald-400 font-mono">Compiled Successfully</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Optimization: 200 runs. EVM: Shanghai.</p>
                </div>
              </div>

              <div className="space-y-2.5 py-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-500">Bytecode Size</span>
                  <span className="text-zinc-200 font-medium">12.44 KB</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-500">Estimated Gas</span>
                  <span className="text-zinc-200 font-medium">~680,000 gas</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-500">Contract Owner</span>
                  <span className="text-zinc-200 text-right truncate max-w-[150px] font-medium">0xf39F...2266</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start space-x-3 bg-amber-950/10 border border-amber-500/15 p-3.5 rounded-xl text-amber-500 shadow-[0_4px_20px_rgba(245,158,11,0.01)]">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-500 font-mono">Uncompiled</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Solidity file has been created. Click compile to prepare ABI/Bytecode.</p>
              </div>
            </div>
          )}
        </div>

        {/* ABI Inspector */}
        <div className="bg-zinc-900/20 border border-zinc-900/80 backdrop-blur-md rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] flex-1 flex flex-col">
          <h3 className="text-sm font-semibold font-display tracking-tight text-zinc-200 mb-3 flex items-center space-x-2">
            <FileCode className="w-4 h-4 text-violet-400" />
            <span>Contract ABI</span>
          </h3>
          <p className="text-xs text-zinc-400 mb-3.5">
            The Application Binary Interface (ABI) represents the JSON metadata used by ethers.js to interact with the Solidity functions on-chain.
          </p>

          <div className="flex-1 bg-zinc-950/60 rounded-xl p-3.5 font-mono text-[10px] text-violet-300 overflow-y-auto max-h-[250px] border border-zinc-900/80">
            <pre>{JSON.stringify(CONTRACT_ABI, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
