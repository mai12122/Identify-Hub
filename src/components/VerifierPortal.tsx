import React, { useState } from 'react';
import { SimulatedEVM } from '../mockBlockchain';
import { Search, ShieldCheck, XCircle, CheckCircle2, Cpu, HelpCircle } from 'lucide-react';

interface VerifierPortalProps {
  evm: SimulatedEVM;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function VerifierPortal({ evm, addToast }: VerifierPortalProps) {
  const [credId, setCredId] = useState('');
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setSearched(false);

    const parsedId = Number(credId.trim());
    if (!credId.trim()) {
      setError('Credential ID is required.');
      return;
    }

    if (isNaN(parsedId) || parsedId <= 0) {
      setError('Please enter a valid positive integer ID.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = evm.verifyCredential(parsedId);
      setResult(res);
      setLoading(false);
      setSearched(true);
      if (res.isValid) {
        addToast(`Credential #${parsedId} successfully validated!`, 'success');
      } else {
        addToast(`Credential #${parsedId} failed on-chain validity checks.`, 'error');
      }
    }, 1200);
  };

  return (
    <div id="verifier-portal" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Search Input Panel */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-zinc-900/20 border border-zinc-900/80 backdrop-blur-md rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
          <h3 className="text-base font-semibold font-display tracking-tight text-zinc-100 mb-4 flex items-center space-x-2.5">
            <Search className="w-5.5 h-5.5 text-violet-400" />
            <span>On-Chain Verification Gate</span>
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed mb-4.5">
            A portal for third-party verifiers (employers, airports, services) to enter any Credential ID and fetch verified cryptographic proof directly from the smart contract ledger.
          </p>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2 font-mono uppercase tracking-wider">
                On-Chain Credential ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={credId}
                  onChange={(e) => setCredId(e.target.value)}
                  placeholder="e.g. 1"
                  className={`w-full pl-3.5 pr-12 py-2.5 bg-zinc-950 border rounded-xl font-mono text-xs text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all ${
                    error ? 'border-rose-500/50 focus:ring-rose-500/10 focus:border-rose-500/70' : 'border-zinc-900 focus:ring-violet-500/10 focus:border-violet-500/50'
                  }`}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-3.5 top-2.5 p-1 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
              {error && (
                <p className="mt-1.5 text-[11px] text-rose-400 font-mono">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-xs font-semibold text-zinc-50 bg-violet-600 hover:bg-violet-500 hover:shadow-[0_0_15px_rgba(139,92,246,0.2)] border border-violet-500/20 rounded-xl transition-all duration-200 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Verifying Proof...' : 'Verify On-Chain Ledger'}</span>
            </button>
          </form>
        </div>

        <div className="bg-zinc-900/20 border border-zinc-900/80 backdrop-blur-md rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
          <h4 className="text-xs font-semibold text-zinc-200 mb-3.5 uppercase tracking-widest font-mono flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-violet-400" />
            <span>Why Is This Secure?</span>
          </h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            By querying the immutable blockchain directly, verifiers get a mathematically secure answer that cannot be forged, manipulated, or simulated by malicious actors. The issuer's signature and revocation status are tracked instantly in real-time.
          </p>
        </div>
      </div>

      {/* Verification Output Screen */}
      <div className="lg:col-span-7 bg-zinc-900/20 border border-zinc-900/80 backdrop-blur-md rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.3)] flex flex-col justify-center min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-12">
            <div className="w-10 h-10 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-zinc-400 font-mono">Querying IdentityRegistry state storage map...</p>
          </div>
        ) : searched && result ? (
          <div className="space-y-6">
            <div className="flex items-center space-x-3.5 pb-4 border-b border-zinc-900/50">
              {result.isValid ? (
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                  <CheckCircle2 className="w-5.5 h-5.5" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(239,68,68,0.05)]">
                  <XCircle className="w-5.5 h-5.5" />
                </div>
              )}
              <div>
                <h4 className="text-sm font-semibold text-zinc-100 font-display tracking-tight">
                  {result.isValid ? 'Ledger Proof Validated' : 'Validation Error / Revoked'}
                </h4>
                <p className="text-[10px] text-zinc-500 font-mono">Result returned in {Date.now() % 10}ms</p>
              </div>
            </div>

            {/* Results details */}
            {result.isValid && result.credential ? (
              <div className="space-y-4">
                <div className="bg-zinc-950/60 border border-zinc-900/80 rounded-xl p-4.5 space-y-3 font-mono text-xs text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Credential Type:</span>
                    <span className="text-zinc-100 font-semibold">{result.credential.credentialType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Credential Subject:</span>
                    <span className="text-zinc-100 truncate max-w-[200px]" title={result.credential.subject}>
                      {result.credential.subject}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Issuer Authority:</span>
                    <span className="text-violet-400 truncate max-w-[200px]" title={result.credential.issuer}>
                      {result.credential.issuer}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Integrity Data Hash:</span>
                    <span className="text-zinc-400 text-[11px] truncate max-w-[180px]" title={result.credential.dataHash}>
                      {result.credential.dataHash}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-950/10 border border-emerald-500/15 rounded-xl text-emerald-400 text-xs shadow-[0_4px_20px_rgba(16,185,129,0.01)] leading-relaxed">
                  <strong>Status Check:</strong> {result.message}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-rose-950/10 border border-rose-500/15 rounded-xl text-rose-400 text-xs shadow-[0_4px_20px_rgba(239,68,68,0.01)] leading-relaxed">
                  <strong>Verification Failure:</strong> {result.message || 'The specified Credential ID is invalid, was never issued, or has been revoked in the blockchain registry.'}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-500">
            <Cpu className="w-12 h-12 mx-auto text-zinc-700 mb-3" />
            <p className="text-sm font-semibold text-zinc-400">Ready for Query</p>
            <p className="text-xs text-zinc-500 mt-1">Enter a Credential ID to perform W3C cryptography checks.</p>
          </div>
        )}
      </div>
    </div>
  );
}
