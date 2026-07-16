import React, { useState } from 'react';
import { Profile, SimulatedWallet } from '../types';
import { SimulatedEVM } from '../mockBlockchain';
import { User, Mail, Globe, ShieldCheck, HelpCircle, Save, AlertCircle, Copy, Check, Fingerprint, Shield, Landmark } from 'lucide-react';
import Button from './ui/Button';

interface ProfilePanelProps {
  evm: SimulatedEVM;
  activeAccount: SimulatedWallet;
  onRefresh: () => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function ProfilePanel({ evm, activeAccount, onRefresh, addToast }: ProfilePanelProps) {
  const currentProfile = evm.profiles[activeAccount.address.toLowerCase()];
  
  // Form fields
  const [name, setName] = useState(currentProfile?.name || '');
  const [email, setEmail] = useState(currentProfile?.email || '');
  const [metadataURI, setMetadataURI] = useState(currentProfile?.metadataURI || 'ipfs://QmYwAPzwn5QMpMaWu8D9L2LGcVTzj63Zz5dQJ2u2b89fFf');
  
  // Copy state
  const [copied, setCopied] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Synchronize form values when persona swaps
  React.useEffect(() => {
    setName(currentProfile?.name || '');
    setEmail(currentProfile?.email || '');
    setMetadataURI(currentProfile?.metadataURI || 'ipfs://QmYwAPzwn5QMpMaWu8D9L2LGcVTzj63Zz5dQJ2u2b89fFf');
    setErrors({});
  }, [activeAccount.address, currentProfile]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = 'Full Name is required.';
    } else if (name.trim().length < 3) {
      newErrors.name = 'Full Name must be at least 3 characters.';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!metadataURI.trim()) {
      newErrors.metadataURI = 'DID Document Metadata URI is required.';
    } else if (!metadataURI.startsWith('ipfs://') && !metadataURI.startsWith('https://')) {
      newErrors.metadataURI = 'Metadata URI must start with ipfs:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      addToast('Please correct validation errors first.', 'error');
      return;
    }

    try {
      evm.createOrUpdateProfile(
        activeAccount.address,
        name.trim(),
        email.trim(),
        metadataURI.trim()
      );
      addToast('On-chain DID Profile successfully updated!', 'success');
      onRefresh();
    } catch (err: any) {
      addToast(err.message || 'Failed to update profile.', 'error');
    }
  };

