import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../navigation/BackButton';
import { User, Mail, Phone, Shield, Volume2, Save, CheckCircle2, ShieldCheck } from 'lucide-react';

export const AccountProfilePage: React.FC = () => {
  const { currentUser, currentOrg, currentRole, addToast } = useApp();

  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || '+91 98450 12345');
  const [soundEnabled, setSoundEnabled] = useState(currentUser.soundEnabled ?? true);
  const [hapticEnabled, setHapticEnabled] = useState(currentUser.hapticEnabled ?? true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addToast({
      type: 'success',
      title: 'Profile Preferences Saved',
      message: 'Account preferences updated.'
    });
  };

  return (
    <div className="w-full pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <BackButton label="Back to Dashboard" targetRoute="dashboard" />
            <div className="pt-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Account & Personal Preferences</h1>
              <p className="text-xs text-slate-400">
                Manage your credentials, operational sound chimes, and organization identity
              </p>
            </div>
          </div>
        </div>

        {/* PROFILE CARD */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-indigo-950/60">
              SK
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">{currentUser.name}</h2>
              <p className="text-xs text-slate-400">{currentUser.email}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-800/40 text-indigo-300">
                  {currentRole}
                </span>
                <span className="text-xs text-slate-400">· {currentOrg.name}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="py-6 space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Contact Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Official Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 cursor-not-allowed"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Email address is managed by organization admin.</span>
            </div>

            {/* OPERATIONAL SOUND & HAPTIC PREFERENCES */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Counter & Hardware Audio Preferences
              </h3>

              <div className="space-y-2">
                <label className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-4 h-4 text-indigo-400" />
                    <div>
                      <span className="font-semibold text-white block">Turnstile Scanner Audio Chime</span>
                      <span className="text-[11px] text-slate-400">Play tone on successful ticket check-in or access denial</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600"
                  />
                </label>

                <label className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    <div>
                      <span className="font-semibold text-white block">Fast Registration Enter-Key Behavior</span>
                      <span className="text-[11px] text-slate-400">Automatically trigger registration submit on hitting enter in Name input</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={hapticEnabled}
                    onChange={(e) => setHapticEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600"
                  />
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Preferences</span>
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
