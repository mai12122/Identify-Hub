import React, { useState } from 'react';
import { Credential, SimulatedWallet } from '../types';
import { SimulatedEVM, SIMULATED_WALLETS } from '../mockBlockchain';
import { Award, ShieldAlert, CheckCircle2, ShieldCheck, XCircle, Trash2, Calendar, User, Eye, RefreshCw, Key, Landmark, Check, Hash, AlertTriangle, HelpCircle } from 'lucide-react';
import Button from './ui/Button';

interface CredentialsVaultProps {
  evm: SimulatedEVM;
  activeAccount: SimulatedWallet;
  onRefresh: () => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function CredentialsVault({ evm, activeAccount, onRefresh, addToast }: CredentialsVaultProps) {
  const [selectedCred, setSelectedCred] = useState<Credential | null>(null);
  const [verificationResult, setVerificationResult] = useState<{ isValid: boolean; message: string } | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Filter credentials
  const [showAll, setShowAll] = useState(true);

  const getWalletName = (addr: string) => {
    const profile = evm.profiles[addr.toLowerCase()];
    if (profile && profile.name) {
      return profile.name;
    }
    const wallet = SIMULATED_WALLETS.find(w => w.address.toLowerCase() === addr.toLowerCase());
    return wallet ? wallet.name : `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getCredentialStyle = (type: string) => {
    const cleanType = type.toLowerCase();
    if (cleanType.includes('computer science') || cleanType.includes('degree') || cleanType.includes('bachelor')) {
      return {
        gradient: 'from-violet-500/10 to-indigo-500/5',
        border: 'border-violet-500/20 hover:border-violet-500/40',
        text: 'text-violet-400',
        iconBg: 'bg-violet-500/10',
        tag: 'Academic'
      };
    }
    if (cleanType.includes('driver') || cleanType.includes('license')) {
      return {
        gradient: 'from-cyan-500/10 to-blue-500/5',
        border: 'border-cyan-500/20 hover:border-cyan-500/40',
        text: 'text-cyan-400',
        iconBg: 'bg-cyan-500/10',
        tag: 'Government'
      };
    }
    if (cleanType.includes('kyc') || cleanType.includes('identity')) {
      return {
        gradient: 'from-emerald-500/10 to-teal-500/5',
        border: 'border-emerald-500/20 hover:border-emerald-500/40',
        text: 'text-emerald-400',
        iconBg: 'bg-emerald-500/10',
        tag: 'Compliance'
      };
    }
    return {
      gradient: 'from-zinc-500/10 to-zinc-800/5',
      border: 'border-zinc-500/20 hover:border-zinc-500/45',
      text: 'text-zinc-400',
      iconBg: 'bg-zinc-500/10',
      tag: 'Professional'
    };
  };

  const getStatusBadge = (cred: Credential) => {
    const now = Math.floor(Date.now() / 1000);
    const expired = cred.expiryDate > 0 && now > cred.expiryDate;

    if (cred.isRevoked) {
      return (
        <span className="flex items-center space-x-1.5 text-rose-400 bg-rose-500/10 border border-rose-500/25 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold">
          <XCircle className="w-3 h-3" />
          <span>Revoked</span>
        </span>
      );
    }
    if (expired) {
      return (
        <span className="flex items-center space-x-1.5 text-amber-500 bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold">
          <AlertTriangle className="w-3 h-3" />
          <span>Expired</span>
        </span>
      );
    }
    return (
      <span className="flex items-center space-x-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold">
        <CheckCircle2 className="w-3 h-3" />
        <span>Verified Active</span>
      </span>
    );
  };

  const handleVerify = (cred: Credential) => {
    setVerifying(true);
    setSelectedCred(cred);
    setVerificationResult(null);

    // Simulate cryptographic signature checks
    setTimeout(() => {
      const res = evm.verifyCredential(cred.id);
      setVerificationResult(res);
      setVerifying(false);
    }, 1200);
  };

  const handleRevoke = (id: number) => {
    try {
      evm.revokeCredential(activeAccount.address, id);
      addToast(`Credential #${id} has been revoked and marked inactive on-chain!`, 'success');
      onRefresh();
    } catch (err: any) {
      addToast(err.message || 'Failed to revoke credential.', 'error');
    }
  };

