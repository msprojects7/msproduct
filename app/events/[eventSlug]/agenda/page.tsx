'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Layers,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  X,
  DoorOpen,
} from 'lucide-react';
import BackButton from '@/app/components/ui/BackButton';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';
import { useToast } from '@/app/components/ui/Toast';

interface Track {
  id: string;
  name: string;
  roomName: string | null;
  capacity: number;
  color: string;
  displayOrder: number;
}

interface SpeakerInSession {
  id: string;
  name: string;
  title: string | null;
  company: string | null;
  photoUrl: string | null;
  role: string;
  displayOrder: number;
}

interface Session {
  id: string;
  eventId: string;
  trackId: string | null;
  title: string;
  description: string | null;
  sessionDate: string | null;
  startTime: string;
  endTime: string;
  room: string | null;
  capacity: number | null;
  status: string;
  tags: string[] | null;
  trackName: string | null;
  trackColor: string | null;
  trackRoom: string | null;
  effectiveRoom: string;
  speakers: SpeakerInSession[];
}

interface EventSpeaker {
  id: string;
  name: string;
  title: string | null;
  company: string | null;
  photoUrl: string | null;
}

export default function AgendaBuilderPage() {
  const params = useParams();
  const eventSlug = params?.eventSlug as string;
  const { toast } = useToast();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [eventSpeakers, setEventSpeakers] = useState<EventSpeaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Day filter
  const [selectedDay, setSelectedDay] = useState<string>('all');

  // Modals
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [trackToDelete, setTrackToDelete] = useState<Track | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Session Form
  const [sessionForm, setSessionForm] = useState({
    title: '',
    description: '',
    trackId: '',
    sessionDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    room: '',
    capacity: '',
    status: 'scheduled',
    tagInput: '',
    tags: [] as string[],
    selectedSpeakers: [] as Array<{ speakerId: string; role: string }>,
  });

  // Track Form
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [trackForm, setTrackForm] = useState({
    name: '',
    roomName: '',
    capacity: 0,
    color: '#3B82F6',
    displayOrder: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [tracksRes, sessionsRes, speakersRes] = await Promise.all([
        fetch(`/api/events/${eventSlug}/tracks`),
        fetch(`/api/events/${eventSlug}/sessions`),
        fetch(`/api/events/${eventSlug}/speakers`),
      ]);

      const [tracksData, sessionsData, speakersData] = await Promise.all([
        tracksRes.json(),
        sessionsRes.json(),
        speakersRes.json(),
      ]);

      if (!tracksRes.ok) throw new Error(tracksData.error || 'Failed to fetch tracks');
      if (!sessionsRes.ok) throw new Error(sessionsData.error || 'Failed to fetch sessions');

      setTracks(tracksData.tracks || []);
      setSessions(sessionsData.sessions || []);
      setEventSpeakers(speakersData.speakers || []);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error loading agenda data');
    } finally {
      setLoading(false);
    }
  }, [eventSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Extract distinct session dates
  const distinctDays = useMemo(() => {
    const dates = new Set<string>();
    sessions.forEach((s) => {
      const dateStr = s.startTime ? new Date(s.startTime).toISOString().split('T')[0] : null;
      if (dateStr) dates.add(dateStr);
    });
    return Array.from(dates).sort();
  }, [sessions]);

  // Filtered sessions by day
  const filteredSessions = useMemo(() => {
    if (selectedDay === 'all') return sessions;
    return sessions.filter((s) => {
      const dateStr = s.startTime ? new Date(s.startTime).toISOString().split('T')[0] : null;
      return dateStr === selectedDay;
    });
  }, [sessions, selectedDay]);

  const handleOpenAddSession = () => {
    setEditingSession(null);
    const defaultDate = distinctDays.length > 0 ? distinctDays[0] : new Date().toISOString().split('T')[0];
    setSessionForm({
      title: '',
      description: '',
      trackId: tracks.length > 0 ? tracks[0].id : '',
      sessionDate: defaultDate,
      startTime: '09:00',
      endTime: '10:00',
      room: tracks.length > 0 ? tracks[0].roomName || '' : '',
      capacity: '',
      status: 'scheduled',
      tagInput: '',
      tags: ['Keynote'],
      selectedSpeakers: [],
    });
    setFormError(null);
    setShowSessionModal(true);
  };

  const handleOpenEditSession = (session: Session) => {
    setEditingSession(session);
    const startDate = new Date(session.startTime);
    const endDate = new Date(session.endTime);

    const pad = (n: number) => String(n).padStart(2, '0');
    const startStr = `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`;
    const endStr = `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;
    const dateStr = startDate.toISOString().split('T')[0];

    setSessionForm({
      title: session.title,
      description: session.description || '',
      trackId: session.trackId || '',
      sessionDate: dateStr,
      startTime: startStr,
      endTime: endStr,
      room: session.room || '',
      capacity: session.capacity ? String(session.capacity) : '',
      status: session.status || 'scheduled',
      tagInput: '',
      tags: Array.isArray(session.tags) ? session.tags : [],
      selectedSpeakers: session.speakers.map((s) => ({
        speakerId: s.id,
        role: s.role || 'speaker',
      })),
    });
    setFormError(null);
    setShowSessionModal(true);
  };

  const handleTrackChange = (trackId: string) => {
    const selectedTrack = tracks.find((t) => t.id === trackId);
    setSessionForm((prev) => ({
      ...prev,
      trackId,
      room: selectedTrack?.roomName || prev.room,
    }));
  };

  const handleAddTag = () => {
    const tag = sessionForm.tagInput.trim();
    if (tag && !sessionForm.tags.includes(tag)) {
      setSessionForm((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
        tagInput: '',
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSessionForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const handleToggleSpeakerInSession = (speakerId: string) => {
    setSessionForm((prev) => {
      const exists = prev.selectedSpeakers.some((s) => s.speakerId === speakerId);
      if (exists) {
        return {
          ...prev,
          selectedSpeakers: prev.selectedSpeakers.filter((s) => s.speakerId !== speakerId),
        };
      } else {
        return {
          ...prev,
          selectedSpeakers: [...prev.selectedSpeakers, { speakerId, role: 'speaker' }],
        };
      }
    });
  };

  const handleSpeakerRoleChange = (speakerId: string, role: string) => {
    setSessionForm((prev) => ({
      ...prev,
      selectedSpeakers: prev.selectedSpeakers.map((s) =>
        s.speakerId === speakerId ? { ...s, role } : s
      ),
    }));
  };

  const handleSubmitSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionForm.title.trim()) {
      setFormError('Session title is required');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      // Build ISO timestamps
      const startDateTime = new Date(`${sessionForm.sessionDate}T${sessionForm.startTime}:00`).toISOString();
      const endDateTime = new Date(`${sessionForm.sessionDate}T${sessionForm.endTime}:00`).toISOString();

      if (new Date(endDateTime) <= new Date(startDateTime)) {
        setFormError('End time must be after start time');
        setSubmitting(false);
        return;
      }

      const payload = {
        title: sessionForm.title.trim(),
        description: sessionForm.description.trim() || null,
        trackId: sessionForm.trackId || null,
        sessionDate: startDateTime,
        startTime: startDateTime,
        endTime: endDateTime,
        room: sessionForm.room.trim() || null,
        capacity: sessionForm.capacity ? parseInt(sessionForm.capacity, 10) : null,
        status: sessionForm.status,
        tags: sessionForm.tags,
        speakers: sessionForm.selectedSpeakers.map((s, idx) => ({
          speakerId: s.speakerId,
          role: s.role,
          displayOrder: idx,
        })),
      };

      const url = editingSession
        ? `/api/events/${eventSlug}/sessions/${editingSession.id}`
        : `/api/events/${eventSlug}/sessions`;

      const method = editingSession ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save session');

      setShowSessionModal(false);
      fetchData();
    } catch (err: unknown) {
      const e = err as Error;
      setFormError(e.message || 'Error saving session');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/events/${eventSlug}/sessions/${sessionToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete session');
      }
      setSessionToDelete(null);
      toast.success('Session deleted successfully');
      fetchData();
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || 'Error deleting session');
    } finally {
      setSubmitting(false);
    }
  };

  // Track Handlers
  const handleOpenAddTrack = () => {
    setEditingTrack(null);
    setTrackForm({
      name: '',
      roomName: '',
      capacity: 100,
      color: '#3B82F6',
      displayOrder: tracks.length,
    });
    setShowTrackModal(true);
  };

  const handleOpenEditTrack = (track: Track) => {
    setEditingTrack(track);
    setTrackForm({
      name: track.name,
      roomName: track.roomName || '',
      capacity: track.capacity || 0,
      color: track.color || '#3B82F6',
      displayOrder: track.displayOrder || 0,
    });
    setShowTrackModal(true);
  };

  const handleSubmitTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackForm.name.trim()) return;

    try {
      setSubmitting(true);
      const url = editingTrack
        ? `/api/events/${eventSlug}/tracks/${editingTrack.id}`
        : `/api/events/${eventSlug}/tracks`;

      const method = editingTrack ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save track');

      toast.success(editingTrack ? 'Track updated' : 'Track created');
      setEditingTrack(null);
      setTrackForm({ name: '', roomName: '', capacity: 100, color: '#3B82F6', displayOrder: 0 });
      fetchData();
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || 'Error saving track');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTrack = async () => {
    if (!trackToDelete) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/events/${eventSlug}/tracks/${trackToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete track');
      }
      setTrackToDelete(null);
      toast.success('Track deleted');
      fetchData();
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || 'Error deleting track');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <BackButton href={`/events/${eventSlug}`} label="Back to Event" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-500" />
              Multi-Track Agenda & Schedule
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Curate conference stages, assign faculty keynotes, and prevent room schedule collisions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAddTrack}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            Tracks & Rooms ({tracks.length})
          </button>

          <button
            type="button"
            onClick={handleOpenAddSession}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Add Session
          </button>
        </div>
      </div>

      {/* Day Tabs */}
      {distinctDays.length > 0 && (
        <div className="mt-6 flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedDay('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              selectedDay === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Days ({sessions.length})
          </button>
          {distinctDays.map((dayStr, idx) => (
            <button
              key={dayStr}
              type="button"
              onClick={() => setSelectedDay(dayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedDay === dayStr
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Day {idx + 1} ({new Date(dayStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})
            </button>
          ))}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Multi-Track Schedule Layout */}
      {loading ? (
        <div className="mt-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs text-slate-500">Loading schedule matrix...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="mt-12 text-center py-12 bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No sessions scheduled</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Build your multi-track timeline by adding conference sessions, plenary talks, and workshops.
          </p>
          <button
            type="button"
            onClick={handleOpenAddSession}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition"
          >
            <Plus className="w-4 h-4" />
            Schedule First Session
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {filteredSessions.map((session) => {
            const startDate = new Date(session.startTime);
            const endDate = new Date(session.endTime);
            const durationMin = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));

            return (
              <div
                key={session.id}
                className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition p-5 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                {/* Left: Time & Room */}
                <div className="md:w-56 shrink-0 space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-mono text-xs font-bold border border-blue-500/20">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                      {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Duration: <span className="font-semibold text-slate-700 dark:text-slate-300">{durationMin} mins</span>
                  </div>

                  {session.trackName && (
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: session.trackColor || '#3B82F6' }}
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {session.trackName}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                    <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>{session.effectiveRoom}</span>
                    {session.capacity && (
                      <span className="text-[10px] text-slate-400">({session.capacity} seats)</span>
                    )}
                  </div>
                </div>

                {/* Center: Title, Description, Speakers, Tags */}
                <div className="flex-1 space-y-3">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {session.title}
                    </h4>
                    {session.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {session.description}
                      </p>
                    )}
                  </div>

                  {/* Assigned Speakers */}
                  {session.speakers && session.speakers.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {session.speakers.map((sp) => (
                        <div
                          key={sp.id}
                          className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700/60"
                        >
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold overflow-hidden">
                            {sp.photoUrl ? (
                              <img src={sp.photoUrl} alt={sp.name} className="w-full h-full object-cover" />
                            ) : (
                              sp.name.charAt(0)
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-900 dark:text-white">
                              {sp.name}
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1 py-0.2 rounded">
                              {sp.role}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tags */}
                  {session.tags && session.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {session.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 self-end md:self-start">
                  <button
                    type="button"
                    onClick={() => handleOpenEditSession(session)}
                    className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                    title="Edit Session"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionToDelete(session)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition"
                    title="Delete Session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Session Create / Edit Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                {editingSession ? 'Edit Conference Session' : 'Schedule New Session'}
              </h3>
              <button
                type="button"
                onClick={() => setShowSessionModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSession} className="p-6 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Session Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inaugural Plenary & Presidential Address"
                  value={sessionForm.title}
                  onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Abstract / Session Overview
                </label>
                <textarea
                  rows={2}
                  placeholder="Key topics, lecture outline, or workshop deliverables..."
                  value={sessionForm.description}
                  onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Track Allocation
                  </label>
                  <select
                    value={sessionForm.trackId}
                    onChange={(e) => handleTrackChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">No Track (General Session)</option>
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.roomName ? `(${t.roomName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Room / Hall Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hall A, Main Auditorium"
                    value={sessionForm.room}
                    onChange={(e) => setSessionForm({ ...sessionForm, room: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Session Date
                  </label>
                  <input
                    type="date"
                    required
                    value={sessionForm.sessionDate}
                    onChange={(e) => setSessionForm({ ...sessionForm, sessionDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={sessionForm.startTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={sessionForm.endTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Faculty & Speaker Assignment */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  Assign Speakers & Roles
                </label>
                {eventSpeakers.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No speakers added to event yet. Add speakers in the Speaker Directory to assign them to sessions.
                  </p>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800/40">
                    {eventSpeakers.map((sp) => {
                      const selected = sessionForm.selectedSpeakers.find((s) => s.speakerId === sp.id);
                      return (
                        <div
                          key={sp.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60"
                        >
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-900 dark:text-white">
                            <input
                              type="checkbox"
                              checked={Boolean(selected)}
                              onChange={() => handleToggleSpeakerInSession(sp.id)}
                              className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span>{sp.name}</span>
                            {sp.company && (
                              <span className="text-[11px] text-slate-400">({sp.company})</span>
                            )}
                          </label>

                          {selected && (
                            <select
                              value={selected.role}
                              onChange={(e) => handleSpeakerRoleChange(sp.id, e.target.value)}
                              className="px-2 py-0.5 text-[11px] rounded bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-semibold text-blue-600 dark:text-blue-400 uppercase"
                            >
                              <option value="keynote">Keynote</option>
                              <option value="speaker">Speaker</option>
                              <option value="panelist">Panelist</option>
                              <option value="moderator">Moderator</option>
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tags Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Session Tags
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. CME, Surgery, Pediatrics"
                    value={sessionForm.tagInput}
                    onChange={(e) => setSessionForm({ ...sessionForm, tagInput: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 transition"
                  >
                    Add
                  </button>
                </div>
                {sessionForm.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {sessionForm.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 text-[11px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full"
                      >
                        #{t}
                        <button type="button" onClick={() => handleRemoveTag(t)}>
                          <X className="w-3 h-3 hover:text-red-500" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
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
                  {editingSession ? 'Save Changes' : 'Schedule Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tracks & Rooms Management Modal */}
      {showTrackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-500" />
                Event Tracks & Stage Rooms
              </h3>
              <button
                type="button"
                onClick={() => setShowTrackModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Existing Tracks List */}
            <div className="my-4 max-h-52 overflow-y-auto space-y-2">
              {tracks.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">
                  No tracks configured. Add tracks below to organize concurrent sessions.
                </p>
              ) : (
                tracks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: t.color }} />
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white">{t.name}</h5>
                        <p className="text-[11px] text-slate-500">
                          {t.roomName || 'Unassigned Hall'} • {t.capacity} seats capacity
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditTrack(t)}
                        className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrackToDelete(t)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add / Edit Track Sub-Form */}
            <form onSubmit={handleSubmitTrack} className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {editingTrack ? 'Edit Track' : 'Create New Track'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Track Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Track 1: Surgical"
                    value={trackForm.name}
                    onChange={(e) => setTrackForm({ ...trackForm, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Room / Hall Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Auditorium A"
                    value={trackForm.roomName}
                    onChange={(e) => setTrackForm({ ...trackForm, roomName: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Seating Capacity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={trackForm.capacity}
                    onChange={(e) => setTrackForm({ ...trackForm, capacity: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Badge Color
                  </label>
                  <input
                    type="color"
                    value={trackForm.color}
                    onChange={(e) => setTrackForm({ ...trackForm, color: e.target.value })}
                    className="w-full h-8 rounded-xl bg-transparent cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                {editingTrack && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTrack(null);
                      setTrackForm({ name: '', roomName: '', capacity: 100, color: '#3B82F6', displayOrder: 0 });
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
                >
                  {editingTrack ? 'Update Track' : 'Add Track'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Session ConfirmDialog */}
      <ConfirmDialog
        isOpen={Boolean(sessionToDelete)}
        title="Delete Conference Session"
        description={`Are you sure you want to delete session '${sessionToDelete?.title}'? This will remove its schedule slot and speaker assignments.`}
        confirmText="Delete Session"
        variant="destructive"
        loading={submitting}
        onConfirm={handleDeleteSession}
        onCancel={() => setSessionToDelete(null)}
      />

      {/* Delete Track ConfirmDialog */}
      <ConfirmDialog
        isOpen={Boolean(trackToDelete)}
        title="Delete Conference Track"
        description={`Are you sure you want to delete track '${trackToDelete?.name}'? Sessions assigned to this track will remain but become unassigned.`}
        confirmText="Delete Track"
        variant="destructive"
        loading={submitting}
        onConfirm={handleDeleteTrack}
        onCancel={() => setTrackToDelete(null)}
      />
    </div>
  );
}
