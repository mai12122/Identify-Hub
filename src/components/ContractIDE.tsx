import React, { useState } from 'react';
import { FileCode, Play, Cpu, ShieldAlert, CheckCircle2, Copy, Terminal, Check } from 'lucide-react';

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
    }, 1100);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(SOLIDITY_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Split lines to render line numbers
  const codeLines = SOLIDITY_CODE.split('\n');

  return (
    <div id="contract-ide" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full font-mono animate-fade-in">
      {/* Code Editor */}
      <div className="lg:col-span-8 flex flex-col bg-zinc-950/60 border border-white/5 rounded-2xl overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.4)] min-h-[500px]">
        {/* IDE Tab Header */}
        <div className="flex items-center justify-between px-4.5 py-3 bg-zinc-950 border-b border-white/5">
          <div className="flex items-center space-x-2.5">
            <div className="flex space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/60"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60"></span>
            </div>
            <div className="h-4 w-[1px] bg-white/10"></div>
            <div className="flex items-center space-x-1.5">
              <FileCode className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs text-zinc-300 font-medium">IdentityRegistry.sol</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="p-1.5 text-xs text-zinc-400 hover:text-white bg-white/3 hover:bg-white/8 border border-white/5 rounded-lg transition-all cursor-pointer"
              title="Copy Solidity Code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleCompile}
              disabled={isCompiling}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-50 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 border border-emerald-500/20 rounded-lg transition-all cursor-pointer"
            >
              <Play className={`w-3.5 h-3.5 ${isCompiling ? 'animate-spin' : ''}`} />
              <span>{isCompiling ? 'Compiling...' : 'Compile'}</span>
            </button>
          </div>
        </div>

        {/* Code View with numbers */}
        <div className="flex-1 overflow-y-auto p-4 flex font-mono text-[11px] leading-relaxed max-h-[550px] bg-zinc-950/20 select-text">
          {/* Numbers column */}
          <div className="text-zinc-600 text-right pr-4 select-none border-r border-white/5 shrink-0 text-right w-8">
            {codeLines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          {/* Solidity text column */}
          <div className="pl-4 text-zinc-300 overflow-x-auto flex-1 select-text">
            <pre className="whitespace-pre">
              {SOLIDITY_CODE}
            </pre>
          </div>
        </div>
      </div>

      {/* Compile Logs and Details */}
      <div className="lg:col-span-4 flex flex-col space-y-6">
        {/* Compiler Status */}
        <div className="card p-5 flex flex-col">
          <h3 className="text-sm font-semibold font-display tracking-tight text-zinc-200 mb-4 flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Solidity Compiler Settings</span>
          </h3>

          {isCompiling ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs text-zinc-400 font-mono">Invoking solc v0.8.20 compiler optimization pipeline...</p>
            </div>
          ) : compiled ? (
            <div className="space-y-4">
              <div className="flex items-start space-x-3 bg-emerald-500/5 border border-emerald-500/20 p-3.5 rounded-xl text-emerald-400">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-emerald-400 font-mono">Compilation Successful</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">solc v0.8.20+commit.a1b2c3d4</p>
                </div>
              </div>

              <div className="space-y-2 py-1 text-xs text-zinc-400 font-mono">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Target VM:</span>
                  <span className="text-zinc-200 font-semibold">Shanghai / POS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Optimizer Runs:</span>
                  <span className="text-zinc-200 font-semibold">200 runs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">ABI Size:</span>
                  <span className="text-zinc-200 font-semibold">1,412 bytes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Owner Admin:</span>
                  <span className="text-zinc-200 truncate max-w-[120px]">0xf39F...2266</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start space-x-3 bg-amber-500/5 border border-amber-500/20 p-3.5 rounded-xl text-amber-500">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-500 font-mono font-display">Uncompiled Code</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Click Compile to generate JSON ABI Metadata.</p>
              </div>
            </div>
          )}
        </div>

        {/* ABI Inspector */}
        <div className="card p-5 flex flex-col flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold font-display tracking-tight text-zinc-200 flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-violet-400" />
              <span>Generated ABI</span>
            </h3>
            <span className="text-[9px] bg-violet-500/10 border border-violet-500/20 text-violet-400 font-mono px-2 py-0.5 rounded uppercase font-bold">JSON</span>
          </div>
          <p className="text-xs text-zinc-400 mb-3.5 leading-relaxed">
            The JSON spec containing your mapped function types, used by ethers.js provider clients:
          </p>

          <div className="flex-1 bg-zinc-950/80 rounded-xl p-3 font-mono text-[9px] text-violet-300 overflow-y-auto max-h-[220px] border border-white/5 select-all">
            <pre>{JSON.stringify(CONTRACT_ABI, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
