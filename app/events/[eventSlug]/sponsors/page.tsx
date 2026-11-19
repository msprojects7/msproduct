'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Award,
  Store,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Search,
  Globe,
  Mail,
  Phone,
  Building,
  X,
  Loader2,
  Hash,
} from 'lucide-react';
import BackButton from '@/app/components/ui/BackButton';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';
import { useToast } from '@/app/components/ui/Toast';

interface Sponsor {
  id: string;
  eventId: string;
  name: string;
  tier: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  displayOrder: number;
}

interface Exhibitor {
  id: string;
  eventId: string;
  name: string;
  boothNumber: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  description: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
}

const TIER_ORDER = [
  'Title',
  'Platinum',
  'Gold',
  'Silver',
  'Bronze',
  'Partner',
  'Custom',
];

const TIER_BADGE_STYLES: Record<string, string> = {
  Title: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  Platinum: 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
  Gold: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  Silver: 'bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700',
  Bronze: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  Partner: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  Custom: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
};

export default function SponsorsAndExhibitorsPage() {
  const params = useParams();
  const eventSlug = params?.eventSlug as string;
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'sponsors' | 'exhibitors'>('sponsors');
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [showExhibitorModal, setShowExhibitorModal] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [editingExhibitor, setEditingExhibitor] = useState<Exhibitor | null>(null);
  const [sponsorToDelete, setSponsorToDelete] = useState<Sponsor | null>(null);
  const [exhibitorToDelete, setExhibitorToDelete] = useState<Exhibitor | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Forms
  const [sponsorForm, setSponsorForm] = useState({
    name: '',
    tier: 'Platinum',
    logoUrl: '',
    websiteUrl: '',
    displayOrder: 0,
  });

  const [exhibitorForm, setExhibitorForm] = useState({
    name: '',
    boothNumber: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    description: '',
    websiteUrl: '',
    logoUrl: '',
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [sponsorsRes, exhibitorsRes] = await Promise.all([
        fetch(`/api/events/${eventSlug}/sponsors`),
        fetch(`/api/events/${eventSlug}/exhibitors`),
      ]);

      const [sponsorsData, exhibitorsData] = await Promise.all([
        sponsorsRes.json(),
        exhibitorsRes.json(),
      ]);

      if (!sponsorsRes.ok) throw new Error(sponsorsData.error || 'Failed to fetch sponsors');
      if (!exhibitorsRes.ok) throw new Error(exhibitorsData.error || 'Failed to fetch exhibitors');

      setSponsors(sponsorsData.sponsors || []);
      setExhibitors(exhibitorsData.exhibitors || []);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error loading records');
    } finally {
      setLoading(false);
    }
  }, [eventSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sponsor Handlers
  const handleOpenAddSponsor = () => {
    setEditingSponsor(null);
    setSponsorForm({
      name: '',
      tier: 'Platinum',
      logoUrl: '',
      websiteUrl: '',
      displayOrder: sponsors.length,
    });
    setFormError(null);
    setShowSponsorModal(true);
  };

  const handleOpenEditSponsor = (s: Sponsor) => {
    setEditingSponsor(s);
    setSponsorForm({
      name: s.name,
      tier: s.tier,
      logoUrl: s.logoUrl || '',
      websiteUrl: s.websiteUrl || '',
      displayOrder: s.displayOrder || 0,
    });
    setFormError(null);
    setShowSponsorModal(true);
  };

  const handleSubmitSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sponsorForm.name.trim()) {
      setFormError('Sponsor name is required');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const url = editingSponsor
        ? `/api/events/${eventSlug}/sponsors/${editingSponsor.id}`
        : `/api/events/${eventSlug}/sponsors`;
      const method = editingSponsor ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sponsorForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save sponsor');

      setShowSponsorModal(false);
      fetchData();
    } catch (err: unknown) {
      const e = err as Error;
      setFormError(e.message || 'Error saving sponsor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSponsor = async () => {
    if (!sponsorToDelete) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/events/${eventSlug}/sponsors/${sponsorToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete sponsor');
      }
      setSponsorToDelete(null);
      toast.success('Sponsor deleted successfully');
      fetchData();
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || 'Error deleting sponsor');
    } finally {
      setSubmitting(false);
    }
  };

  // Exhibitor Handlers
  const handleOpenAddExhibitor = () => {
    setEditingExhibitor(null);
    setExhibitorForm({
      name: '',
      boothNumber: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      description: '',
      websiteUrl: '',
      logoUrl: '',
    });
    setFormError(null);
    setShowExhibitorModal(true);
  };

  const handleOpenEditExhibitor = (ex: Exhibitor) => {
    setEditingExhibitor(ex);
    setExhibitorForm({
      name: ex.name,
      boothNumber: ex.boothNumber,
      contactName: ex.contactName || '',
      contactEmail: ex.contactEmail || '',
      contactPhone: ex.contactPhone || '',
      description: ex.description || '',
      websiteUrl: ex.websiteUrl || '',
      logoUrl: ex.logoUrl || '',
    });
    setFormError(null);
    setShowExhibitorModal(true);
  };

  const handleSubmitExhibitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exhibitorForm.name.trim()) {
      setFormError('Exhibitor name is required');
      return;
    }
    if (!exhibitorForm.boothNumber.trim()) {
      setFormError('Booth number is required');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const url = editingExhibitor
        ? `/api/events/${eventSlug}/exhibitors/${editingExhibitor.id}`
        : `/api/events/${eventSlug}/exhibitors`;
      const method = editingExhibitor ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exhibitorForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save exhibitor');

      setShowExhibitorModal(false);
      fetchData();
    } catch (err: unknown) {
      const e = err as Error;
      setFormError(e.message || 'Error saving exhibitor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExhibitor = async () => {
    if (!exhibitorToDelete) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/events/${eventSlug}/exhibitors/${exhibitorToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete exhibitor');
      }
      setExhibitorToDelete(null);
      toast.success('Exhibitor deleted successfully');
      fetchData();
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || 'Error deleting exhibitor');
    } finally {
      setSubmitting(false);
    }
  };

  // Group sponsors by tier
  const sponsorsByTier = TIER_ORDER.reduce((acc, tier) => {
    const list = sponsors.filter((s) => s.tier === tier);
    if (list.length > 0) acc[tier] = list;
    return acc;
  }, {} as Record<string, Sponsor[]>);

  // Filtered lists
  const filteredExhibitors = exhibitors.filter(
    (ex) =>
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.boothNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ex.contactName && ex.contactName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <BackButton href={`/events/${eventSlug}`} label="Back to Event" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-500" />
              Sponsors & Commercial Exhibitors
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Manage corporate partnership tiers, brand assets, and collision-free trade show booth allocations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'sponsors' ? (
            <button
              type="button"
              onClick={handleOpenAddSponsor}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              Add Sponsor
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenAddExhibitor}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              Add Exhibitor Stall
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher & Search Bar */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('sponsors');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'sponsors'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            Sponsors ({sponsors.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('exhibitors');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'exhibitors'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Store className="w-4 h-4" />
            Exhibitors & Booths ({exhibitors.length})
          </button>
        </div>

        {activeTab === 'exhibitors' && (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by company, booth #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="mt-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs text-slate-500">Loading partnership registry...</p>
        </div>
      ) : activeTab === 'sponsors' ? (
        // SPONSORS VIEW
        sponsors.length === 0 ? (
          <div className="mt-12 text-center py-12 bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
            <Award className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No sponsors registered</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Showcase your event's title partners, platinum, gold, and silver corporate sponsors.
            </p>
            <button
              type="button"
              onClick={handleOpenAddSponsor}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
              Add First Sponsor
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {Object.entries(sponsorsByTier).map(([tier, tierSponsors]) => (
              <div key={tier} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${
                      TIER_BADGE_STYLES[tier] || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {tier} Tier
                  </span>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {tierSponsors.map((sp) => (
                    <div
                      key={sp.id}
                      className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-md transition flex flex-col justify-between"
                    >
                      <div>
                        {/* Logo / Placeholder */}
                        <div className="w-full h-24 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center p-3 border border-slate-100 dark:border-slate-700/60 overflow-hidden mb-3">
                          {sp.logoUrl ? (
                            <img
                              src={sp.logoUrl}
                              alt={sp.name}
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <div className="flex items-center gap-1 text-slate-400 font-bold text-sm">
                              <Building className="w-5 h-5" />
                              <span>{sp.name}</span>
                            </div>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          {sp.name}
                        </h4>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        {sp.websiteUrl ? (
                          <a
                            href={sp.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            <Globe className="w-3 h-3" />
                            <span>Visit Site</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400">No link</span>
                        )}

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditSponsor(sp)}
                            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSponsorToDelete(sp)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // EXHIBITORS VIEW
        filteredExhibitors.length === 0 ? (
          <div className="mt-12 text-center py-12 bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
            <Store className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No exhibitors assigned</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Allocate collision-free booth spaces, track contact representatives, and organize trade stalls.
            </p>
            <button
              type="button"
              onClick={handleOpenAddExhibitor}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
              Add First Exhibitor Stall
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExhibitors.map((ex) => (
              <div
                key={ex.id}
                className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold border border-blue-500/20">
                        <Hash className="w-3 h-3" />
                        {ex.boothNumber}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
                        {ex.name}
                      </h4>
                    </div>

                    {ex.logoUrl && (
                      <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center p-1 border border-slate-200 dark:border-slate-700 shrink-0 overflow-hidden">
                        <img src={ex.logoUrl} alt={ex.name} className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>

                  {ex.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {ex.description}
                    </p>
                  )}

                  {/* Representative Contacts */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    {ex.contactName && (
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        Contact: {ex.contactName}
                      </div>
                    )}
                    {ex.contactEmail && (
                      <div className="flex items-center gap-1 text-[11px]">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <a href={`mailto:${ex.contactEmail}`} className="hover:underline truncate">
                          {ex.contactEmail}
                        </a>
                      </div>
                    )}
                    {ex.contactPhone && (
                      <div className="flex items-center gap-1 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{ex.contactPhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  {ex.websiteUrl ? (
                    <a
                      href={ex.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Globe className="w-3 h-3" />
                      <span>Brochure / Web</span>
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400">No URL</span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditExhibitor(ex)}
                      className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExhibitorToDelete(ex)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Add / Edit Sponsor Modal */}
      {showSponsorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                {editingSponsor ? 'Edit Sponsor' : 'Add Corporate Sponsor'}
              </h3>
              <button
                type="button"
                onClick={() => setShowSponsorModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSponsor} className="mt-4 space-y-3">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company / Brand Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Novartis, Sun Pharma, Stryker"
                  value={sponsorForm.name}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sponsorship Tier
                  </label>
                  <select
                    value={sponsorForm.tier}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, tier: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    {TIER_ORDER.map((tier) => (
                      <option key={tier} value={tier}>
                        {tier} Tier
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={sponsorForm.displayOrder}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, displayOrder: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Logo Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={sponsorForm.logoUrl}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, logoUrl: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Website / Landing Page URL
                </label>
                <input
                  type="url"
                  placeholder="https://company.com"
                  value={sponsorForm.websiteUrl}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, websiteUrl: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSponsorModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs"
                >
                  {editingSponsor ? 'Update Sponsor' : 'Save Sponsor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Exhibitor Modal */}
      {showExhibitorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-blue-500" />
                {editingExhibitor ? 'Edit Exhibitor Stall' : 'Allocate Exhibitor Booth'}
              </h3>
              <button
                type="button"
                onClick={() => setShowExhibitorModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitExhibitor} className="mt-4 overflow-y-auto space-y-3">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Medtronic Devices"
                    value={exhibitorForm.name}
                    onChange={(e) => setExhibitorForm({ ...exhibitorForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Stall / Booth # *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Booth #12, Stall A-4"
                    value={exhibitorForm.boothNumber}
                    onChange={(e) => setExhibitorForm({ ...exhibitorForm, boothNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product / Company Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Summary of products or medical technologies exhibited..."
                  value={exhibitorForm.description}
                  onChange={(e) => setExhibitorForm({ ...exhibitorForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="Representative Name"
                    value={exhibitorForm.contactName}
                    onChange={(e) => setExhibitorForm({ ...exhibitorForm, contactName: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    placeholder="rep@company.com"
                    value={exhibitorForm.contactEmail}
                    onChange={(e) => setExhibitorForm({ ...exhibitorForm, contactEmail: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+91 99999 88888"
                    value={exhibitorForm.contactPhone}
                    onChange={(e) => setExhibitorForm({ ...exhibitorForm, contactPhone: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Website / Brochure URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={exhibitorForm.websiteUrl}
                    onChange={(e) => setExhibitorForm({ ...exhibitorForm, websiteUrl: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={exhibitorForm.logoUrl}
                    onChange={(e) => setExhibitorForm({ ...exhibitorForm, logoUrl: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowExhibitorModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs"
                >
                  {editingExhibitor ? 'Update Stall' : 'Allocate Stall'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Sponsor ConfirmDialog */}
      <ConfirmDialog
        isOpen={Boolean(sponsorToDelete)}
        title="Remove Corporate Sponsor"
        description={`Are you sure you want to delete '${sponsorToDelete?.name}' from the ${sponsorToDelete?.tier} tier?`}
        confirmText="Delete Sponsor"
        variant="destructive"
        loading={submitting}
        onConfirm={handleDeleteSponsor}
        onCancel={() => setSponsorToDelete(null)}
      />

      {/* Delete Exhibitor ConfirmDialog */}
      <ConfirmDialog
        isOpen={Boolean(exhibitorToDelete)}
        title="Remove Exhibitor Stall"
        description={`Are you sure you want to release booth ${exhibitorToDelete?.boothNumber} assigned to '${exhibitorToDelete?.name}'?`}
        confirmText="Release Stall"
        variant="destructive"
        loading={submitting}
        onConfirm={handleDeleteExhibitor}
        onCancel={() => setExhibitorToDelete(null)}
      />
    </div>
  );
}
