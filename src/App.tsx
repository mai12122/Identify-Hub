import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ChevronDown,
  ChevronUp,
  Radio,
  Sparkles,
  Link2,
  Coins
} from 'lucide-react';
import Button from './components/ui/Button';

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

  // Persona dropdown open/closed
  const [dropdownOpen, setDropdownOpen] = useState(false);

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

  // Fetch MetaMask balance helper
  const updateMetaMaskBalance = useCallback(async (addressOverride?: string) => {
    const targetAddress = addressOverride || metaMaskAddress;
    if (providerMode === 'METAMASK' && targetAddress && (window as any).ethereum) {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const balanceBig = await provider.getBalance(targetAddress);
        const balanceEth = ethers.formatEther(balanceBig);
        setMetaMaskBalance(parseFloat(balanceEth).toFixed(4));
      } catch (err) {
        console.error("Error updating MetaMask balance:", err);
      }
    }
  }, [providerMode, metaMaskAddress]);

  // Periodically refresh MetaMask balance & on account/provider change
  useEffect(() => {
    if (providerMode === 'METAMASK' && metaMaskAddress) {
      updateMetaMaskBalance();
      const interval = setInterval(() => updateMetaMaskBalance(), 8000); // Poll every 8s
      return () => clearInterval(interval);
    }
  }, [providerMode, metaMaskAddress, updateMetaMaskBalance]);

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

  // Request Testnet / Sim Faucet
  const requestFaucet = () => {
    if (providerMode === 'SIMULATED') {
      const addr = activeSimWallet.address.toLowerCase();
      evmRef.current.balances[addr] = (evmRef.current.balances[addr] || 0) + 10.0;
      refreshOnChainState();
      addToast(`Faucet request successful! Credited +10.0000 ETH to ${activeSimWallet.name}.`, 'success');
    } else {
      updateMetaMaskBalance();
      addToast('Fetched absolute latest balance from your active MetaMask network! For more test ETH, please use a public testnet faucet (e.g. Sepolia Faucet).', 'info');
    }
  };

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
    <div className="min-h-screen text-zinc-100 flex flex-col font-sans select-none antialiased relative overflow-hidden bg-[#030712]">
      {/* Eye-catching premium top neon bar */}
      <div className="neon-top-bar w-full absolute top-0 left-0 z-50"></div>

      {/* Futuristic Cyber grid background overlay */}
      <div className="cyber-grid"></div>

      {/* Sleek Ambient Top Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[180px] bg-gradient-to-b from-violet-600/15 via-cyan-500/5 to-transparent blur-3xl pointer-events-none z-0"></div>

      {/* Header Bar */}
      <header className="relative border-b border-white/5 bg-zinc-950/60 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-gradient-to-br from-violet-600/20 to-cyan-500/10 rounded-2xl text-violet-400 border border-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.15)] shrink-0">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-base font-bold font-display tracking-tight text-white flex items-center">
                Decentralized Identity Hub
              </h1>
              <span className="text-[9px] bg-violet-500/10 text-violet-300 border border-violet-500/20 px-2.5 py-0.5 rounded-full font-mono uppercase tracking-widest font-bold">
                W3C DID Registry
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">Secure fullstack on-chain verifiable credential issuer & vault</p>
          </div>
        </div>

        {/* Web3 / Wallet Connection Controller */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Simulated Wallet Swapper */}
          {providerMode === 'SIMULATED' && (
            <div className="relative">
              <div 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 bg-white/3 hover:bg-white/8 border border-white/5 hover:border-violet-500/20 rounded-xl px-3.5 py-2 cursor-pointer transition-all duration-200"
              >
                <div className="text-right">
                  <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Sim Wallet Role</p>
                  <p className="text-xs font-semibold text-zinc-200">{activeSimWallet.name}</p>
                </div>
                {dropdownOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-zinc-400 pl-1.5 transition-transform duration-200" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 pl-1.5 transition-transform duration-200" />
                )}
              </div>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-64 bg-zinc-950/95 border border-white/5 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.6)] py-1.5 z-50 origin-top-right animate-fade-in backdrop-blur-md">
                    <p className="px-3.5 py-2 text-[9px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5">
                      Select Simulated Persona
                    </p>
                    {SIMULATED_WALLETS.map((wallet, idx) => (
                      <div
                        key={wallet.address}
                        onClick={() => {
                          setActiveSimWalletIdx(idx);
                          setDropdownOpen(false);
                          addToast(`Swapped simulated persona to: ${wallet.name}`, 'info');
                        }}
                        className={`px-3.5 py-2.5 text-xs hover:bg-white/5 cursor-pointer flex items-center justify-between border-b border-white/5 last:border-0 transition-all duration-150 ${
                          activeSimWalletIdx === idx ? 'bg-violet-500/10 text-violet-300' : 'text-zinc-300'
                        }`}
                      >
                        <div>
                          <p className="font-semibold">{wallet.name}</p>
                          <p className="text-[9px] text-zinc-500 font-mono mt-0.5 truncate max-w-[150px]">{wallet.address}</p>
                        </div>
                        <span className="text-[9px] bg-zinc-900 border border-white/5 px-2 py-0.5 rounded-md text-zinc-400 font-mono font-semibold">
                          {wallet.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Wallet connection status */}
          <div className="flex items-center space-x-3 bg-white/2 border border-white/5 rounded-xl px-4 py-2 text-xs">
            <Wallet className="w-4 h-4 text-violet-400 shrink-0" />
            <div className="font-mono">
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Active Address</p>
              <p className="text-zinc-300 font-semibold truncate max-w-[100px]" title={activeAddress}>
                {activeAddress}
              </p>
            </div>
            <div className="border-l border-white/5 pl-3.5 pr-1 flex items-center justify-between gap-2.5">
              <div>
                <p className="text-[9px] text-zinc-500 uppercase font-mono tracking-widest">Balance</p>
                <p className="text-emerald-400 font-bold">{activeBalance}</p>
              </div>
              <button
                onClick={requestFaucet}
                title="Request +10.0 ETH Faucet"
                className="p-1 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 rounded border border-violet-500/20 hover:border-violet-500/40 transition-all cursor-pointer flex items-center justify-center"
              >
                <Coins className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* MetaMask Toggle Button */}
          {metaMaskConnected ? (
            <Button onClick={disconnectMetaMask} variant="ghost" size="sm">
              <Link2 className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </Button>
          ) : (
            <Button onClick={connectMetaMask} disabled={metaMaskLoading} className="flex items-center space-x-2" size="md">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shrink-0" />
              <span>{metaMaskLoading ? 'Connecting...' : 'Connect Wallet'}</span>
            </Button>
          )}
        </div>
      </header>

      {/* Main Grid Content */}
      <div className="relative flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-3 space-y-5">
          <nav className="card p-4.5 space-y-1.5">
            <h2 className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
              DApp Core Modules
            </h2>

            <button
              onClick={() => setActiveTab('identity')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'identity'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-violet-950/20 border border-violet-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/3'
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              <span>Identity Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('issuer')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'issuer'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-violet-950/20 border border-violet-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/3'
              }`}
            >
              <Cpu className="w-4 h-4 shrink-0" />
              <span>Issuer Portal</span>
            </button>

            <button
              onClick={() => setActiveTab('vault')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'vault'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-violet-950/20 border border-violet-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/3'
              }`}
            >
              <Award className="w-4 h-4 shrink-0" />
              <span>Credential Vault</span>
            </button>

            <button
              onClick={() => setActiveTab('verifier')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'verifier'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-violet-950/20 border border-violet-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/3'
              }`}
            >
              <Search className="w-4 h-4 shrink-0" />
              <span>Verification Gate</span>
            </button>

            <h2 className="px-3 pt-5 pb-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono border-t border-white/5 mt-3.5">
              Blockchain Workspace
            </h2>

            <button
              onClick={() => setActiveTab('ide')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'ide'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-violet-950/20 border border-violet-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/3'
              }`}
            >
              <FileCode className="w-4 h-4 shrink-0" />
              <span>Solidity Contract</span>
            </button>

            <button
              onClick={() => setActiveTab('node')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'node'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-violet-950/20 border border-violet-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/3'
              }`}
            >
              <Activity className="w-4 h-4 shrink-0" />
              <span>Network Explorer</span>
            </button>
          </nav>

          {/* Network Connection Mode Switcher */}
          <div className="card space-y-4">
            <div className="flex items-center space-x-2 text-zinc-300">
              <Radio className="w-4 h-4 text-violet-400 animate-pulse" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest font-mono">
                Ledger Connectivity
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 border border-white/5 rounded-xl">
              <button
                onClick={() => {
                  setProviderMode('SIMULATED');
                  addToast('Swapped ledger connectivity to Sandbox Mode.', 'info');
                }}
                className={`py-1.5 text-center text-[10px] font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                  providerMode === 'SIMULATED'
                    ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                    : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                }`}
              >
                Sandbox
              </button>
              <button
                onClick={connectMetaMask}
                className={`py-1.5 text-center text-[10px] font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                  providerMode === 'METAMASK'
                    ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                    : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                }`}
              >
                MetaMask
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
              {providerMode === 'SIMULATED'
                ? 'Running within a direct EVM environment. Actions execute instantly with simulated block times, optimal for frictionless validation.'
                : `Active provider session via MetaMask on ${metaMaskNetwork || 'Custom network'}. Transactions prompt real cryptographic key signatures.`}
            </p>
          </div>
        </aside>

        {/* Dynamic Display Area */}
        <main className="lg:col-span-9 h-full min-h-[500px]">
          <div className="h-full">
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
            className={`pointer-events-auto p-4 rounded-2xl border flex items-start space-x-3 shadow-[0_15px_35px_rgba(0,0,0,0.6)] backdrop-blur-md animate-fade-in transition-all duration-300 ${
              toast.type === 'success'
                ? 'bg-zinc-950/90 border-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.05)]'
                : toast.type === 'error'
                ? 'bg-zinc-950/90 border-rose-500/20 text-rose-400 shadow-[0_0_20px_rgba(239,68,68,0.05)]'
                : 'bg-zinc-950/90 border-violet-500/20 text-violet-300 shadow-[0_0_20px_rgba(139,92,246,0.05)]'
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
              <p className="font-bold text-zinc-100 font-display">
                {toast.type === 'success' ? 'Ledger Transaction Confirmed' : toast.type === 'error' ? 'Transaction Exception' : 'System Notice'}
              </p>
              <p className="text-zinc-400 mt-1 font-mono text-[10px] break-all leading-normal">{toast.message}</p>
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
