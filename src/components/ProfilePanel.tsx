import React, { useState } from 'react';
import { Profile, SimulatedWallet } from '../types';
import { SimulatedEVM } from '../mockBlockchain';
import { User, Mail, Globe, ShieldCheck, HelpCircle, Save, AlertCircle } from 'lucide-react';

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
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  return (
    <div id="profile-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* DID Document Overview */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-zinc-900/20 border border-zinc-900/80 backdrop-blur-md rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] text-zinc-100 pointer-events-none">
            <User className="w-40 h-40" />
          </div>

          <div className="flex items-center space-x-3 mb-4.5">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 border border-violet-500/15">
              <ShieldCheck className="w-5.5 h-5.5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold font-display tracking-tight text-zinc-200">DID Notation (W3C Standard)</h3>
              <p className="text-[10px] text-violet-400 font-mono tracking-wider uppercase">Decentralized Identifier</p>
            </div>
          </div>

          <div className="bg-zinc-950/60 rounded-xl p-3.5 border border-zinc-900/80 font-mono text-xs break-all">
            <span className="text-violet-400 font-bold">did:ethr:</span>
            <span className="text-zinc-300">{activeAccount.address}</span>
          </div>

          <p className="text-xs text-zinc-400 mt-4 leading-relaxed">
            This Decentralized Identifier (DID) standard links your active on-chain public key directly with a cryptographically verifiable profile.
          </p>
        </div>

        <div className="bg-zinc-900/20 border border-zinc-900/80 backdrop-blur-md rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
          <h4 className="text-xs font-semibold text-zinc-200 mb-3.5 uppercase tracking-wider flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-violet-400" />
            <span>How DIDs Work</span>
          </h4>
          <ul className="space-y-3.5 text-xs text-zinc-400 leading-relaxed">
            <li>
              <span className="text-zinc-200 font-medium">Self-Sovereign Identity:</span> Your DID is generated and owned entirely by your wallet key-pair. No central entity can suspend your identifier.
            </li>
            <li>
              <span className="text-zinc-200 font-medium">Verifiable Profile:</span> The smart contract acts as an immutable registry linking your DID to verified emails, name claims, or document hashes.
            </li>
          </ul>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="lg:col-span-8 bg-zinc-900/20 border border-zinc-900/80 backdrop-blur-md rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
        <h3 className="text-base font-semibold font-display tracking-tight text-zinc-100 mb-6 flex items-center space-x-2.5">
          <User className="w-5.5 h-5.5 text-violet-400" />
          <span>Manage On-Chain Identity Profile</span>
        </h3>

        <form onSubmit={handleUpdate} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alice Smith"
                className={`w-full px-3.5 py-2.5 bg-zinc-950 border rounded-xl text-xs text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all ${
                  errors.name ? 'border-rose-500/50 focus:ring-rose-500/10 focus:border-rose-500/70' : 'border-zinc-900 focus:ring-violet-500/10 focus:border-violet-500/50'
                }`}
              />
              {errors.name && (
                <p className="mt-1.5 text-[11px] text-rose-400 flex items-center space-x-1 font-mono">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2 flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-zinc-400" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alice@gmail.com"
                className={`w-full px-3.5 py-2.5 bg-zinc-950 border rounded-xl text-xs text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all ${
                  errors.email ? 'border-rose-500/50 focus:ring-rose-500/10 focus:border-rose-500/70' : 'border-zinc-900 focus:ring-violet-500/10 focus:border-violet-500/50'
                }`}
              />
              {errors.email && (
                <p className="mt-1.5 text-[11px] text-rose-400 flex items-center space-x-1 font-mono">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>
          </div>

          {/* Metadata URI */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-2 flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              <span>DID Document / Profile Metadata URI (IPFS / HTTPS)</span>
            </label>
            <input
              type="text"
              value={metadataURI}
              onChange={(e) => setMetadataURI(e.target.value)}
              placeholder="ipfs://QmYwAPzwn5..."
              className={`w-full px-3.5 py-2.5 bg-zinc-950 border rounded-xl font-mono text-xs text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all ${
                errors.metadataURI ? 'border-rose-500/50 focus:ring-rose-500/10 focus:border-rose-500/70' : 'border-zinc-900 focus:ring-violet-500/10 focus:border-violet-500/50'
              }`}
            />
            {errors.metadataURI && (
              <p className="mt-1.5 text-[11px] text-rose-400 flex items-center space-x-1 font-mono">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.metadataURI}</span>
              </p>
            )}
            <p className="mt-1.5 text-[10px] text-zinc-500">
              Pointer to an off-chain JSON DID Document outlining authorized keys and services.
            </p>
          </div>

          <div className="pt-4 border-t border-zinc-900/50 flex items-center justify-between">
            <div className="text-[11px] font-mono text-zinc-500">
              {currentProfile?.exists ? (
                <span>Registered: {new Date(currentProfile.createdAt * 1000).toLocaleString()}</span>
              ) : (
                <span className="text-amber-500/90">Profile Not Registered On-Chain</span>
              )}
            </div>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-4.5 py-2 text-xs font-semibold text-zinc-50 bg-violet-600 hover:bg-violet-500 hover:shadow-[0_0_15px_rgba(139,92,246,0.2)] border border-violet-500/20 rounded-xl transition-all duration-200 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save DID Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
