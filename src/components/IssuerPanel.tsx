import React, { useState } from 'react';
import { SimulatedWallet } from '../types';
import { SimulatedEVM, SIMULATED_WALLETS } from '../mockBlockchain';
import { ShieldAlert, CheckCircle, Key, FilePlus, UserCheck, Trash2, Calendar, User, Hash, HelpCircle, Plus } from 'lucide-react';

interface IssuerPanelProps {
  evm: SimulatedEVM;
  activeAccount: SimulatedWallet;
  onRefresh: () => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function IssuerPanel({ evm, activeAccount, onRefresh, addToast }: IssuerPanelProps) {
  const isAuthorized = evm.authorizedIssuers[activeAccount.address.toLowerCase()] || activeAccount.role === 'Admin';
  const isAdmin = activeAccount.role === 'Admin';

  // Issue Credential Form
  const [subject, setSubject] = useState(SIMULATED_WALLETS[3].address); // default to Alice
  const [credentialType, setCredentialType] = useState('Bachelor of Computer Science');
  const [expiryDays, setExpiryDays] = useState('365');
  const [customHash, setCustomHash] = useState('');
  
  // Authorize Issuer Form
  const [newIssuer, setNewIssuer] = useState('');

  // Validation States
  const [issueErrors, setIssueErrors] = useState<Record<string, string>>({});
  const [authErrors, setAuthErrors] = useState('');

  const generateDataHash = () => {
    // Generate a random-looking hash for credential data matching SHA-256 pattern
    const randomHex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setCustomHash('0x' + randomHex);
  };

  const handleIssueCredential = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!subject.trim()) {
      errors.subject = 'Subject address is required.';
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(subject.trim())) {
      errors.subject = 'Subject must be a valid 40-character Ethereum address starting with 0x.';
    }

    if (!credentialType.trim()) {
      errors.credentialType = 'Credential Type is required.';
    }

    if (expiryDays.trim() !== '0' && isNaN(Number(expiryDays)) || Number(expiryDays) < 0) {
      errors.expiryDays = 'Expiry Days must be a positive integer, or 0 for infinite validity.';
    }

    const finalHash = customHash.trim() || '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    setIssueErrors(errors);

    if (Object.keys(errors).length > 0) {
      addToast('Please correct validation errors.', 'error');
      return;
    }

