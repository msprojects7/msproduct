'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  QrCode,
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  Award,
  Download,
  Save,
  Send,
  AlertCircle,
  Loader2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import QRCode from 'qrcode';

interface PortalData {
  attendee: {
    id: string;
    name: string;
    registrationNumber: string;
    email: string | null;
    phoneNumber: string | null;
    category: string;
    foodPreference: string;
    attendanceStatus: string;
    paymentStatus: string;
    qrToken: string;
    createdAt: string;
  };
  event: {
    id: string;
    name: string;
    slug: string;
    startDate: string | null;
    endDate: string | null;
    venue: string | null;
    status: string;
  };
  preferences: {
    preferredName?: string | null;
    badgeOrganization?: string | null;
    dietaryRequirements?: string | null;
    accessibilityNeeds?: string | null;
  };
  ticket: {
    ticketToken: string;
    pdfDownloadUrl: string;
    status: string;
  } | null;
  attendedSessions: Array<{
    id: string;
    sessionTitle: string | null;
    startTime: string | null;
    endTime: string | null;
    room: string | null;
    scannedAt: string;
  }>;
  certificates: Array<{
    id: string;
    certificateReference: string;
    status: string;
    issuedAt: string;
  }>;
}

export default function AttendeePortalPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventSlug = params.slug as string;
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PortalData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Email request state if no token
  const [requestEmail, setRequestEmail] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [directMagicLink, setDirectMagicLink] = useState<string | null>(null);

  // Profile preferences state
  const [preferredName, setPreferredName] = useState('');
  const [badgeOrganization, setBadgeOrganization] = useState('');
  const [dietaryRequirements, setDietaryRequirements] = useState('');
  const [accessibilityNeeds, setAccessibilityNeeds] = useState('');
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      loadPortalData(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadPortalData = async (accessToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/attendee/portal?token=${accessToken}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to load attendee portal');
      }

      setData(json);
      setPreferredName(json.preferences?.preferredName || json.attendee.name);
      setBadgeOrganization(json.preferences?.badgeOrganization || '');
      setDietaryRequirements(json.preferences?.dietaryRequirements || json.attendee.foodPreference || '');
      setAccessibilityNeeds(json.preferences?.accessibilityNeeds || '');

      // Generate QR code data URL
      const qrTarget = JSON.stringify({
        token: json.attendee.qrToken,
        regNo: json.attendee.registrationNumber,
        event: json.event.slug,
      });
      const url = await QRCode.toDataURL(qrTarget, { width: 240, margin: 1 });
      setQrDataUrl(url);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Error connecting to attendee portal');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestEmail) return;
    setRequestLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/public/attendee/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: requestEmail, eventSlug }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Request failed');

      setRequestSent(true);
      if (json.portalUrl) {
        setDirectMagicLink(json.portalUrl);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Failed to send magic link');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingPrefs(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/public/attendee/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          preferredName,
          badgeOrganization,
          dietaryRequirements,
          accessibilityNeeds,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save');

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Failed to update preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  // If no token provided: render Magic Link Access Request form
  if (!token && !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-blue-500/30">
              <User className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Attendee Self-Service Portal</h1>
            <p className="text-xs text-slate-400 mt-1">
              Enter the email address you registered with to access your pass, ticket download, preferences, and certificates.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {requestSent ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-semibold text-white">Access Link Prepared</h2>
              <p className="text-xs text-slate-400">
                If an attendee registration matches <strong className="text-white">{requestEmail}</strong>, your portal access link is ready:
              </p>
              {directMagicLink && (
                <div className="pt-2">
                  <Link
                    href={directMagicLink}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition"
                  >
                    <span>Enter My Portal</span>
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleRequestMagicLink} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  required
                  value={requestEmail}
                  onChange={(e) => setRequestEmail(e.target.value)}
                  placeholder="doctor@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={requestLoading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/25"
              >
                {requestLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Send My Portal Access Link</span>
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <Link
              href={`/p/${eventSlug}`}
              className="text-xs text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5"
            >
              <span>Back to Event Microsite</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-xs text-slate-400">Loading your attendee pass...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <h2 className="text-base font-bold text-white">Access Denied or Expired</h2>
          <p className="text-xs text-slate-400">{error || 'Unable to authorize portal access.'}</p>
          <Link
            href={`/p/${eventSlug}/attendee`}
            className="inline-block px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl"
          >
            Request New Magic Link
          </Link>
        </div>
      </div>
    );
  }

  const { attendee, event, ticket, attendedSessions, certificates } = data;
  const isCheckedIn = attendee.attendanceStatus === 'checked_in';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-wider">
                Attendee Self-Service Portal
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  isCheckedIn
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {isCheckedIn ? 'Checked In' : 'Registered / Not Checked In'}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">{event.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
              {event.venue && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {event.venue}
                </span>
              )}
              {event.startDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {new Date(event.startDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <Link
            href={`/p/${event.slug}`}
            className="self-start sm:self-auto px-3.5 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition border border-slate-700/60"
          >
            Visit Event Site
          </Link>
        </div>

        {/* Grid: Left Pass & QR Card, Right Details & Forms */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Digital Badge Pass Card */}
          <div className="md:col-span-1 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl text-center space-y-4 flex flex-col items-center">
            <div className="w-full flex justify-between items-center text-[10px] text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800 pb-2">
              <span>Official Pass</span>
              <span className="text-blue-400 font-bold">{attendee.registrationNumber}</span>
            </div>

            {/* QR Code */}
            <div className="p-3 bg-white rounded-2xl shadow-inner border border-slate-300">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Badge QR Code" className="w-44 h-44 object-contain" />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center bg-slate-100 text-slate-400">
                  <QrCode className="w-12 h-12" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-bold text-white tracking-tight">{preferredName || attendee.name}</h2>
              {badgeOrganization && (
                <p className="text-xs text-slate-400 font-medium">{badgeOrganization}</p>
              )}
              <div className="pt-2">
                <span className="inline-block px-2.5 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[11px] font-bold rounded-lg uppercase tracking-wide">
                  {attendee.category}
                </span>
              </div>
            </div>

            {ticket?.pdfDownloadUrl && (
              <div className="w-full pt-2">
                <a
                  href={ticket.pdfDownloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Ticket</span>
                </a>
              </div>
            )}
          </div>

          {/* Right Two Columns: Preferences & Operations Modules */}
          <div className="md:col-span-2 space-y-6">
            {/* Preferences Form */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-blue-600/20 text-blue-400 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Badge & Registration Preferences</h3>
                </div>
                {saveSuccess && (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
              </div>

              <form onSubmit={handleSavePreferences} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Preferred Badge Display Name
                    </label>
                    <input
                      type="text"
                      value={preferredName}
                      onChange={(e) => setPreferredName(e.target.value)}
                      placeholder={attendee.name}
                      className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Organization / Affiliation
                    </label>
                    <input
                      type="text"
                      value={badgeOrganization}
                      onChange={(e) => setBadgeOrganization(e.target.value)}
                      placeholder="e.g. Apollo Hospitals / AIIMS"
                      className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Dietary Requirements
                    </label>
                    <input
                      type="text"
                      value={dietaryRequirements}
                      onChange={(e) => setDietaryRequirements(e.target.value)}
                      placeholder="e.g. Vegetarian, Jain, Vegan, None"
                      className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Accessibility Needs
                    </label>
                    <input
                      type="text"
                      value={accessibilityNeeds}
                      onChange={(e) => setAccessibilityNeeds(e.target.value)}
                      placeholder="e.g. Wheelchair assistance"
                      className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingPrefs}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                  >
                    {savingPrefs ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Update Preferences</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Verified Certificates Section */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Verified Certificates</h3>
                  <p className="text-[11px] text-slate-400">Official digital credentials earned for attendance</p>
                </div>
              </div>

              {certificates && certificates.length > 0 ? (
                <div className="space-y-2">
                  {certificates.map((cert) => (
                    <div
                      key={cert.id}
                      className="flex items-center justify-between p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-2xl"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white tracking-tight">{cert.certificateReference}</span>
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase">
                            Valid
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Issued on {new Date(cert.issuedAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/p/${event.slug}/certificate/${cert.certificateReference}`}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-semibold rounded-xl transition"
                        >
                          Verify
                        </Link>
                        <a
                          href={`/api/public/certificates/verify/${cert.certificateReference}?download=true`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-semibold rounded-xl flex items-center gap-1 transition"
                        >
                          <Download className="w-3 h-3" />
                          <span>PDF</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-slate-800 rounded-2xl">
                  <Award className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No certificates issued yet.</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Certificates are typically issued after onsite check-in or session completion.
                  </p>
                </div>
              )}
            </div>

            {/* Session Attendance Timeline */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Session Attendance Record</h3>
                  <p className="text-[11px] text-slate-400">Live verified multi-track hall scans</p>
                </div>
              </div>

              {attendedSessions && attendedSessions.length > 0 ? (
                <div className="space-y-2">
                  {attendedSessions.map((sess) => (
                    <div
                      key={sess.id}
                      className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-semibold text-white">{sess.sessionTitle || 'Conference Session'}</p>
                        <p className="text-[10px] text-slate-400">
                          {sess.room ? `Room: ${sess.room} • ` : ''}
                          Scanned at {new Date(sess.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Attended
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No session scans logged yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