  // Get credentials
  const allCreds = Object.values(evm.credentials);
  const filteredCreds = showAll 
    ? allCreds 
    : allCreds.filter(c => c.subject.toLowerCase() === activeAccount.address.toLowerCase());

  return (
    <div id="credentials-vault" className="space-y-6 animate-fade-in">
      {/* Vault Filter and Header */}
      <div className="card flex flex-col md:flex-row items-center justify-between gap-4 p-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-violet-500/10 rounded-xl text-violet-400 border border-violet-500/20">
            <Award className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display tracking-tight text-zinc-100">Immutable Credential Repository</h3>
            <p className="text-xs text-zinc-400">Review cryptographic assertions anchored to the blockchain registry</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 bg-zinc-950 p-1 border border-white/5 rounded-xl self-stretch md:self-auto">
          <button
            onClick={() => setShowAll(true)}
            className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
              showAll ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
            }`}
          >
            All Ledger Records
          </button>
          <button
            onClick={() => setShowAll(false)}
            className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
              !showAll ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
            }`}
          >
            My Identity
          </button>
        </div>
      </div>

      {/* Grid of Credentials */}
      {filteredCreds.length === 0 ? (
        <div className="card py-16 text-center text-zinc-500 flex flex-col items-center justify-center border-dashed border-zinc-800">
          <Award className="w-14 h-14 text-zinc-700 mb-4 animate-pulse" />
          <p className="text-sm font-semibold text-zinc-300 font-display">Vault Empty</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-md">No credentials found matching your filter. Access the Issuer Portal to mint and sign some credentials!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCreds.map((cred) => {
            const isAdmin = activeAccount.role === 'Admin';
            const isIssuer = cred.issuer.toLowerCase() === activeAccount.address.toLowerCase();
            const canRevoke = (isIssuer || isAdmin) && !cred.isRevoked;
            const style = getCredentialStyle(cred.credentialType);

            return (
              <div 
                key={cred.id} 
                className={`card bg-gradient-to-br ${style.gradient} ${style.border} flex flex-col justify-between p-5.5 space-y-5`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-violet-400 font-mono uppercase tracking-widest bg-violet-950/40 border border-violet-900/40 px-2 py-0.5 rounded-md">
                        Record #{cred.id}
                      </span>
                      <h4 className="text-sm font-bold text-zinc-100 mt-2 font-display tracking-tight">{cred.credentialType}</h4>
                    </div>
                    {getStatusBadge(cred)}
                  </div>

                  {/* Metadata key value list */}
                  <div className="mt-4.5 space-y-2 text-xs font-mono text-zinc-400 border-t border-b border-white/5 py-4">
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                        <User className="w-3 h-3 text-zinc-500" /> Subject:
                      </span>
                      <span className="text-zinc-200 truncate font-semibold" title={cred.subject}>
                        {getWalletName(cred.subject)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                        <Landmark className="w-3 h-3 text-zinc-500" /> Issuer:
                      </span>
                      <span className="text-zinc-200 truncate font-semibold" title={cred.issuer}>
                        {getWalletName(cred.issuer)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                        <Hash className="w-3 h-3 text-zinc-500" /> Hash proof:
                      </span>
                      <span className="text-zinc-400 text-[11px] truncate max-w-[170px]" title={cred.dataHash}>
                        {cred.dataHash}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-zinc-500" /> Issued on:
                      </span>
                      <span className="text-zinc-200 font-semibold">{new Date(cred.issueDate * 1000).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-zinc-500" /> Expiration:
                      </span>
                      <span className="text-zinc-200 font-semibold">
                        {cred.expiryDate === 0 ? 'Infinite / Lifetime' : new Date(cred.expiryDate * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1.5">
                  <Button onClick={() => handleVerify(cred)} size="md" className="flex-1">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Cryptographic Audit</span>
                  </Button>

                  {canRevoke && (
                    <button
                      onClick={() => handleRevoke(cred.id)}
                      className="p-2.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl transition-all duration-200 cursor-pointer shrink-0"
                      title="Revoke Credential"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Verification Detailed Modal Overlay */}
      {selectedCred && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="card max-w-lg w-full overflow-hidden border border-violet-500/30 p-0 shadow-[0_20px_50px_rgba(124,58,237,0.15)]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4.5 bg-zinc-950/70 border-b border-white/5">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-violet-400 animate-pulse" />
                <span className="text-sm font-bold text-zinc-100 font-display tracking-wide uppercase">Ledger Audit Inspector</span>
              </div>
              <button 
                onClick={() => setSelectedCred(null)} 
                className="text-zinc-500 hover:text-zinc-300 font-bold font-mono cursor-pointer transition-colors p-1"
              >
                ✕
              </button>
            </div>

            {/* Verification Content */}
            <div className="p-6 space-y-5">
              <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 space-y-2.5 font-mono text-[11px] text-zinc-400">
                <div className="flex justify-between">
                  <span>Audit Target:</span>
                  <span className="text-zinc-100 font-bold">Credential Registry Map #{selectedCred.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Solidity Method:</span>
                  <span className="text-violet-400">verifyCredential(uint256)</span>
                </div>
                <div className="flex justify-between">
                  <span>Audit Engine Cost:</span>
                  <span className="text-amber-500">22,342 Gas (Read-Only Call)</span>
                </div>
              </div>

              {verifying ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <div className="w-9 h-9 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-zinc-400 font-mono">Running signature validation & verifying revocation bits...</p>
                </div>
              ) : (
                verificationResult && (
                  <div className="space-y-5">
                    {verificationResult.isValid ? (
                      <div className="flex items-start space-x-3.5 bg-emerald-500/5 border border-emerald-500/20 p-4.5 rounded-xl text-emerald-400">
                        <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5 text-emerald-400" />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider font-mono">Cryptographic Consensus Passed</p>
                          <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                            {verificationResult.message}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start space-x-3.5 bg-rose-500/5 border border-rose-500/20 p-4.5 rounded-xl text-rose-400">
                        <XCircle className="w-6 h-6 shrink-0 mt-0.5 text-rose-400" />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider font-mono">Audit Exception Triggered</p>
                          <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                            {verificationResult.message}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Mathematical Cryptographic Verification Step Breakdown */}
                    <div className="space-y-2.5">
                      <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Ledger Checklist</h4>
                      <div className="space-y-2 text-[11px] font-mono">
                        <div className="flex justify-between items-center p-3 bg-zinc-950/40 rounded-xl border border-white/5">
                          <span className="text-zinc-400">1. Certified Issuer Signature Check</span>
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Checked
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-zinc-950/40 rounded-xl border border-white/5">
                          <span className="text-zinc-400">2. Smart Contract Revocation Bit</span>
                          <span className={selectedCred.isRevoked ? "text-rose-400 font-semibold" : "text-emerald-400 font-semibold flex items-center gap-1"}>
                            {selectedCred.isRevoked ? "Revoked" : <><Check className="w-3.5 h-3.5" /> Unrevoked</>}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-zinc-950/40 rounded-xl border border-white/5">
                          <span className="text-zinc-400">3. Temporal Expiry Math</span>
                          <span className={verificationResult.isValid ? "text-emerald-400 font-semibold flex items-center gap-1" : "text-rose-400 font-semibold"}>
                            {verificationResult.isValid ? <><Check className="w-3.5 h-3.5" /> Active</> : "Expired"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4.5 bg-zinc-950 border-t border-white/5 flex justify-end">
              <Button onClick={() => setSelectedCred(null)} size="md">
                Dismiss Audit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