    try {
      const now = Math.floor(Date.now() / 1000);
      const days = Number(expiryDays);
      const expiryTimestamp = days === 0 ? 0 : now + (days * 86400);

      const { id } = evm.issueCredential(
        activeAccount.address,
        subject.trim(),
        credentialType.trim(),
        finalHash,
        expiryTimestamp
      );

      addToast(`Credential #${id} successfully issued and recorded on-chain!`, 'success');
      setCustomHash('');
      onRefresh();
    } catch (err: any) {
      addToast(err.message || 'Failed to issue credential.', 'error');
    }
  };

  const handleAuthorizeIssuer = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrors('');

    if (!newIssuer.trim()) {
      setAuthErrors('Issuer address is required.');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(newIssuer.trim())) {
      setAuthErrors('Must be a valid Ethereum address.');
      return;
    }

    try {
      evm.authorizeIssuer(activeAccount.address, newIssuer.trim(), true);
      addToast(`Address successfully accredited as an authorized Issuer!`, 'success');
      setNewIssuer('');
      onRefresh();
    } catch (err: any) {
      addToast(err.message || 'Authorization failed.', 'error');
    }
  };

  const handleRevokeIssuer = (addr: string) => {
    try {
      evm.authorizeIssuer(activeAccount.address, addr, false);
      addToast(`Address de-accredited as an authorized Issuer on-chain.`, 'info');
      onRefresh();
    } catch (err: any) {
      addToast(err.message || 'Revocation failed.', 'error');
    }
  };

  return (
    <div id="issuer-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Authorization Banner */}
      <div className="lg:col-span-12">
        {isAuthorized ? (
          <div className="bg-emerald-950/10 border border-emerald-500/15 rounded-2xl p-4.5 flex items-center space-x-3 text-emerald-400 shadow-[0_4px_25px_rgba(16,185,129,0.02)]">
            <CheckCircle className="w-5.5 h-5.5 shrink-0" />
            <div className="text-xs leading-relaxed">
              <span className="font-semibold">Issuer Status Active:</span> You are an accredited identity authority. You can record cryptographically signed credentials on-chain.
            </div>
          </div>
        ) : (
          <div className="bg-amber-950/10 border border-amber-500/15 rounded-2xl p-4.5 flex items-center space-x-3 text-amber-500 shadow-[0_4px_25px_rgba(245,158,11,0.02)]">
            <ShieldAlert className="w-5.5 h-5.5 shrink-0" />
            <div className="text-xs leading-relaxed">
              <span className="font-semibold">Unauthorized Issuer:</span> Your active account is not accredited. To issue a credential, select an Authorized Issuer role (like <strong>CamTech University</strong>) from the active wallets dropdown above.
            </div>
          </div>
        )}
      </div>

      {/* Main Issue Form */}
      <div className="lg:col-span-8 bg-zinc-900/20 border border-zinc-900/80 backdrop-blur-md rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
        <h3 className="text-base font-semibold font-display tracking-tight text-zinc-100 mb-6 flex items-center space-x-2.5">
          <FilePlus className="w-5.5 h-5.5 text-emerald-400" />
          <span>Issue On-Chain Verifiable Credential</span>
        </h3>

        <form onSubmit={handleIssueCredential} className="space-y-4.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subject Address */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                <span>Subject Wallet Address (Recipient)</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="0x90F7..."
                className={`w-full px-3.5 py-2.5 bg-zinc-950 border rounded-xl font-mono text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all ${
                  issueErrors.subject ? 'border-rose-500/50 focus:ring-rose-500/10 focus:border-rose-500/70' : 'border-zinc-900 focus:ring-emerald-500/10 focus:border-emerald-500/50'
                }`}
                disabled={!isAuthorized}
              />
              {issueErrors.subject && (
                <p className="mt-1.5 text-[11px] text-rose-400 font-mono flex items-center space-x-1.5">
                  <ShieldAlert className="w-3 h-3" />
                  <span>{issueErrors.subject}</span>
                </p>
              )}
            </div>

            {/* Credential Type */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2 flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-zinc-400" />
                <span>Credential Type</span>
              </label>
              <select
                value={credentialType}
                onChange={(e) => setCredentialType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-900 rounded-xl text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all cursor-pointer"
                disabled={!isAuthorized}
              >
                <option value="Bachelor of Computer Science">Bachelor of Computer Science (Degree)</option>
                <option value="Digital Driver License (Class A)">Digital Driver License (Class A)</option>
                <option value="Certified Blockchain Professional">Certified Blockchain Professional</option>
                <option value="KYC Identity Pass Level 2">KYC Identity Pass Level 2</option>
                <option value="Senior Software Engineer Employment Pass">Senior Software Engineer Employment Pass</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Expiry Days */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>Valid Duration (Days)</span>
              </label>
              <input
                type="text"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                placeholder="365 (0 for lifetime)"
                className={`w-full px-3.5 py-2.5 bg-zinc-950 border rounded-xl text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all ${
                  issueErrors.expiryDays ? 'border-rose-500/50 focus:ring-rose-500/10 focus:border-rose-500/70' : 'border-zinc-900 focus:ring-emerald-500/10 focus:border-emerald-500/50'
                }`}
                disabled={!isAuthorized}
              />
              {issueErrors.expiryDays && (
                <p className="mt-1.5 text-[11px] text-rose-400 font-mono flex items-center space-x-1.5">
                  <ShieldAlert className="w-3 h-3" />
                  <span>{issueErrors.expiryDays}</span>
                </p>
              )}
            </div>

            {/* Cryptographic Hash */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2 flex items-center justify-between w-full">
                <div className="flex items-center space-x-1.5">
                  <Hash className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Credential Data Hash</span>
                </div>
                {isAuthorized && (
                  <button
                    type="button"
                    onClick={generateDataHash}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer transition-colors"
                  >
                    Auto-Generate
                  </button>
                )}
              </label>
              <input
                type="text"
                value={customHash}
                onChange={(e) => setCustomHash(e.target.value)}
                placeholder="0x8f7c9e0d1b3a5f4e..."
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-900 rounded-xl font-mono text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all"
                disabled={!isAuthorized}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-900/50 flex justify-end">
            <button
              type="submit"
              disabled={!isAuthorized}
              className="flex items-center space-x-1.5 px-5 py-2.5 text-xs font-semibold text-zinc-50 bg-emerald-600 hover:bg-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] border border-emerald-500/20 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>Issue Verifiable Credential</span>
            </button>
          </div>
        </form>
      </div>

      {/* Admin / Issuer Management Console */}
      <div className="lg:col-span-4 bg-zinc-900/20 border border-zinc-900/80 backdrop-blur-md rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold font-display tracking-tight text-zinc-200 mb-4 flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-violet-400" />
            <span>On-Chain Accreditation</span>
          </h3>

          <p className="text-xs text-zinc-400 leading-relaxed mb-4.5">
            Authorized issuers can issue credentials on-chain. Admin can add/revoke issuer credentials anytime using smart contract methods.
          </p>

          {/* Active Authorized Issuers List */}
          <div className="space-y-2 mb-4.5">
            <h4 className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Accredited Authorities</h4>
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
              {SIMULATED_WALLETS.filter(w => evm.authorizedIssuers[w.address.toLowerCase()] || w.role === 'Admin').map(w => (
                <div key={w.address} className="flex items-center justify-between p-2.5 bg-zinc-950/40 rounded-xl border border-zinc-900/80">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-zinc-300 truncate">{w.name}</p>
                    <p className="text-[9px] text-zinc-500 font-mono truncate">{w.address}</p>
                  </div>
                  {isAdmin && w.role !== 'Admin' && (
                    <button
                      onClick={() => handleRevokeIssuer(w.address)}
                      className="p-1 rounded-lg text-rose-400 hover:bg-rose-950/30 transition-all ml-2 cursor-pointer"
                      title="Revoke Issuer Accreditation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Authorize New Issuer Form */}
        {isAdmin ? (
          <form onSubmit={handleAuthorizeIssuer} className="pt-4 border-t border-zinc-900/50">
            <label className="block text-[9px] font-semibold text-zinc-500 uppercase tracking-widest mb-2 font-mono">
              Accredit New Issuer Address
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newIssuer}
                onChange={(e) => setNewIssuer(e.target.value)}
                placeholder="0xAddress..."
                className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-900 rounded-xl text-xs font-mono text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500/50 transition-all"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-zinc-50 bg-violet-600 hover:bg-violet-500 hover:shadow-[0_0_15px_rgba(139,92,246,0.2)] border border-violet-500/20 rounded-xl transition-all duration-200 cursor-pointer flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Accredit</span>
              </button>
            </div>
            {authErrors && (
              <p className="mt-1.5 text-[11px] text-rose-400 font-mono">{authErrors}</p>
            )}
          </form>
        ) : (
          <div className="bg-zinc-950/30 border border-zinc-900/60 rounded-xl p-3 text-center text-xs text-zinc-500">
            Only <span className="font-semibold text-violet-400">Contract Admin</span> can modify accredited issuers list.
          </div>
        )}
      </div>
    </div>
  );
}
