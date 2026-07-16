import React, { useState } from 'react';
import { SimulatedEVM } from '../mockBlockchain';
import { Cpu, Layers, Database, Activity, RefreshCw, Clock, ChevronDown, ChevronUp, Link, ShieldCheck, HelpCircle } from 'lucide-react';

interface BlockchainExplorerProps {
  evm: SimulatedEVM;
  onRefresh: () => void;
}

export default function BlockchainExplorer({ evm, onRefresh }: BlockchainExplorerProps) {
  const [selectedTx, setSelectedTx] = useState<string | null>(null);

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    if (addr.startsWith('0xIdentity')) return 'IdentityRegistry';
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'createOrUpdateProfile': return 'text-sky-400 bg-sky-500/10 border-sky-400/20';
      case 'issueCredential': return 'text-emerald-400 bg-emerald-500/10 border-emerald-400/20';
      case 'revokeCredential': return 'text-rose-400 bg-rose-500/10 border-rose-400/20';
      case 'authorizeIssuer': return 'text-violet-400 bg-violet-500/10 border-violet-400/20';
      default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-400/20';
    }
  };

  const allTxs = [...evm.transactions].reverse();
  const allBlocks = [...evm.blocks].reverse();

  return (
    <div id="blockchain-explorer" className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      {/* Node Stats Dashboard */}
      <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Operator */}
        <div className="card p-4.5 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Consensus Operator</p>
            <p className="text-sm font-bold font-mono text-zinc-100 mt-0.5">Sandbox Node</p>
          </div>
        </div>

        {/* Height */}
        <div className="card p-4.5 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Block Height</p>
            <p className="text-sm font-bold font-mono text-zinc-100 mt-0.5">#{evm.currentBlockNumber}</p>
          </div>
        </div>

        {/* Tx Count */}
        <div className="card p-4.5 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Total Transactions</p>
            <p className="text-sm font-bold font-mono text-zinc-100 mt-0.5">{evm.transactions.length} Tx</p>
          </div>
        </div>

        {/* Credentials Issued */}
        <div className="card p-4.5 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">On-Chain Credentials</p>
            <p className="text-sm font-bold font-mono text-zinc-100 mt-0.5">{evm.credentialCount} Records</p>
          </div>
        </div>
      </div>

      {/* Transaction Feed */}
      <div className="lg:col-span-8 card p-5.5 flex flex-col h-[550px] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center space-x-2.5">
            <Activity className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-bold font-display tracking-tight text-zinc-100">
              Live Transaction Stream
            </h3>
          </div>
          <button 
            onClick={onRefresh}
            className="p-2 rounded-xl bg-white/3 hover:bg-white/8 border border-white/5 text-zinc-400 hover:text-white transition-all cursor-pointer"
            title="Force Node Update"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {allTxs.map((tx) => {
            const isExpanded = selectedTx === tx.hash;
            return (
              <div 
                key={tx.hash}
                onClick={() => setSelectedTx(isExpanded ? null : tx.hash)}
                className="p-4 bg-white/2 hover:bg-white/4 border border-white/5 hover:border-violet-500/15 rounded-2xl cursor-pointer transition-all duration-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold tracking-wide ${getMethodColor(tx.method)}`}>
                      {tx.method}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Block #{tx.blockNumber}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs font-mono">
                    <span className={tx.status === 'Success' ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                      ● {tx.status}
                    </span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[11px] font-mono text-zinc-400">
                  <div className="truncate">
                    <span className="text-zinc-500 uppercase text-[9px] tracking-wider block mb-0.5">Sender Address</span> 
                    <span className="text-zinc-200">{formatAddress(tx.from)}</span>
                  </div>
                  <div className="truncate">
                    <span className="text-zinc-500 uppercase text-[9px] tracking-wider block mb-0.5">Target Address</span> 
                    <span className="text-zinc-200">{formatAddress(tx.to)}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="pt-4 mt-1.5 border-t border-white/5 space-y-2.5 font-mono text-[11px] text-zinc-300 bg-zinc-950/40 p-3.5 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">Hash Checksum:</span>
                      <span className="text-violet-300 font-semibold select-all truncate max-w-[200px]" title={tx.hash}>{tx.hash}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">Value:</span>
                      <span>{tx.value} ETH</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">Gas Expended:</span>
                      <span className="text-amber-400 font-semibold">{tx.gasUsed.toLocaleString()} gas</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">Block Timestamp:</span>
                      <span>{new Date(tx.timestamp * 1000).toLocaleString()}</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-zinc-500">Decoded Method Parameters:</p>
                      <div className="bg-zinc-950 p-2.5 rounded-lg text-zinc-400 text-[10px] max-h-[100px] overflow-y-auto space-y-1.5 border border-white/5">
                        {tx.args.length > 0 ? (
                          tx.args.map((arg, idx) => (
                            <div key={idx} className="truncate">
                              <span className="text-violet-400">[{idx}]:</span> {arg}
                            </div>
                          ))
                        ) : (
                          <span className="italic text-zinc-600">No arguments encoded</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Block List */}
      <div className="lg:col-span-4 card p-5.5 flex flex-col h-[550px] space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-white/5">
          <Layers className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-bold font-display tracking-tight text-zinc-100">
            Mined Ledger Timeline
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {allBlocks.map((block, idx) => (
            <div key={block.number} className="relative flex space-x-3.5 group">
              {/* Linked line connectors */}
              {idx < allBlocks.length - 1 && (
                <div className="absolute top-9 left-4 bottom-[-22px] w-[2px] bg-gradient-to-b from-violet-500/40 to-transparent pointer-events-none"></div>
              )}

              {/* Bullet circle */}
              <div className="w-8.5 h-8.5 rounded-full bg-violet-950/40 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0 mt-0.5 group-hover:border-violet-500/60 transition-colors">
                <Link className="w-3.5 h-3.5" />
              </div>

              <div className="flex-1 p-3.5 bg-white/2 rounded-2xl border border-white/5 space-y-2 group-hover:border-violet-500/10 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-violet-400">
                    Block #{block.number}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-600" />
                    <span>{new Date(block.timestamp * 1000).toLocaleTimeString()}</span>
                  </span>
                </div>

                <div className="text-[11px] font-mono text-zinc-400 space-y-1">
                  <div className="truncate">
                    <span className="text-zinc-500 text-[10px] uppercase">State Root Hash:</span> <span className="text-zinc-300">{block.hash}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] uppercase">Transactions Included:</span>{' '}
                    <span className="text-cyan-400 font-bold">{block.transactions.length}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
