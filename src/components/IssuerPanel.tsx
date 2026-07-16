import React, { useState } from 'react';
import { SimulatedWallet } from '../types';
import { SimulatedEVM, SIMULATED_WALLETS } from '../mockBlockchain';
import { ShieldAlert, CheckCircle, Key, FilePlus, UserCheck, Trash2, Calendar, User, Hash, HelpCircle, Plus, Sparkles, Eye, ShieldCheck, Landmark } from 'lucide-react';
import Button from './ui/Button';

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
    const randomHex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setCustomHash('0x' + randomHex);
    addToast('Cryptographic signature hash generated', 'info');
  };

  const handlePresetSelect = (type: string, duration: string) => {
    setCredentialType(type);
    setExpiryDays(duration);
    generateDataHash();
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

    if (expiryDays.trim() !== '0' && (isNaN(Number(expiryDays)) || Number(expiryDays) < 0)) {
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
    <div id="issuer-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      {/* Authorization Banner */}
      <div className="lg:col-span-12">
        {isAuthorized ? (
          <div className="bg-emerald-500/5 border border-emerald-500/15 p-4 rounded-2xl flex items-center space-x-3.5 text-emerald-400">
            <CheckCircle className="w-5.5 h-5.5 shrink-0" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold text-zinc-100">Accredited Authority Status:</span> Your active wallet holds authorized signing privileges on this `IdentityRegistry` smart contract. You may issue cryptographically bound credentials to any DID.
            </div>
          </div>
        ) : (
          <div className="bg-amber-500/5 border border-amber-500/15 p-4 rounded-2xl flex items-center space-x-3.5 text-amber-500">
            <ShieldAlert className="w-5.5 h-5.5 shrink-0" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold text-zinc-100 font-display">Signing Authorization Missing:</span> Your current key is not certified. Swap your role in the header to <strong className="text-amber-400">CamTech University</strong> or <strong className="text-amber-400 font-bold">Contract Admin</strong> to execute smart contract transactions.
            </div>
          </div>
        )}
      </div>

      {/* Main Issue Form */}
      <div className="lg:col-span-8 card p-6 space-y-6">
        <div className="flex items-center space-x-3 pb-3 border-b border-white/5">
          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
            <FilePlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display tracking-tight text-zinc-100">
              On-Chain Credential Formulation
            </h3>
            <p className="text-xs text-zinc-400">Deploy verified assertions mapped to an identity key</p>
          </div>
        </div>

        {/* Quick Presets */}
        {isAuthorized && (
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
              Quick Formulation Presets
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handlePresetSelect('Bachelor of Computer Science', '365')}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-violet-500/10 border border-white/5 hover:border-violet-500/30 text-zinc-300 hover:text-violet-300 text-xs transition-all cursor-pointer font-medium"
              >
                CamTech Degree (1 Year)
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect('Digital Driver License (Class A)', '1825')}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-violet-500/10 border border-white/5 hover:border-violet-500/30 text-zinc-300 hover:text-violet-300 text-xs transition-all cursor-pointer font-medium"
              >
                DMV License (5 Years)
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect('KYC Identity Pass Level 2', '0')}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-violet-500/10 border border-white/5 hover:border-violet-500/30 text-zinc-300 hover:text-violet-300 text-xs transition-all cursor-pointer font-medium"
              >
                KYC Verification (Lifetime)
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleIssueCredential} className="space-y-4.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subject Address */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-300 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-zinc-500" />
                <span>Recipient DID Address (Subject)</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="0x90F7..."
                className={`w-full font-mono text-xs ${
                  issueErrors.subject ? 'border-rose-500/50' : ''
                }`}
                disabled={!isAuthorized}
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {SIMULATED_WALLETS.map(w => (
                  <button
                    key={w.address}
                    type="button"
                    onClick={() => setSubject(w.address)}
                    className={`text-[9px] font-mono px-2 py-0.5 rounded border transition-all cursor-pointer ${
                      subject === w.address 
                        ? 'bg-violet-500/20 border-violet-500 text-violet-300' 
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-300 hover:border-zinc-700'
                    }`}
                    disabled={!isAuthorized}
                  >
                    {w.name.split(' ')[0]}
                  </button>
                ))}
              </div>
              {issueErrors.subject && (
                <p className="text-[10px] text-rose-400 font-mono flex items-center space-x-1.5">
                  <ShieldAlert className="w-3 h-3" />
                  <span>{issueErrors.subject}</span>
                </p>
              )}
            </div>

            {/* Credential Type */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-300 flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-zinc-500" />
                <span>Assertion Credential Type</span>
              </label>
              <select
                value={credentialType}
                onChange={(e) => setCredentialType(e.target.value)}
                className="w-full cursor-pointer text-xs"
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
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-300 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>Validity Window (Days)</span>
              </label>
              <input
                type="text"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                placeholder="0 for infinite lifetime"
                className={`w-full ${
                  issueErrors.expiryDays ? 'border-rose-500/50' : ''
                }`}
                disabled={!isAuthorized}
              />
              {issueErrors.expiryDays && (
                <p className="text-[10px] text-rose-400 font-mono flex items-center space-x-1.5">
                  <ShieldAlert className="w-3 h-3" />
                  <span>{issueErrors.expiryDays}</span>
                </p>
              )}
            </div>

            {/* Cryptographic Hash */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-300 flex items-center space-x-1.5">
                  <Hash className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Payload Integrity Hash</span>
                </label>
                {isAuthorized && (
                  <button
                    type="button"
                    onClick={generateDataHash}
                    className="text-[10px] text-violet-400 hover:text-violet-300 font-mono uppercase tracking-wider flex items-center space-x-1 cursor-pointer font-semibold"
                  >
                    <Sparkles className="w-3 h-3 inline" />
                    <span>Generate Hash</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                value={customHash}
                onChange={(e) => setCustomHash(e.target.value)}
                placeholder="0x8f7c9e0d1b3a5f4e..."
                className="w-full font-mono text-xs text-zinc-200"
                disabled={!isAuthorized}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex justify-end">
            <Button type="submit" disabled={!isAuthorized} size="md">
              <FilePlus className="w-4 h-4" />
              <span>Sign & Store On Chain</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Dynamic Preview & Authorities Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        {/* Dynamic preview card */}
        <div className="card p-5 space-y-4 border-dashed border-violet-500/30">
          <div className="flex items-center space-x-2 text-zinc-300">
            <Eye className="w-4 h-4 text-violet-400 animate-pulse" />
            <span className="text-xs font-bold font-mono uppercase tracking-wider">Draft Template Preview</span>
          </div>

          <div className="p-4 bg-zinc-950/80 rounded-2xl border border-white/5 space-y-3.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>
            
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[8px] font-mono text-violet-400 uppercase tracking-widest font-bold">Digital Credential</p>
                <h4 className="text-xs font-bold text-zinc-100 truncate mt-1 max-w-[150px]">{credentialType}</h4>
              </div>
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>

            <div className="space-y-2 text-[10px] font-mono text-zinc-400 border-t border-white/5 pt-3.5">
              <div className="flex justify-between">
                <span>Issued To:</span>
                <span className="text-zinc-200 truncate max-w-[120px]">{subject}</span>
              </div>
              <div className="flex justify-between">
                <span>Authority:</span>
                <span className="text-zinc-200 truncate max-w-[120px]">{activeAccount.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="text-zinc-200">{expiryDays === '0' ? 'Lifetime' : `${expiryDays} Days`}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Accreditation lists */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-bold font-display tracking-tight text-zinc-100 flex items-center space-x-2">
            <Landmark className="w-4 h-4 text-violet-400" />
            <span>Identity Registry Authorities</span>
          </h3>

          <div className="space-y-2">
            {SIMULATED_WALLETS.filter(w => evm.authorizedIssuers[w.address.toLowerCase()] || w.role === 'Admin').map(w => (
              <div key={w.address} className="flex items-center justify-between p-3 bg-white/2 rounded-xl border border-white/5 hover:border-violet-500/10 transition-colors">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-300 truncate">{w.name}</p>
                  <p className="text-[9px] text-zinc-500 font-mono truncate">{w.address}</p>
                </div>
                {isAdmin && w.role !== 'Admin' && (
                  <button
                    onClick={() => handleRevokeIssuer(w.address)}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all ml-2 cursor-pointer"
                    title="De-accredit Issuer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Form for new issuer */}
          {isAdmin ? (
            <form onSubmit={handleAuthorizeIssuer} className="pt-4 border-t border-white/5 space-y-2.5">
              <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
                Accredit New Signing Authority
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newIssuer}
                  onChange={(e) => setNewIssuer(e.target.value)}
                  placeholder="0xAddress..."
                  className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-900 rounded-xl text-xs font-mono text-zinc-200"
                />
                <Button type="submit" size="sm">
                  <span>Accredit</span>
                </Button>
              </div>
              {authErrors && (
                <p className="text-[10px] text-rose-400 font-mono">{authErrors}</p>
              )}
            </form>
          ) : (
            <div className="bg-white/2 border border-white/5 rounded-xl p-3 text-center text-[10px] text-zinc-500 leading-normal">
              Only <span className="font-semibold text-violet-400">Contract Admin</span> is authorized to accredit or revoke signing authorities.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
