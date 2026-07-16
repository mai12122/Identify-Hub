import React, { useState } from 'react';
import { SimulatedEVM } from '../mockBlockchain';
import { Search, ShieldCheck, XCircle, CheckCircle2, Cpu, HelpCircle, AlertCircle, RefreshCw, Hash, Landmark, User, FileText } from 'lucide-react';
import Button from './ui/Button';

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

  const getWalletName = (addr: string) => {
    const profile = evm.profiles[addr.toLowerCase()];
    if (profile && profile.name) {
      return profile.name;
    }
    if (addr.toLowerCase() === '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266') return 'Admin (Platform)';
    if (addr.toLowerCase() === '0x70997970c51812dc3a010c7d01b50e0d17dc79c8') return 'CamTech University (Issuer)';
    if (addr.toLowerCase() === '0x3c44cdddb5a6900fa2b585dd299e03d12fa4293bc') return 'Ministry of Transportation';
    if (addr.toLowerCase() === '0x90f79bf6eb2c4f870365e785982e1f101e93b906') return 'Alice (User)';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleVerifyId = (idString: string) => {
    setError('');
    setResult(null);
    setSearched(false);

    const parsedId = Number(idString.trim());
    if (!idString.trim()) {
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
    }, 1100);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerifyId(credId);
  };

  // Extract valid ids to help the user test easily
  const activeIds = Object.keys(evm.credentials);

  return (
    <div id="verifier-portal" className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      {/* Search Input Panel */}
      <div className="lg:col-span-5 space-y-6">
        <div className="card p-6 space-y-5">
          <div className="flex items-center space-x-3 pb-3 border-b border-white/5">
            <div className="p-2 bg-violet-500/10 rounded-xl text-violet-400 border border-violet-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display tracking-tight text-zinc-100">
                Verification Gateway
              </h3>
              <p className="text-xs text-zinc-400">Perform signature audits directly from the public registry</p>
            </div>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Third-party entities (employers, institutions, compliance agents) can input any record ID to fetch real-time, tamper-proof state hashes.
          </p>

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 font-mono uppercase tracking-wider">
                Credential Index ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={credId}
                  onChange={(e) => setCredId(e.target.value)}
                  placeholder="e.g. 1"
                  className={`w-full pl-4 pr-12 py-3 bg-zinc-950 border font-mono text-xs text-zinc-100 placeholder-zinc-700 rounded-xl focus:outline-none transition-all ${
                    error ? 'border-rose-500/50' : 'border-white/5'
                  }`}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-3.5 top-3 p-1 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
              {error && (
                <p className="text-[10px] text-rose-400 font-mono flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{error}</span>
                </p>
              )}
            </div>

            {/* Test Helper suggestions */}
            {activeIds.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Available Records on Ledger</p>
                <div className="flex flex-wrap gap-1.5">
                  {activeIds.map(id => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setCredId(id);
                        handleVerifyId(id);
                      }}
                      className="px-2.5 py-1 rounded-md bg-white/4 hover:bg-violet-500/10 border border-white/5 text-[10px] font-mono text-zinc-400 hover:text-violet-300 transition-all cursor-pointer"
                    >
                      Record #{id}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" disabled={loading} size="md" className="w-full">
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Authenticating Ledger...' : 'Audit Credential'}</span>
            </Button>
          </form>
        </div>

        {/* Informational guide */}
        <div className="card p-5 space-y-3">
          <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-violet-400" />
            <span>Zero-Trust Consensus</span>
          </h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            No API keys, databases, or central intermediates are queried. The response is calculated inside the EVM sandbox using standard cryptographic validation, confirming both publisher status and revocation maps instantly.
          </p>
        </div>
      </div>

      {/* Verification Output Screen */}
      <div className="lg:col-span-7 card p-6 flex flex-col justify-center min-h-[350px] relative overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <div className="relative">
              <div className="w-12 h-12 border-2 border-violet-500/20 border-t-violet-400 rounded-full animate-spin"></div>
              {/* Scan effect lines */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-violet-400 animate-pulse"></div>
            </div>
            <p className="text-xs text-zinc-400 font-mono text-center">Querying contract storage arrays...</p>
          </div>
        ) : searched && result ? (
          <div className="space-y-6">
            <div className="flex items-center space-x-3.5 pb-4 border-b border-white/5">
              {result.isValid ? (
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-11 h-11 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                  <XCircle className="w-6 h-6" />
                </div>
              )}
              <div>
                <h4 className="text-sm font-bold text-zinc-100 font-display tracking-tight">
                  {result.isValid ? 'Ledger Proof Authenticated' : 'Validation Error / Revoked'}
                </h4>
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mt-0.5">Proof status finalized</p>
              </div>
            </div>

            {/* Results details */}
            {result.isValid && result.credential ? (
              <div className="space-y-4">
                <div className="bg-zinc-950/60 border border-white/5 rounded-xl p-4 space-y-2.5 font-mono text-xs text-zinc-400">
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-zinc-500 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Type:
                    </span>
                    <span className="text-zinc-100 font-bold">{result.credential.credentialType}</span>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-zinc-500 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Subject Address:
                    </span>
                    <span className="text-zinc-100 truncate max-w-[200px]" title={result.credential.subject}>
                      {getWalletName(result.credential.subject)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Landmark className="w-3.5 h-3.5" /> Issuing Authority:
                    </span>
                    <span className="text-violet-400 truncate max-w-[200px]" title={result.credential.issuer}>
                      {getWalletName(result.credential.issuer)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5" /> Integrity Hash:
                    </span>
                    <span className="text-zinc-300 text-[11px] truncate max-w-[170px]" title={result.credential.dataHash}>
                      {result.credential.dataHash}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl text-emerald-400 text-xs shadow-[0_4px_20px_rgba(16,185,129,0.01)] leading-relaxed font-sans">
                  <strong>Verification Statement:</strong> {result.message}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-rose-500/5 border border-rose-500/15 rounded-xl text-rose-400 text-xs shadow-[0_4px_20px_rgba(239,68,68,0.01)] leading-relaxed">
                  <strong>Verification Statement:</strong> {result.message || 'The specified Credential ID is invalid, was never issued, or has been revoked in the blockchain registry.'}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-500 flex flex-col items-center justify-center">
            <Cpu className="w-14 h-14 text-zinc-800 mb-4 animate-pulse" />
            <p className="text-sm font-semibold text-zinc-400 font-display">Scan Terminal Ready</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">Enter an active record ID or click one of the suggested chips above to run direct validation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
