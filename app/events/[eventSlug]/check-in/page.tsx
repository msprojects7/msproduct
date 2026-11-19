'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  XCircle,
  Search,
  QrCode,
  ShieldAlert,
  Clock,
  Monitor,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface CheckInStats {
  totalAttendees: number;
  checkedIn: number;
  notCheckedIn: number;
  checkInPercentage: number;
}

interface AttendeeRow {
  id: string;
  name: string;
  registrationNumber: string;
  category: string;
  email?: string | null;
  phoneNumber?: string | null;
  attendanceStatus: string;
  paymentStatus: string;
  foodPreference: string;
  qrToken: string;
}

interface ScanEventRow {
  id: string;
  action: string;
  scannedAt: string;
  staffUserId: string;
  deviceInfo?: string | null;
  attendeeName: string;
  registrationNumber: string;
  category: string;
  attendanceStatus: string;
}

export default function CheckInOperationsPage() {
  const params = useParams();
  const eventSlug = params.eventSlug as string;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CheckInStats | null>(null);
  const [recentScans, setRecentScans] = useState<ScanEventRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AttendeeRow[]>([]);
  const [searching, setSearching] = useState(false);

  // Fast scan input (barcode / camera gun)
  const [scanInput, setScanInput] = useState('');
  const [actionProcessing, setActionProcessing] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
    attendee?: AttendeeRow | null;
  } | null>(null);

  // Override modal
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideTarget, setOverrideTarget] = useState<AttendeeRow | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [submittingOverride, setSubmittingOverride] = useState(false);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventSlug}/check-in`);
      if (res.ok) {
        const json = await res.json();
        setStats(json.stats);
        setRecentScans(json.recentScans || []);
      }
    } catch (err) {
      console.error('Error loading checkin overview:', err);
    } finally {
      setLoading(false);
    }
  }, [eventSlug]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Handle Search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/events/${eventSlug}/check-in?search=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const json = await res.json();
        setSearchResults(json.attendees || []);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  // Execute Check-in
  const executeCheckIn = async (attendee: AttendeeRow, action: 'check_in' | 'check_out' = 'check_in') => {
    setActionProcessing(true);
    setNotification(null);
    try {
      const res = await fetch(`/api/events/${eventSlug}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendeeId: attendee.id,
          registrationNumber: attendee.registrationNumber,
          action,
        }),
      });
      const json = await res.json();

      if (res.status === 409) {
        // Already checked in — offer override
        setNotification({
          type: 'warning',
          message: `${attendee.name} is already checked in.`,
          attendee,
        });
        setOverrideTarget(attendee);
      } else if (!res.ok) {
        setNotification({
          type: 'error',
          message: json.message || json.error || 'Failed to process check-in',
        });
      } else {
        setNotification({
          type: 'success',
          message: `${attendee.name} (${attendee.registrationNumber}) successfully ${action === 'check_in' ? 'checked in' : 'checked out'}!`,
          attendee: json.attendee,
        });
        fetchOverview();
        if (searchQuery) handleSearch(searchQuery);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setNotification({ type: 'error', message: error.message || 'Network error' });
    } finally {
      setActionProcessing(false);
    }
  };

  // Fast Barcode Scan handler
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    setActionProcessing(true);
    setNotification(null);
    try {
      const res = await fetch(`/api/events/${eventSlug}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrToken: scanInput.trim(),
          action: 'check_in',
          deviceInfo: 'Organizer Check-in Gun',
        }),
      });
      const json = await res.json();

      if (res.status === 409) {
        setNotification({
          type: 'warning',
          message: `${json.attendee?.name || 'Attendee'} is already checked in.`,
          attendee: json.attendee,
        });
        if (json.attendee) setOverrideTarget(json.attendee);
      } else if (!res.ok) {
        setNotification({
          type: 'error',
          message: json.message || json.error || 'Check-in failed',
        });
      } else {
        setNotification({
          type: 'success',
          message: `${json.attendee?.name} checked in successfully!`,
          attendee: json.attendee,
        });
        fetchOverview();
      }
      setScanInput('');
    } catch (err: unknown) {
      const error = err as Error;
      setNotification({ type: 'error', message: error.message || 'Network error' });
    } finally {
      setActionProcessing(false);
    }
  };

  // Submit Override
  const handleConfirmOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideTarget || !overrideReason.trim()) return;
    setSubmittingOverride(true);
    try {
      const res = await fetch(`/api/events/${eventSlug}/check-in/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendeeId: overrideTarget.id,
          registrationNumber: overrideTarget.registrationNumber,
          reason: overrideReason.trim(),
          action: 'check_in',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error || 'Override failed');

      setOverrideModalOpen(false);
      setOverrideReason('');
      setOverrideTarget(null);
      setNotification({
        type: 'success',
        message: `Override granted: ${overrideTarget.name} checked in with reason logged in audit trail.`,
      });
      fetchOverview();
      if (searchQuery) handleSearch(searchQuery);
    } catch (err: unknown) {
      const error = err as Error;
      setNotification({ type: 'error', message: error.message || 'Override error' });
    } finally {
      setSubmittingOverride(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header & Quick Links */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              <span>Onsite Check-In Operations Desk</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              High-throughput badge scanning, attendee lookup, duplicate prevention, and authorized overrides.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchOverview}
              disabled={loading}
              className="p-2 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition shadow-xs"
              title="Refresh Stats"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Real-Time KPI Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Confirmed</span>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{stats.totalAttendees}</p>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl shadow-xs">
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Checked In</span>
              <p className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-300 mt-1">{stats.checkedIn}</p>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl shadow-xs">
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Not Checked In</span>
              <p className="text-2xl font-extrabold text-amber-900 dark:text-amber-300 mt-1">{stats.notCheckedIn}</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-2xl shadow-xs">
              <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Turnout Rate</span>
              <p className="text-2xl font-extrabold text-blue-900 dark:text-blue-300 mt-1">{stats.checkInPercentage}%</p>
            </div>
          </div>
        )}

        {/* Notification Alert Banner */}
        {notification && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between text-xs transition ${
              notification.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-200'
                : notification.type === 'warning'
                ? 'bg-amber-950/60 border-amber-800/80 text-amber-200'
                : 'bg-red-950/60 border-red-800/80 text-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
              {notification.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
              {notification.type === 'error' && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
              <span className="font-medium">{notification.message}</span>
            </div>

            {notification.type === 'warning' && notification.attendee && (
              <button
                onClick={() => {
                  setOverrideTarget(notification.attendee || null);
                  setOverrideModalOpen(true);
                }}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-[11px] ml-4 shrink-0 transition"
              >
                Force Override Check-In
              </button>
            )}
          </div>
        )}

        {/* Rapid Gun Input & Live Attendee Search */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rapid Gun Input */}
          <div className="lg:col-span-1 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-bold text-white">Rapid Scanner Input</h2>
            </div>
            <p className="text-[11px] text-slate-400">
              Focus this input to accept hardware USB barcode scanners, handheld guns, or pasted QR payload tokens.
            </p>

            <form onSubmit={handleBarcodeSubmit} className="space-y-3">
              <input
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Scan QR or Reg Number..."
                autoFocus
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono tracking-wide"
              />

              <button
                type="submit"
                disabled={actionProcessing || !scanInput.trim()}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition"
              >
                {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                <span>Process Fast Scan</span>
              </button>
            </form>
          </div>

          {/* Attendee Live Search */}
          <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-400" />
                <h2 className="text-sm font-bold text-white">Manual Attendee Lookup</h2>
              </div>
              {searching && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Type Attendee Name, Reg No (e.g. CONF-DEL-0100), or Email..."
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Results Table */}
            {searchResults.length > 0 && (
              <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
                {searchResults.map((att) => {
                  const checked = att.attendanceStatus === 'checked_in';
                  return (
                    <div
                      key={att.id}
                      className="p-3 bg-slate-900/90 hover:bg-slate-800/50 flex items-center justify-between gap-3 text-xs transition"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white truncate">{att.name}</span>
                          <span className="text-[10px] text-blue-400 font-mono font-semibold">
                            {att.registrationNumber}
                          </span>
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700 uppercase">
                            {att.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">
                          {att.email || 'No email'} • {att.foodPreference || 'Normal Food'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            checked
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {checked ? 'Checked In' : 'Not In'}
                        </span>

                        {!checked ? (
                          <button
                            onClick={() => executeCheckIn(att, 'check_in')}
                            disabled={actionProcessing}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] transition"
                          >
                            Check In
                          </button>
                        ) : (
                          <button
                            onClick={() => executeCheckIn(att, 'check_out')}
                            disabled={actionProcessing}
                            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-lg text-[11px] transition"
                          >
                            Check Out
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Scans Feed */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            <h2 className="text-sm font-bold text-white">Live Check-In Event Stream</h2>
          </div>

          {recentScans.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">Attendee</th>
                    <th className="py-2 px-3">Reg Number</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Action</th>
                    <th className="py-2 px-3">Device / Staff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentScans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                        {new Date(scan.scannedAt).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-3 font-semibold text-white">{scan.attendeeName}</td>
                      <td className="py-2 px-3 text-blue-400 font-mono">{scan.registrationNumber}</td>
                      <td className="py-2 px-3 text-slate-300">{scan.category}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            scan.action === 'check_in'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {scan.action}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-[10px] truncate max-w-xs">
                        {scan.deviceInfo || scan.staffUserId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic py-4">No scans recorded yet for this event.</p>
          )}
        </div>
      </main>

      {/* Override Reason Modal */}
      {overrideModalOpen && overrideTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-amber-600/40 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-amber-400">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Authorize Check-In Override</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Attendee <strong className="text-white">{overrideTarget.name}</strong> (
              <span className="text-blue-400 font-mono">{overrideTarget.registrationNumber}</span>) is already flagged as checked in. To force a check-in re-entry, provide a valid justification reason for the security audit log.
            </p>

            <form onSubmit={handleConfirmOverride} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Justification Reason (Mandatory)
                </label>
                <textarea
                  required
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. VIP badge lost and reprinted; Re-entry permitted by Event Director; Hardware desk sync error"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOverrideModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOverride || !overrideReason.trim()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                >
                  {submittingOverride ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Grant Override</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
