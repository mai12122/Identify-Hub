import React, { useState } from 'react';
import { SimulatedEVM } from '../mockBlockchain';
import { Cpu, Layers, Database, Activity, RefreshCw, Clock } from 'lucide-react';

interface BlockchainExplorerProps {
  evm: SimulatedEVM;
  onRefresh: () => void;
}

export default function BlockchainExplorer({ evm, onRefresh }: BlockchainExplorerProps) {
  const [selectedTx, setSelectedTx] = useState<string | null>(null);

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    if (addr.startsWith('0xIdentity')) return 'IdentityRegistry Contract';
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'createOrUpdateProfile': return 'text-sky-400 bg-sky-950/30 border-sky-900/40';
      case 'issueCredential': return 'text-emerald-400 bg-emerald-950/30 border-emerald-900/40';
      case 'revokeCredential': return 'text-rose-400 bg-rose-950/30 border-rose-900/40';
      case 'authorizeIssuer': return 'text-violet-400 bg-violet-950/30 border-violet-900/40';
      default: return 'text-zinc-400 bg-zinc-950/30 border-zinc-900/40';
    }
  };

  const allTxs = [...evm.transactions].reverse();
  const allBlocks = [...evm.blocks].reverse();

  return (
    <div id="blockchain-explorer" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Node Stats Dashboard */}
      <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-900/20 border border-zinc-900/80 rounded-2xl p-4 flex items-center space-x-4 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
          <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Node Operator</p>
            <p className="text-sm font-semibold font-mono text-zinc-100">Local Sandbox</p>
          </div>
        </div>

        <div className="bg-zinc-900/20 border border-zinc-900/80 rounded-2xl p-4 flex items-center space-x-4 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
          <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Block Height</p>
            <p className="text-sm font-semibold font-mono text-zinc-100">#{evm.currentBlockNumber}</p>
          </div>
        </div>

        <div className="bg-zinc-900/20 border border-zinc-900/80 rounded-2xl p-4 flex items-center space-x-4 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
          <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Total Transactions</p>
            <p className="text-sm font-semibold font-mono text-zinc-100">{evm.transactions.length} Tx</p>
          </div>
        </div>

        <div className="bg-zinc-900/20 border border-zinc-900/80 rounded-2xl p-4 flex items-center space-x-4 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
          <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">On-Chain Credentials</p>
            <p className="text-sm font-semibold font-mono text-zinc-100">{evm.credentialCount} Issued</p>
          </div>
        </div>
      </div>

      {/* Transaction Feed */}
      <div className="lg:col-span-8 bg-zinc-900/20 border border-zinc-900/80 backdrop-blur-md rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] flex flex-col h-[550px]">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-900/50">
          <h3 className="text-sm font-semibold font-display tracking-tight text-zinc-100 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-violet-400" />
            <span>On-Chain Transaction Log</span>
          </h3>
          <button 
            onClick={onRefresh}
            className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
            title="Refresh Node State"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {allTxs.map((tx) => (
            <div 
              key={tx.hash}
              onClick={() => setSelectedTx(selectedTx === tx.hash ? null : tx.hash)}
              className="group p-3.5 bg-zinc-950/40 hover:bg-zinc-950/80 border border-zinc-900/60 rounded-xl cursor-pointer transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-lg border ${getMethodColor(tx.method)}`}>
                    {tx.method}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    Block #{tx.blockNumber}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs font-mono">
                  <span className={tx.status === 'Success' ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                    ● {tx.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2 text-xs font-mono text-zinc-400">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase">From:</span> {formatAddress(tx.from)}
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase">To:</span> {formatAddress(tx.to)}
                </div>
              </div>

              {selectedTx === tx.hash && (
                <div className="mt-3 pt-3.5 border-t border-zinc-900/60 bg-zinc-950/90 rounded-xl p-3.5 font-mono text-[11px] space-y-2 text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Transaction Hash:</span>
                    <span className="text-violet-300">{tx.hash}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Value Transferred:</span>
                    <span>{tx.value} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Gas Consumed:</span>
                    <span className="text-amber-400">{tx.gasUsed.toLocaleString()} gas</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Timestamp:</span>
                    <span>{new Date(tx.timestamp * 1000).toLocaleString()}</span>
                  </div>
                  <div>
                    <p className="text-zinc-500 mb-1">Arguments Passed:</p>
                    <div className="bg-zinc-900 p-2 rounded-xl text-zinc-400 text-[10px] max-h-[80px] overflow-y-auto">
                      {tx.args.length > 0 ? (
                        tx.args.map((arg, idx) => (
                          <div key={idx} className="truncate">
                            [{idx}]: {arg}
                          </div>
                        ))
                      ) : (
                        <span className="italic text-zinc-600">None</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Block List */}
      <div className="lg:col-span-4 bg-zinc-900/20 border border-zinc-900/80 backdrop-blur-md rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] flex flex-col h-[550px]">
        <h3 className="text-sm font-semibold font-display tracking-tight text-zinc-100 mb-4 pb-3 border-b border-zinc-900/50 flex items-center space-x-2">
          <Layers className="w-4 h-4 text-violet-400" />
          <span>Latest Mined Blocks</span>
        </h3>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {allBlocks.map((block) => (
            <div key={block.number} className="p-3.5 bg-zinc-950/40 border border-zinc-900/60 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold font-mono text-violet-400">
                  Block #{block.number}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-600" />
                  <span>{new Date(block.timestamp * 1000).toLocaleTimeString()}</span>
                </span>
              </div>

              <div className="text-[11px] font-mono text-zinc-400 space-y-1">
                <div className="truncate">
                  <span className="text-zinc-500 text-[10px] uppercase">Hash:</span> {block.hash}
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase">Transactions:</span>{' '}
                  <span className="text-emerald-400 font-semibold">{block.transactions.length}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
