import React, { useState } from 'react';
import { Credential, SimulatedWallet } from '../types';
import { SimulatedEVM, SIMULATED_WALLETS } from '../mockBlockchain';
import { Award, ShieldAlert, CheckCircle2, ShieldCheck, XCircle, Trash2, Calendar, User, Eye, RefreshCw } from 'lucide-react';

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

  // Filter credentials to either show everything (Sandbox style) or filter by active subject address
  const [showAll, setShowAll] = useState(true);

  const getWalletName = (addr: string) => {
    const wallet = SIMULATED_WALLETS.find(w => w.address.toLowerCase() === addr.toLowerCase());
    return wallet ? wallet.name : `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getStatusBadge = (cred: Credential) => {
    const now = Math.floor(Date.now() / 1000);
    const expired = cred.expiryDate > 0 && now > cred.expiryDate;

    if (cred.isRevoked) {
      return (
        <span className="flex items-center space-x-1 text-rose-400 bg-rose-950/40 border border-rose-900/50 px-2.5 py-0.5 rounded-full text-[10px] font-mono">
          <XCircle className="w-3 h-3" />
          <span>Revoked</span>
        </span>
      );
    }
    if (expired) {
      return (
        <span className="flex items-center space-x-1 text-amber-500 bg-amber-950/40 border border-amber-900/50 px-2.5 py-0.5 rounded-full text-[10px] font-mono">
          <ShieldAlert className="w-3 h-3" />
          <span>Expired</span>
        </span>
      );
    }
    return (
      <span className="flex items-center space-x-1 text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2.5 py-0.5 rounded-full text-[10px] font-mono">
        <CheckCircle2 className="w-3 h-3" />
        <span>Active & Verified</span>
      </span>
    );
  };

  const handleVerify = (cred: Credential) => {
    setVerifying(true);
    setSelectedCred(cred);
    setVerificationResult(null);

    // Simulate cryptographic signature checks & on-chain state inspection
    setTimeout(() => {
      const res = evm.verifyCredential(cred.id);
      setVerificationResult(res);
      setVerifying(false);
    }, 1000);
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
    <div id="credentials-vault" className="space-y-6">
      {/* Vault Filter and Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/20 border border-zinc-900/80 backdrop-blur-md rounded-2xl p-4.5 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
        <div>
          <h3 className="text-sm font-semibold font-display tracking-tight text-zinc-100">On-Chain Credential Vault</h3>
          <p className="text-xs text-zinc-400">Manage, inspect, and mathematically verify credentials stored in the IdentityRegistry contract.</p>
        </div>
        <div className="flex items-center space-x-2 bg-zinc-950 p-1 border border-zinc-900 rounded-xl">
          <button
            onClick={() => setShowAll(true)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
              showAll ? 'bg-violet-500/10 text-violet-400 border border-violet-500/25' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
            }`}
          >
            All Ledger Credentials
          </button>
          <button
            onClick={() => setShowAll(false)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
              !showAll ? 'bg-violet-500/10 text-violet-400 border border-violet-500/25' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
            }`}
          >
            My Wallet Credentials
          </button>
        </div>
      </div>

      {/* Grid of Credentials */}
      {filteredCreds.length === 0 ? (
        <div className="bg-zinc-900/20 border border-zinc-900/80 rounded-2xl p-12 text-center text-zinc-500 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
          <Award className="w-12 h-12 mx-auto text-zinc-700 mb-3" />
          <p className="text-sm font-semibold text-zinc-400">No Credentials Found</p>
          <p className="text-xs text-zinc-500 mt-1">Issue a credential through the Issuer Portal to populate this list.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCreds.map((cred) => {
            const isAdmin = activeAccount.role === 'Admin';
            const isIssuer = cred.issuer.toLowerCase() === activeAccount.address.toLowerCase();
            const canRevoke = (isIssuer || isAdmin) && !cred.isRevoked;

            return (
              <div 
                key={cred.id} 
                className="bg-zinc-900/20 border border-zinc-900/80 hover:border-zinc-800/80 backdrop-blur-md rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] flex flex-col justify-between space-y-4.5 transition-all duration-200"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest font-mono">
                        Credential #{cred.id}
                      </span>
                      <h4 className="text-sm font-semibold text-zinc-100 mt-1 font-display tracking-tight">{cred.credentialType}</h4>
                    </div>
                    {getStatusBadge(cred)}
                  </div>

                  <div className="mt-4 space-y-2.5 text-xs font-mono text-zinc-400 border-t border-b border-zinc-900/40 py-3.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Subject:</span>
                      <span className="text-zinc-300 truncate max-w-[180px] font-medium" title={cred.subject}>
                        {getWalletName(cred.subject)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Issuer:</span>
                      <span className="text-zinc-300 truncate max-w-[180px] font-medium" title={cred.issuer}>
                        {getWalletName(cred.issuer)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Data Hash:</span>
                      <span className="text-zinc-300 text-[11px] truncate max-w-[150px]" title={cred.dataHash}>
                        {cred.dataHash}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Issued:</span>
                      <span className="text-zinc-300 font-medium">{new Date(cred.issueDate * 1000).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Expiry:</span>
                      <span className="text-zinc-300 font-medium">
                        {cred.expiryDate === 0 ? 'Indefinite' : new Date(cred.expiryDate * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    onClick={() => handleVerify(cred)}
                    className="flex-1 flex items-center justify-center space-x-1.5 px-4 py-2.5 text-xs font-semibold text-zinc-50 bg-violet-600 hover:bg-violet-500 hover:shadow-[0_0_15px_rgba(139,92,246,0.2)] border border-violet-500/20 rounded-xl transition-all duration-200 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify On-Chain</span>
                  </button>

                  {canRevoke && (
                    <button
                      onClick={() => handleRevoke(cred.id)}
                      className="p-2.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 border border-rose-900/30 rounded-xl transition-all duration-200 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4">
          <div className="bg-[#0B0D13] border border-zinc-900/95 rounded-2xl max-w-lg w-full overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)] animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-5.5 py-4.5 bg-zinc-950/60 border-b border-zinc-900/50">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-violet-400 animate-pulse" />
                <span className="text-sm font-semibold text-zinc-200 font-display tracking-tight">On-Chain Verification Engine</span>
              </div>
              <button 
                onClick={() => setSelectedCred(null)} 
                className="text-zinc-500 hover:text-zinc-300 text-sm font-semibold font-mono cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Verification progress / content */}
            <div className="p-5 space-y-4">
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900/80 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Query Target:</span>
                  <span className="text-zinc-300 font-semibold">Credential #{selectedCred.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Verifying Method:</span>
                  <span className="text-violet-400">verifyCredential(uint256)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">EVM Call Cost:</span>
                  <span className="text-amber-500">22,342 Gas (Static Call)</span>
                </div>
              </div>

              {verifying ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-zinc-400 font-mono text-center">Running signature checks & validating non-revocation state...</p>
                </div>
              ) : (
                verificationResult && (
                  <div className="space-y-4">
                    {verificationResult.isValid ? (
                      <div className="flex items-start space-x-3 bg-emerald-950/10 border border-emerald-500/15 p-4 rounded-xl text-emerald-400 shadow-[0_4px_20px_rgba(16,185,129,0.02)]">
                        <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider font-mono">Verification Succeeded</p>
                          <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                            {verificationResult.message}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start space-x-3 bg-rose-950/10 border border-rose-500/15 p-4 rounded-xl text-rose-400 shadow-[0_4px_20px_rgba(239,68,68,0.02)]">
                        <XCircle className="w-6 h-6 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider font-mono">Verification Failed</p>
                          <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                            {verificationResult.message}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Mathematical Cryptographic Verification Step Breakdown */}
                    <div className="space-y-2.5">
                      <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Cryptographic Proof List</h4>
                      <div className="space-y-1.5 text-[11px] font-mono">
                        <div className="flex justify-between items-center p-2.5 bg-zinc-950/40 rounded-xl border border-zinc-900/60">
                          <span className="text-zinc-400">1. Issuer Accreditation Proof</span>
                          <span className="text-emerald-400 font-medium">Verified ✓</span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 bg-zinc-950/40 rounded-xl border border-zinc-900/60">
                          <span className="text-zinc-400">2. Revocation Ledger Hash Check</span>
                          <span className={selectedCred.isRevoked ? "text-rose-400 font-medium" : "text-emerald-400 font-medium"}>
                            {selectedCred.isRevoked ? "Revoked ✕" : "Unrevoked ✓"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 bg-zinc-950/40 rounded-xl border border-zinc-900/60">
                          <span className="text-zinc-400">3. Non-Expiration Check</span>
                          <span className={verificationResult.isValid ? "text-emerald-400 font-medium" : "text-rose-400 font-medium"}>
                            {verificationResult.isValid ? "Valid ✓" : "Expired ✕"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Footer button */}
            <div className="px-5.5 py-4.5 bg-zinc-950 border-t border-zinc-900/50 flex justify-end">
              <button
                onClick={() => setSelectedCred(null)}
                className="px-4.5 py-2 text-xs font-semibold text-zinc-50 bg-violet-600 hover:bg-violet-500 hover:shadow-[0_0_15px_rgba(139,92,246,0.2)] border border-violet-500/20 rounded-xl transition-all duration-200 cursor-pointer"
              >
                Close Engine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
