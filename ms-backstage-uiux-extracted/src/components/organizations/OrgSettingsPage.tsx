import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../navigation/BackButton';
import { Building2, Save, Users, CreditCard, ShieldAlert, ArrowRight } from 'lucide-react';

export const OrgSettingsPage: React.FC = () => {
  const { currentOrg, updateOrganization, openConfirm, navigate, addToast } = useApp();

  const [name, setName] = useState(currentOrg.name);
  const [contactEmail, setContactEmail] = useState(currentOrg.contactEmail);
  const [contactPhone, setContactPhone] = useState(currentOrg.contactPhone);
  const [timezone, setTimezone] = useState(currentOrg.timezone);
  const [currency, setCurrency] = useState(currentOrg.currency);
  const [brandColor, setBrandColor] = useState(currentOrg.brandColor || '#3b82f6');
  const [ownerName, setOwnerName] = useState(currentOrg.ownerName);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrganization(currentOrg.id, {
      name,
      contactEmail,
      contactPhone,
      timezone,
      currency,
      brandColor,
      ownerName
    });
  };

  const handleTransferOwnership = () => {
    openConfirm({
      title: `Transfer Organization Ownership?`,
      message: `Transferring ownership of "${currentOrg.name}" to another member will remove your primary billing and administrative management rights.`,
      confirmLabel: 'Transfer Ownership',
      isDestructive: true,
      onConfirm: () => {
        addToast({
          type: 'info',
          title: 'Ownership Transfer Protocol',
          message: 'An ownership verification token has been generated.'
        });
      }
    });
  };

  return (
    <div className="w-full pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <BackButton label="Back to Organizations" targetRoute="orgs-list" />
            <div className="pt-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Organization Settings</h1>
              <p className="text-xs text-slate-400">
                {currentOrg.name} · Branding, contact credentials, and regional defaults
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('orgs-subscription')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Subscription & Billing</span>
            </button>
            <button
              onClick={() => navigate('staff')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Members ({currentOrg.memberCount})</span>
            </button>
          </div>
        </div>

        {/* SETTINGS FORM */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800">
          <form onSubmit={handleSave} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Organization Legal Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Primary Contact Email</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Default Time Zone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 text-xs"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                  <option value="America/New_York">America/New_York (EST -5:00)</option>
                  <option value="Europe/London">Europe/London (GMT +0:00)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT +8:00)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Billing Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 text-xs"
                >
                  <option value="INR (₹)">INR (₹)</option>
                  <option value="USD ($)">USD ($)</option>
                  <option value="EUR (€)">EUR (€)</option>
                  <option value="GBP (£)">GBP (£)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Primary Brand Accent Color</label>
                <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="font-mono text-white text-xs">{brandColor}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Organization Owner</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md flex items-center gap-2 active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Organization Details</span>
              </button>
            </div>
          </form>
        </div>

        {/* DANGER ZONE: OWNERSHIP TRANSFER */}
        <div className="rounded-3xl glass-panel p-6 border border-rose-500/30 bg-rose-950/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-rose-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Ownership Transfer Zone</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Relinquish ownership of this organization to another invited administrator. This will update billing ownership permanently.
              </p>
            </div>

            <button
              onClick={handleTransferOwnership}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 transition-colors shrink-0"
            >
              Initiate Ownership Transfer
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
