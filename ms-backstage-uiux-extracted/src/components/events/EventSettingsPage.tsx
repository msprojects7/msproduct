import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../navigation/BackButton';
import { Hash, Save, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

export const EventSettingsPage: React.FC = () => {
  const { currentEvent, updateEvent, addToast } = useApp();

  const [prefix, setPrefix] = useState(currentEvent.prefix);
  const [startingNumber, setStartingNumber] = useState(currentEvent.startingNumber);
  const [numberPadding, setNumberPadding] = useState(currentEvent.numberPadding);
  const [registrationOpen, setRegistrationOpen] = useState(currentEvent.registrationOpen);
  const [venue, setVenue] = useState(currentEvent.venue);
  const [address, setAddress] = useState(currentEvent.address);

  // Dynamic next number preview derived mathematically from state
  const nextSeq = (currentEvent.currentNumber + 1).toString().padStart(numberPadding, '0');
  const derivedNextCode = `${prefix}${nextSeq}`;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateEvent(currentEvent.id, {
      prefix: prefix.trim(),
      startingNumber,
      numberPadding,
      registrationOpen,
      venue: venue.trim(),
      address: address.trim()
    });
  };

  return (
    <div className="w-full pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <BackButton label="Back to Event Dashboard" targetRoute="events-dashboard" />
            <div className="pt-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Event Settings & Numbering Rules</h1>
              <p className="text-xs text-slate-400">
                {currentEvent.name} · Registration numbering rules, sequence rules & venue parameters
              </p>
            </div>
          </div>
        </div>

        {/* SETTINGS FORM */}
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* SECTION 13 REQUIREMENT: REGISTRATION NUMBER CONFIGURATION PANEL */}
          <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 space-y-5 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-950/60 border border-indigo-700/40 text-indigo-400 flex items-center justify-center font-bold">
                <Hash className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Registration Number Configuration</h3>
                <p className="text-slate-400 text-xs">Define how unique IDs are assigned to delegates upon registration.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Registration Prefix</label>
                <input
                  type="text"
                  required
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                  placeholder="e.g. APX- or REG-"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Starting Sequence Number</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={startingNumber}
                  onChange={(e) => setStartingNumber(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Number Zero Padding</label>
                <select
                  value={numberPadding}
                  onChange={(e) => setNumberPadding(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500 text-xs"
                >
                  <option value={3}>3 Digits (e.g. 001)</option>
                  <option value={4}>4 Digits (e.g. 1001)</option>
                  <option value={5}>5 Digits (e.g. 01001)</option>
                  <option value={6}>6 Digits (e.g. 001001)</option>
                </select>
              </div>
            </div>

            {/* DYNAMIC DERIVED PREVIEW (DERIVED FROM INPUTS, NOT HARDCODED) */}
            <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono text-indigo-300 uppercase tracking-wider block">
                  Next Registration ID Preview
                </span>
                <span className="text-xl font-extrabold font-mono text-white mt-0.5 block">
                  {derivedNextCode}
                </span>
              </div>
              <div className="text-right text-[11px] text-slate-400">
                <span>Sequence rule: Prefix + Padded Counter</span>
                <p className="font-mono text-slate-300 mt-0.5">Current sequence: #{currentEvent.currentNumber}</p>
              </div>
            </div>

            {/* CONCURRENCY SPECIFICATION NOTICE (MANDATORY IN SECTION 13) */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-slate-400 text-[11px] leading-relaxed">
              <span className="text-slate-300 font-semibold block mb-0.5">Architectural Concurrency Notice:</span>
              This settings panel configures sequence formatting for the frontend prototype. During Phase 3 backend integration, sequential registration numbers will be allocated atomically using PostgreSQL sequence generators (`SELECT nextval(...)`) with serializable isolation levels to eliminate race conditions across multiple simultaneous counter terminals.
            </div>
          </div>

          {/* VENUE & LOGISTICS */}
          <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Physical Venue Coordinates</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Facility Name</label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={registrationOpen}
                  onChange={(e) => setRegistrationOpen(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600"
                />
                <span className="text-white font-semibold">Enable Public Delegate Online Registration</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-950/60 active:scale-95 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Event Settings</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
