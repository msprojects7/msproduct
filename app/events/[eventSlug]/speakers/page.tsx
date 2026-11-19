'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Users,
  UserPlus,
  Star,
  Search,
  Linkedin,
  Twitter,
  Globe,
  Mail,
  Edit2,
  Trash2,
  Link as LinkIcon,
  AlertCircle,
  X,
  Loader2,
} from 'lucide-react';
import BackButton from '@/app/components/ui/BackButton';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';
import { useToast } from '@/app/components/ui/Toast';

interface SpeakerSession {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  role: string;
}

interface Speaker {
  associationId?: string;
  id: string;
  organizationId: string;
  name: string;
  title: string | null;
  company: string | null;
  bio: string | null;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  websiteUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  featured?: boolean;
  displayOrder?: number;
  sessions?: SpeakerSession[];
}

export default function SpeakersManagementPage() {
  const params = useParams();
  const eventSlug = params?.eventSlug as string;
  const { toast } = useToast();

  const [speakersList, setSpeakersList] = useState<Speaker[]>([]);
  const [orgSpeakers, setOrgSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFeatured, setFilterFeatured] = useState<boolean | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);
  const [speakerToDelete, setSpeakerToDelete] = useState<Speaker | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    company: '',
    bio: '',
    email: '',
    phone: '',
    photoUrl: '',
    websiteUrl: '',
    linkedinUrl: '',
    twitterUrl: '',
    featured: false,
    displayOrder: 0,
  });

  const fetchSpeakers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/events/${eventSlug}/speakers`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch event speakers');
      setSpeakersList(data.speakers || []);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error loading speakers');
    } finally {
      setLoading(false);
    }
  }, [eventSlug]);

  const fetchOrgSpeakers = useCallback(async () => {
    try {
      // First get event context to resolve org ID
      const eventRes = await fetch(`/api/events/${eventSlug}`);
      const eventData = await eventRes.json();
      if (!eventRes.ok || !eventData.event) return;

      const orgRes = await fetch(`/api/organizations/${eventData.event.organizationId}/speakers`);
      const orgData = await orgRes.json();
      if (orgRes.ok && orgData.speakers) {
        setOrgSpeakers(orgData.speakers);
      }
    } catch (e) {
      console.error('Failed to load org speakers:', e);
    }
  }, [eventSlug]);

  useEffect(() => {
    fetchSpeakers();
    fetchOrgSpeakers();
  }, [fetchSpeakers, fetchOrgSpeakers]);

  const handleOpenAdd = () => {
    setEditingSpeaker(null);
    setFormData({
      name: '',
      title: '',
      company: '',
      bio: '',
      email: '',
      phone: '',
      photoUrl: '',
      websiteUrl: '',
      linkedinUrl: '',
      twitterUrl: '',
      featured: false,
      displayOrder: 0,
    });
    setFormError(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (speaker: Speaker) => {
    setEditingSpeaker(speaker);
    setFormData({
      name: speaker.name || '',
      title: speaker.title || '',
      company: speaker.company || '',
      bio: speaker.bio || '',
      email: speaker.email || '',
      phone: speaker.phone || '',
      photoUrl: speaker.photoUrl || '',
      websiteUrl: speaker.websiteUrl || '',
      linkedinUrl: speaker.linkedinUrl || '',
      twitterUrl: speaker.twitterUrl || '',
      featured: Boolean(speaker.featured),
      displayOrder: speaker.displayOrder || 0,
    });
    setFormError(null);
    setShowAddModal(true);
  };

  const handleSubmitSpeaker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Speaker name is required');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      if (editingSpeaker) {
        // 1. Update organization speaker profile
        const updateRes = await fetch(`/api/organizations/${editingSpeaker.organizationId}/speakers/${editingSpeaker.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const updateData = await updateRes.json();
        if (!updateRes.ok) throw new Error(updateData.error || 'Failed to update speaker profile');

        // 2. Update event association metadata (featured & displayOrder)
        await fetch(`/api/events/${eventSlug}/speakers/${editingSpeaker.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            featured: formData.featured,
            displayOrder: formData.displayOrder,
          }),
        });
      } else {
        // Create brand new speaker linked to this event
        const res = await fetch(`/api/events/${eventSlug}/speakers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create speaker');
      }

      setShowAddModal(false);
      fetchSpeakers();
      fetchOrgSpeakers();
    } catch (err: unknown) {
      const e = err as Error;
      setFormError(e.message || 'Error saving speaker');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLinkOrgSpeaker = async (speakerId: string) => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/events/${eventSlug}/speakers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speakerId, featured: false, displayOrder: 0 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to link speaker');

      setShowLinkModal(false);
      toast.success('Speaker linked to event');
      fetchSpeakers();
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || 'Failed to link speaker to event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleFeatured = async (speaker: Speaker) => {
    try {
      const newFeatured = !speaker.featured;
      setSpeakersList((prev) =>
        prev.map((s) => (s.id === speaker.id ? { ...s, featured: newFeatured } : s))
      );

      await fetch(`/api/events/${eventSlug}/speakers/${speaker.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: newFeatured }),
      });
      toast.success(newFeatured ? 'Marked as featured' : 'Unmarked as featured');
    } catch {
      fetchSpeakers();
    }
  };

  const handleUnlinkSpeaker = async () => {
    if (!speakerToDelete) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/events/${eventSlug}/speakers/${speakerToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to unlink speaker');
      }
      setSpeakerToDelete(null);
      toast.success('Speaker unlinked');
      fetchSpeakers();
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || 'Error unlinking speaker');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSpeakers = speakersList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.company && s.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.title && s.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFeatured =
      filterFeatured === null ? true : Boolean(s.featured) === filterFeatured;

    return matchesSearch && matchesFeatured;
  });

  const unlinkedOrgSpeakers = orgSpeakers.filter(
    (os) => !speakersList.some((es) => es.id === os.id)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <BackButton href={`/events/${eventSlug}`} label="Back to Event" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-500" />
              Speaker Directory & Faculty
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Manage keynotes, guest lecturers, panel chairs, and reusable organization faculty.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unlinkedOrgSpeakers.length > 0 && (
            <button
              type="button"
              onClick={() => setShowLinkModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              Link Existing ({unlinkedOrgSpeakers.length})
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-xs transition"
          >
            <UserPlus className="w-4 h-4" />
            Add Speaker
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, title, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterFeatured(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              filterFeatured === null
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All ({speakersList.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterFeatured(true)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              filterFeatured === true
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            Featured ({speakersList.filter((s) => s.featured).length})
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Speaker Cards Grid */}
      {loading ? (
        <div className="mt-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs text-slate-500">Loading speaker roster...</p>
        </div>
      ) : filteredSpeakers.length === 0 ? (
        <div className="mt-12 text-center py-12 bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No speakers found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No speakers matched your search criteria.'
              : 'Add your conference keynote speakers, guest faculty, and session chairs.'}
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition"
          >
            <UserPlus className="w-4 h-4" />
            Add First Speaker
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSpeakers.map((speaker) => (
            <div
              key={speaker.id}
              className={`relative bg-white dark:bg-slate-900/90 rounded-2xl border transition-all hover:shadow-md p-5 flex flex-col justify-between ${
                speaker.featured
                  ? 'border-amber-400/40 dark:border-amber-500/30 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Card Top: Avatar, Name, Featured Star */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-base overflow-hidden border border-white/10 shrink-0">
                      {speaker.photoUrl ? (
                        <img
                          src={speaker.photoUrl}
                          alt={speaker.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        speaker.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {speaker.name}
                      </h4>
                      {speaker.title && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                          {speaker.title}
                        </p>
                      )}
                      {speaker.company && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {speaker.company}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleFeatured(speaker)}
                    className={`p-1.5 rounded-lg transition ${
                      speaker.featured
                        ? 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
                        : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title={speaker.featured ? 'Featured Speaker' : 'Mark as Featured'}
                  >
                    <Star className={`w-4 h-4 ${speaker.featured ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Bio Excerpt */}
                {speaker.bio && (
                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {speaker.bio}
                  </p>
                )}

                {/* Assigned Sessions */}
                {speaker.sessions && speaker.sessions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Sessions ({speaker.sessions.length})
                    </span>
                    <div className="space-y-1">
                      {speaker.sessions.map((sess) => (
                        <div
                          key={sess.id}
                          className="flex items-center justify-between text-[11px] bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg"
                        >
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                            {sess.title}
                          </span>
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded uppercase">
                            {sess.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer: Socials and Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {speaker.email && (
                    <a
                      href={`mailto:${speaker.email}`}
                      className="p-1 text-slate-400 hover:text-blue-500 transition rounded"
                      title={speaker.email}
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {speaker.linkedinUrl && (
                    <a
                      href={speaker.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-slate-400 hover:text-blue-600 transition rounded"
                      title="LinkedIn"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {speaker.twitterUrl && (
                    <a
                      href={speaker.twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-slate-400 hover:text-sky-500 transition rounded"
                      title="Twitter/X"
                    >
                      <Twitter className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {speaker.websiteUrl && (
                    <a
                      href={speaker.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-slate-400 hover:text-emerald-500 transition rounded"
                      title="Website"
                    >
                      <Globe className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(speaker)}
                    className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                    title="Edit Speaker"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpeakerToDelete(speaker)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                    title="Unlink Speaker"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Speaker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                {editingSpeaker ? 'Edit Speaker Profile' : 'Add New Speaker'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSpeaker} className="p-6 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Evelyn Reed"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Professor of Surgery"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Organization / Hospital
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apollo Hospitals"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Speaker Biography
                </label>
                <textarea
                  rows={3}
                  placeholder="Summary of qualifications, research, or keynote topic..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="evelyn@hospital.org"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Photo URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/portraits/speaker.jpg"
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    value={formData.linkedinUrl}
                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Twitter / X URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://x.com/..."
                    value={formData.twitterUrl}
                    onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Mark as Keynote / Featured Speaker
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingSpeaker ? 'Save Changes' : 'Create Speaker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Organization Speaker Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-blue-500" />
                Link Existing Faculty
              </h3>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 my-3">
              Select reusable speaker profiles from your organization to associate with this event:
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {unlinkedOrgSpeakers.map((orgSpeaker) => (
                <div
                  key={orgSpeaker.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60"
                >
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {orgSpeaker.name}
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      {[orgSpeaker.title, orgSpeaker.company].filter(Boolean).join(' • ')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLinkOrgSpeaker(orgSpeaker.id)}
                    disabled={submitting}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Unlink Dialog */}
      <ConfirmDialog
        isOpen={Boolean(speakerToDelete)}
        title="Unlink Speaker from Event"
        description={`Are you sure you want to remove ${speakerToDelete?.name} from this event? The speaker profile will remain safely stored in your organization directory.`}
        confirmText="Unlink Speaker"
        variant="destructive"
        loading={submitting}
        onConfirm={handleUnlinkSpeaker}
        onCancel={() => setSpeakerToDelete(null)}
      />
    </div>
  );
}