  const copyDID = () => {
    navigator.clipboard.writeText(`did:ethr:${activeAccount.address}`);
    setCopied(true);
    addToast('DID copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="profile-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      {/* DID Document Overview */}
      <div className="lg:col-span-5 space-y-6">
        {/* Holographic ID card */}
        <div className="holo-card p-6 rounded-3xl border border-violet-500/20 shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex flex-col justify-between h-[310px] relative">
          {/* Card background glowing accents */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-violet-500/35 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>

          {/* Top Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Fingerprint className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-300 font-mono tracking-widest uppercase">Decentralized ID Pass</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                <span className="text-[9px] font-mono text-emerald-400 font-medium">On-Chain Active</span>
              </div>
            </div>

            {/* Microchip & Scan pattern */}
            <div className="flex items-center justify-between mb-5">
              <div className="w-10 h-8 rounded-lg bg-gradient-to-br from-amber-400/40 to-amber-600/10 border border-amber-400/50 relative overflow-hidden flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                <div className="w-full h-[1px] bg-amber-400/40 absolute top-1/2 left-0"></div>
                <div className="w-[1px] h-full bg-amber-400/40 absolute top-0 left-1/2"></div>
                <div className="w-6 h-4 rounded border border-amber-400/30"></div>
              </div>
              {/* Futuristic Barcode indicator */}
              <div className="flex items-end space-x-0.5 opacity-45 h-6">
                <span className="w-[1px] h-full bg-cyan-400"></span>
                <span className="w-[2px] h-[80%] bg-cyan-400"></span>
                <span className="w-[1px] h-full bg-cyan-400"></span>
                <span className="w-[3px] h-[50%] bg-cyan-400"></span>
                <span className="w-[1px] h-[75%] bg-cyan-400"></span>
                <span className="w-[2px] h-full bg-cyan-400"></span>
                <span className="w-[1px] h-[50%] bg-cyan-400"></span>
                <span className="w-[4px] h-[66%] bg-cyan-400"></span>
              </div>
            </div>

            {/* Identity details with Biometric Box */}
            <div className="flex items-center justify-between gap-4 mt-2 bg-black/30 border border-white/5 p-3.5 rounded-2xl backdrop-blur-sm">
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-[8px] font-mono uppercase text-zinc-500 tracking-wider">Registered Subject</p>
                <h4 className="text-base font-extrabold font-display tracking-wide text-zinc-100 truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                  {currentProfile?.name || activeAccount.name}
                </h4>
                <p className="text-xs text-zinc-400 font-mono truncate">
                  {currentProfile?.email || 'No email registered'}
                </p>
              </div>

              {/* Glowing High-tech biometric portrait frame */}
              <div className="w-14 h-14 rounded-xl border border-dashed border-cyan-500/40 bg-cyan-950/15 relative overflow-hidden flex items-center justify-center shrink-0 shadow-[inset_0_0_8px_rgba(6,182,212,0.15)] group">
                {/* Scanner Laser effect */}
                <div className="absolute inset-x-0 h-0.5 bg-cyan-400/80 shadow-[0_0_8px_rgba(6,182,212,0.8)] scan-line pointer-events-none"></div>
                
                {/* Tech corner accents */}
                <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-cyan-400"></div>
                <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-cyan-400"></div>
                <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-cyan-400"></div>
                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-cyan-400"></div>

                <User className="w-6 h-6 text-cyan-400/65 group-hover:text-cyan-300 transition-all group-hover:scale-110 duration-300" />
              </div>
            </div>
          </div>

          {/* Bottom Section: Address */}
          <div className="pt-4 border-t border-white/5 flex items-end justify-between">
            <div className="min-w-0 flex-1 pr-4">
              <p className="text-[9px] font-mono uppercase text-zinc-500 tracking-wider">Universal Identifier (DID)</p>
              <p className="text-[10px] text-violet-300 font-mono truncate select-all mt-0.5" title={`did:ethr:${activeAccount.address}`}>
                did:ethr:{activeAccount.address}
              </p>
            </div>
            <button
              onClick={copyDID}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Copy DID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Guides */}
        <div className="card space-y-4">
          <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>Understanding your Identity</span>
          </h4>
          <div className="space-y-3 text-xs text-zinc-400 leading-relaxed">
            <div className="flex items-start space-x-2.5">
              <Shield className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <p>
                <strong className="text-zinc-300">Self-Sovereign ownership:</strong> Your cryptographic key pair is the only key that can control this identity profile. No centralized server dictates your account.
              </p>
            </div>
            <div className="flex items-start space-x-2.5">
              <Landmark className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <p>
                <strong className="text-zinc-300">W3C DID standard:</strong> By complying with the `did:ethr` schema, you can prove control of your address to global Web3 integrations seamlessly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="lg:col-span-7 card p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-violet-500/10 rounded-xl text-violet-400 border border-violet-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display tracking-tight text-zinc-100">
                On-Chain Profile Registration
              </h3>
              <p className="text-xs text-zinc-400">Map human-readable information to your cryptographic address</p>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-300 flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alice Smith"
                  className={`w-full ${
                    errors.name ? 'border-rose-500/50 focus:border-rose-500' : ''
                  }`}
                />
                {errors.name && (
                  <p className="text-[10px] text-rose-400 flex items-center space-x-1 font-mono">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-300 flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. alice@smith.com"
                  className={`w-full ${
                    errors.email ? 'border-rose-500/50 focus:border-rose-500' : ''
                  }`}
                />
                {errors.email && (
                  <p className="text-[10px] text-rose-400 flex items-center space-x-1 font-mono">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Metadata URI */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-300 flex items-center space-x-1.5">
                <Globe className="w-3.5 h-3.5 text-zinc-500" />
                <span>DID Document / Metadata URI (IPFS / HTTPS)</span>
              </label>
              <input
                type="text"
                value={metadataURI}
                onChange={(e) => setMetadataURI(e.target.value)}
                placeholder="ipfs://QmYwAPzwn5..."
                className={`w-full font-mono text-xs ${
                  errors.metadataURI ? 'border-rose-500/50 focus:border-rose-500' : ''
                }`}
              />
              {errors.metadataURI && (
                <p className="text-[10px] text-rose-400 flex items-center space-x-1 font-mono">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.metadataURI}</span>
                </p>
              )}
              <p className="text-[10px] text-zinc-500">
                Links directly to decentralized storage keeping your public identity payload secure.
              </p>
            </div>

            <div className="pt-6 border-t border-white/5 flex items-center justify-between gap-4">
              <div className="text-[11px] font-mono text-zinc-500">
                {currentProfile?.exists ? (
                  <span className="text-emerald-400/90 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 inline" />
                    <span>Registered Profile on Ledger</span>
                  </span>
                ) : (
                  <span className="text-amber-500/90 font-medium">Unregistered Address Profile</span>
                )}
              </div>
              <Button type="submit" size="md">
                <Save className="w-4 h-4" />
                <span>Update On-Chain DID</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
