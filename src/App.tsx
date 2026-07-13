import React, { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { SimulatedEVM, SIMULATED_WALLETS } from './mockBlockchain';
import { SimulatedWallet } from './types';
import ProfilePanel from './components/ProfilePanel';
import IssuerPanel from './components/IssuerPanel';
import CredentialsVault from './components/CredentialsVault';
import VerifierPortal from './components/VerifierPortal';
import ContractIDE from './components/ContractIDE';
import BlockchainExplorer from './components/BlockchainExplorer';

// Lucide Icons
import {
  Shield,
  Layers,
  Cpu,
  User,
  Award,
  Search,
  FileCode,
  Activity,
  Globe,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  ChevronDown
} from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function App() {
  // Tabs Definition
  type TabType = 'identity' | 'issuer' | 'vault' | 'verifier' | 'ide' | 'node';
  const [activeTab, setActiveTab] = useState<TabType>('identity');

  // Network/Provider Mode: 'SIMULATED' or 'METAMASK'
  const [providerMode, setProviderMode] = useState<'SIMULATED' | 'METAMASK'>('SIMULATED');

  // Simulated EVM Instance
  const evmRef = useRef<SimulatedEVM>(new SimulatedEVM());
  const [evm, setEvm] = useState<SimulatedEVM>(evmRef.current);

  // Simulated Wallet state
  const [activeSimWalletIdx, setActiveSimWalletIdx] = useState<number>(3); // Default to Alice the User
  const activeSimWallet = SIMULATED_WALLETS[activeSimWalletIdx];

  // MetaMask Web3 States
  const [metaMaskAddress, setMetaMaskAddress] = useState<string | null>(null);
  const [metaMaskBalance, setMetaMaskBalance] = useState<string | null>(null);
  const [metaMaskNetwork, setMetaMaskNetwork] = useState<string | null>(null);
  const [metaMaskConnected, setMetaMaskConnected] = useState<boolean>(false);
  const [metaMaskLoading, setMetaMaskLoading] = useState<boolean>(false);

  // Notification Toast State
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Force UI re-render on on-chain state change
  const refreshOnChainState = () => {
    setEvm({ ...evmRef.current });
  };

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // MetaMask Connection Handlers
  const connectMetaMask = async () => {
    if (!(window as any).ethereum) {
      addToast('MetaMask extension was not detected. Please open this app in a new tab or install MetaMask.', 'error');
      return;
    }

    setMetaMaskLoading(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      // Request accounts
      const accounts = await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const balanceBig = await provider.getBalance(address);
      const balanceEth = ethers.formatEther(balanceBig);
      const network = await provider.getNetwork();

      setMetaMaskAddress(address);
      setMetaMaskBalance(parseFloat(balanceEth).toFixed(4));
      setMetaMaskNetwork(network.name === 'unknown' ? 'Localhost/Custom' : network.name);
      setMetaMaskConnected(true);
      setProviderMode('METAMASK');
      addToast(`Connected to MetaMask account: ${address.slice(0, 6)}...${address.slice(-4)}`, 'success');
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'MetaMask connection rejected.', 'error');
    } finally {
      setMetaMaskLoading(false);
    }
  };

  const disconnectMetaMask = () => {
    setMetaMaskAddress(null);
    setMetaMaskBalance(null);
    setMetaMaskNetwork(null);
    setMetaMaskConnected(false);
    setProviderMode('SIMULATED');
    addToast('Disconnected MetaMask. Switched to local simulated EVM node.', 'info');
  };

  // Standard MetaMask Listeners
  useEffect(() => {
    if ((window as any).ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectMetaMask();
        } else {
          setMetaMaskAddress(accounts[0]);
          addToast('MetaMask account changed. Updating interface...', 'info');
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
      (window as any).ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if ((window as any).ethereum.removeListener) {
          (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
          (window as any).ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  // Compute active variables based on providerMode
  const activeAddress = providerMode === 'METAMASK' && metaMaskAddress ? metaMaskAddress : activeSimWallet.address;
  const activeRole = providerMode === 'METAMASK' ? 'User/MetaMask' : activeSimWallet.role;
  const activeBalance = providerMode === 'METAMASK' && metaMaskBalance ? `${metaMaskBalance} ETH` : `${evm.balances[activeSimWallet.address.toLowerCase()]?.toFixed(4) || '0.00'} ETH`;

  const simulatedAccountObject: SimulatedWallet = {
    name: providerMode === 'METAMASK' ? 'MetaMask User' : activeSimWallet.name,
    address: activeAddress,
    privateKey: providerMode === 'METAMASK' ? 'Injected by MetaMask' : activeSimWallet.privateKey,
    role: providerMode === 'METAMASK' ? 'User' : activeSimWallet.role,
    balance: activeBalance
  };

  return (
    <div className="min-h-screen bg-[#07080B] text-zinc-100 flex flex-col font-sans select-none antialiased">
      {/* Sleek Top Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[120px] bg-gradient-to-b from-violet-900/10 to-transparent blur-3xl pointer-events-none z-0"></div>

      {/* Header Bar */}
      <header className="relative border-b border-zinc-900/70 bg-[#07080B]/65 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-violet-500/10 rounded-xl text-violet-400 border border-violet-500/15 shadow-[0_0_15px_rgba(139,92,246,0.08)]">
            <Shield className="w-5.5 h-5.5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold font-display tracking-tight text-zinc-50 flex items-center space-x-2">
              <span>Decentralized Identity Hub</span>
              <span className="text-[9px] bg-violet-950/40 text-violet-400 border border-violet-900/40 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider font-semibold">DID Registry</span>
            </h1>
            <p className="text-xs text-zinc-400">Secure credential tracking on EVM compatible blockchains</p>
          </div>
        </div>

        {/* Web3 / Wallet Connection Controller */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Simulated Wallet Swapper */}
          {providerMode === 'SIMULATED' && (
            <div className="relative group">
              <div className="flex items-center space-x-1 bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800/60 rounded-xl px-3.5 py-2 cursor-pointer transition-all duration-200">
                <div className="text-right">
                  <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Sim Wallet Role</p>
                  <p className="text-xs font-medium text-zinc-300">{activeSimWallet.name}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 pl-1.5 transition-transform duration-200 group-hover:translate-y-[1px]" />
              </div>

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-64 bg-zinc-950 border border-zinc-900 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] py-1.5 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 z-50 origin-top-right">
                <p className="px-3.5 py-2 text-[9px] font-semibold text-zinc-500 uppercase tracking-widest border-b border-zinc-900/80">
                  Select Simulated Persona
                </p>
                {SIMULATED_WALLETS.map((wallet, idx) => (
                  <div
                    key={wallet.address}
                    onClick={() => {
                      setActiveSimWalletIdx(idx);
                      addToast(`Swapped simulated persona to: ${wallet.name}`, 'info');
                    }}
                    className={`px-3.5 py-2.5 text-xs hover:bg-zinc-900/60 cursor-pointer flex items-center justify-between border-b border-zinc-900/40 last:border-0 transition-all duration-150 ${
                      activeSimWalletIdx === idx ? 'bg-violet-950/20 text-violet-400' : 'text-zinc-300'
                    }`}
                  >
                    <div>
                      <p className="font-medium">{wallet.name}</p>
                      <p className="text-[9px] text-zinc-500 font-mono mt-0.5 truncate max-w-[170px]">{wallet.address}</p>
                    </div>
                    <span className="text-[9px] bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-400 font-mono">
                      {wallet.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wallet connection status */}
          <div className="flex items-center space-x-2.5 bg-zinc-900/40 border border-zinc-800/60 rounded-xl px-4 py-2 text-xs">
            <Wallet className="w-3.5 h-3.5 text-violet-400" />
            <div className="font-mono">
              <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Active Key</p>
              <p className="text-zinc-300 font-medium truncate max-w-[110px]" title={activeAddress}>
                {activeAddress}
              </p>
            </div>
            <div className="border-l border-zinc-800/80 pl-3.5">
              <p className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider">Balance</p>
              <p className="text-emerald-400 font-medium">{activeBalance}</p>
            </div>
          </div>

          {/* MetaMask Toggle Button */}
          {metaMaskConnected ? (
            <button
              onClick={disconnectMetaMask}
              className="px-3.5 py-2 text-xs font-medium bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-900/30 rounded-xl transition-all duration-200 cursor-pointer"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={connectMetaMask}
              disabled={metaMaskLoading}
              className="px-4 py-2 text-xs font-semibold bg-violet-600 hover:bg-violet-500 hover:shadow-[0_0_15px_rgba(139,92,246,0.25)] text-zinc-50 rounded-xl transition-all duration-200 cursor-pointer shadow-md shadow-violet-950/20 flex items-center space-x-2"
            >
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
              <span>{metaMaskLoading ? 'Connecting...' : 'Connect Wallet'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Grid Content */}
      <div className="relative flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-3 space-y-4">
          <nav className="bg-zinc-900/20 border border-zinc-900/60 backdrop-blur-md rounded-2xl p-4 space-y-1.5">
            <h2 className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              DApp Modules
            </h2>

            <button
              onClick={() => setActiveTab('identity')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                activeTab === 'identity'
                  ? 'bg-violet-600 text-zinc-50 shadow-md shadow-violet-950/20 border border-violet-500/20'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40'
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              <span>Identity Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('issuer')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                activeTab === 'issuer'
                  ? 'bg-violet-600 text-zinc-50 shadow-md shadow-violet-950/20 border border-violet-500/20'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40'
              }`}
            >
              <Cpu className="w-4 h-4 shrink-0" />
              <span>Issuer Portal</span>
            </button>

            <button
              onClick={() => setActiveTab('vault')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                activeTab === 'vault'
                  ? 'bg-violet-600 text-zinc-50 shadow-md shadow-violet-950/20 border border-violet-500/20'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40'
              }`}
            >
              <Award className="w-4 h-4 shrink-0" />
              <span>Credential Vault</span>
            </button>

            <button
              onClick={() => setActiveTab('verifier')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                activeTab === 'verifier'
                  ? 'bg-violet-600 text-zinc-50 shadow-md shadow-violet-950/20 border border-violet-500/20'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40'
              }`}
            >
              <Search className="w-4 h-4 shrink-0" />
              <span>Verification Gate</span>
            </button>

            <h2 className="px-3 pt-5 pb-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-t border-zinc-900/50 mt-3.5">
              Blockchain Workspace
            </h2>

            <button
              onClick={() => setActiveTab('ide')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                activeTab === 'ide'
                  ? 'bg-violet-600 text-zinc-50 shadow-md shadow-violet-950/20 border border-violet-500/20'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40'
              }`}
            >
              <FileCode className="w-4 h-4 shrink-0" />
              <span>Solidity Contract</span>
            </button>

            <button
              onClick={() => setActiveTab('node')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                activeTab === 'node'
                  ? 'bg-violet-600 text-zinc-50 shadow-md shadow-violet-950/20 border border-violet-500/20'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40'
              }`}
            >
              <Activity className="w-4 h-4 shrink-0" />
              <span>Network Explorer</span>
            </button>
          </nav>

          {/* Network Connection Mode Switcher */}
          <div className="bg-zinc-900/20 border border-zinc-900/60 backdrop-blur-md rounded-2xl p-4.5 space-y-3.5">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Ledger Connectivity
            </h3>
            <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 border border-zinc-900 rounded-xl">
              <button
                onClick={() => {
                  setProviderMode('SIMULATED');
                  addToast('Swapped ledger connectivity to Sandbox Mode.', 'info');
                }}
                className={`py-1.5 text-center text-[10px] font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                  providerMode === 'SIMULATED'
                    ? 'bg-violet-500/10 text-violet-400 border border-violet-500/25'
                    : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                }`}
              >
                Sandbox
              </button>
              <button
                onClick={connectMetaMask}
                className={`py-1.5 text-center text-[10px] font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                  providerMode === 'METAMASK'
                    ? 'bg-violet-500/10 text-violet-400 border border-violet-500/25'
                    : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                }`}
              >
                MetaMask
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              {providerMode === 'SIMULATED'
                ? 'Using a zero-gas simulated EVM environment inside the browser sandbox. Recommended for instantaneous, hassle-free validation!'
                : `Connected to MetaMask on ${metaMaskNetwork || 'Active Web3 Network'}. All actions are dispatched to a live blockchain network.`}
            </p>
          </div>
        </aside>

        {/* Dynamic Display Area */}
        <main className="lg:col-span-9 h-full min-h-[500px]">
          <div className="animate-fade-in h-full">
            {activeTab === 'identity' && (
              <ProfilePanel
                evm={evm}
                activeAccount={simulatedAccountObject}
                onRefresh={refreshOnChainState}
                addToast={addToast}
              />
            )}
            {activeTab === 'issuer' && (
              <IssuerPanel
                evm={evm}
                activeAccount={simulatedAccountObject}
                onRefresh={refreshOnChainState}
                addToast={addToast}
              />
            )}
            {activeTab === 'vault' && (
              <CredentialsVault
                evm={evm}
                activeAccount={simulatedAccountObject}
                onRefresh={refreshOnChainState}
                addToast={addToast}
              />
            )}
            {activeTab === 'verifier' && (
              <VerifierPortal
                evm={evm}
                addToast={addToast}
              />
            )}
            {activeTab === 'ide' && (
              <ContractIDE />
            )}
            {activeTab === 'node' && (
              <BlockchainExplorer
                evm={evm}
                onRefresh={refreshOnChainState}
              />
            )}
          </div>
        </main>
      </div>

      {/* Floating Notification Toast System */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border flex items-start space-x-3 shadow-[0_15px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl animate-fade-in transition-all duration-300 ${
              toast.type === 'success'
                ? 'bg-zinc-950/85 border-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.05)]'
                : toast.type === 'error'
                ? 'bg-zinc-950/85 border-rose-500/20 text-rose-400 shadow-[0_0_20px_rgba(239,68,68,0.05)]'
                : 'bg-zinc-950/85 border-violet-500/20 text-violet-300 shadow-[0_0_20px_rgba(139,92,246,0.05)]'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs leading-normal">
              <p className="font-semibold text-zinc-100">
                {toast.type === 'success' ? 'Transaction Success' : toast.type === 'error' ? 'Blockchain Error' : 'System Event'}
              </p>
              <p className="text-zinc-400 mt-0.5 font-mono text-[11px] break-all">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
