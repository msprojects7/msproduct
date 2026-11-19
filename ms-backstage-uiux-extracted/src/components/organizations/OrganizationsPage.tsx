import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../navigation/BackButton';
import { Building2, Plus, ArrowRight, ShieldCheck, Calendar, Users, Settings } from 'lucide-react';

export const OrganizationsPage: React.FC = () => {
  const { organizations, currentOrg, setCurrentOrgId, createOrganization, navigate, addToast } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    createOrganization({
      name: newOrgName.trim(),
      slug: newOrgSlug.trim() || newOrgName.toLowerCase().replace(/\s+/g, '-'),
      contactEmail: contactEmail.trim() || 'admin@apexevents.com'
    });
    setShowCreateModal(false);
    setNewOrgName('');
    setNewOrgSlug('');
    setContactEmail('');
  };

  return (
    <div className="w-full pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <BackButton label="Back to Dashboard" targetRoute="dashboard" />
            <div className="pt-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Organizations & Tenants</h1>
              <p className="text-xs text-slate-400">
                Manage your enterprise workspaces, client accounts, and shared billing subscriptions
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Organization</span>
          </button>
        </div>

        {/* ORGANIZATIONS LIST */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {organizations.map(org => {
            const isActive = org.id === currentOrg.id;
            return (
              <div
                key={org.id}
                className={`p-6 rounded-3xl glass-panel border transition-all ${
                  isActive ? 'border-indigo-500 ring-1 ring-indigo-500/50 shadow-xl' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-700/40 text-indigo-400 font-extrabold text-lg flex items-center justify-center">
                      {org.logoText || 'AW'}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">{org.name}</h3>
                      <p className="text-xs text-slate-400 font-mono">slug: /{org.slug}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-indigo-950/60 border border-indigo-800/40 text-indigo-300">
                    {org.plan}
                  </span>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <span>{org.eventCount} Events Configured</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span>{org.memberCount} Staff Members</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setCurrentOrgId(org.id);
                      navigate('orgs-settings');
                    }}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Settings & Branding</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentOrgId(org.id);
                      navigate('dashboard');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <span>{isActive ? 'Active Workspace' : 'Switch Workspace'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* CREATE ORGANIZATION MODAL */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md" onClick={() => setShowCreateModal(false)} />

            <div 
              role="dialog"
              className="relative w-full max-w-md rounded-3xl glass-popover p-6 shadow-2xl border border-slate-700/80 text-slate-100 z-10"
            >
              <h3 className="text-xl font-bold text-white tracking-tight mb-1">Create New Organization</h3>
              <p className="text-xs text-slate-400 mb-4">
                Set up an organization for a company, association, or university.
              </p>

              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Organization Name</label>
                  <input
                    type="text"
                    required
                    value={newOrgName}
                    onChange={(e) => {
                      setNewOrgName(e.target.value);
                      setNewOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }}
                    placeholder="e.g. MedLife Clinical Research"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">URL Identifier (Slug)</label>
                  <div className="flex items-center px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-mono">
                    <span>backstage.app/</span>
                    <input
                      type="text"
                      required
                      value={newOrgSlug}
                      onChange={(e) => setNewOrgSlug(e.target.value)}
                      className="w-full bg-transparent text-white focus:outline-none ml-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Billing Contact Email</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@organization.org"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md"
                  >
                    Create Organization
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
