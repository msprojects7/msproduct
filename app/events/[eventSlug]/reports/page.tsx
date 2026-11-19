'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useToast } from '@/app/components/ui/Toast';
import BackButton from '@/app/components/ui/BackButton';
import {
  BarChart3,
  Users,
  UserCheck,
  UserX,
  Clock,
  Calendar,
  Download,
  Search,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Activity,
  Sparkles,
  Printer,
  Shield,
  Layers,
} from 'lucide-react';

interface ReportSummary {
  totalAttendees: number;
  checkedIn: number;
  checkedOut: number;
  notCheckedIn: number;
  attendanceRate: number;
  spotRegistrations: number;
  preRegistrations: number;
  paidCount: number;
  pendingCount: number;
  complimentaryCount: number;
  totalScans: number;
  checkInScans: number;
  checkOutScans: number;
  badgesPrinted: number;
}

interface CategoryBreakdown {
  category: string;
  count: number;
  checkedIn: number;
  checkedOut: number;
  percentage: number;
  attendanceRate: number;
}

interface TypeBreakdown {
  type: string;
  label: string;
  count: number;
  percentage: number;
}

interface PaymentBreakdown {
  status: string;
  count: number;
  percentage: number;
}

interface DailyRegTrend {
  date: string;
  count: number;
}

interface DailyAttendanceTrend {
  date: string;
  checkIns: number;
  checkOuts: number;
}

interface ActivityScan {
  id: string;
  action: string;
  scannedAt: string;
  staffUserId: string;
  deviceInfo?: string | null;
  attendeeName: string;
  registrationNumber: string;
}

interface ActivityAudit {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  userId: string;
  createdAt: string;
}

interface AttendeeRow {
  id: string;
  registrationNumber: string;
  name: string;
  category: string;
  phoneNumber?: string | null;
  email?: string | null;
  paymentStatus: string;
  registrationType: string;
  attendanceStatus: string;
  createdAt: string;
}

export default function ReportsAnalyticsPage() {
  const params = useParams();
  const eventSlug = params.eventSlug as string;
  const { toast } = useToast();

  // Event Context State
  const [eventData, setEventData] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [organization, setOrganization] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [effectiveRole, setEffectiveRole] = useState<string>('');
  const [canExport, setCanExport] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'analytics' | 'roster' | 'activity'>('analytics');

  // Filter States
  const [preset, setPreset] = useState<'all' | 'today' | '7d' | '30d' | 'custom'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [regTypeFilter, setRegTypeFilter] = useState('all');
  const [attendanceFilter, setAttendanceFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Report Data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [typeBreakdown, setTypeBreakdown] = useState<TypeBreakdown[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown[]>([]);
  const [dailyRegTrends, setDailyRegTrends] = useState<DailyRegTrend[]>([]);
  const [dailyAttendanceTrends, setDailyAttendanceTrends] = useState<DailyAttendanceTrend[]>([]);
  const [activityScans, setActivityScans] = useState<ActivityScan[]>([]);
  const [activityAudits, setActivityAudits] = useState<ActivityAudit[]>([]);

  // Attendee Roster (for Tab 2)
  const [rosterAttendees, setRosterAttendees] = useState<AttendeeRow[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterPage, setRosterPage] = useState(1);
  const [rosterTotalPages, setRosterTotalPages] = useState(1);
  const [rosterTotalCount, setRosterTotalCount] = useState(0);

  // Export State
  const [exportingFormat, setExportingFormat] = useState<'csv' | 'xlsx' | 'pdf' | null>(null);
  const [exportNotice, setExportNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 1. Initial Load: Event info & permissions
  useEffect(() => {
    async function fetchEventDetails() {
      try {
        const res = await fetch(`/api/events/${eventSlug}`);
        if (!res.ok) throw new Error('Failed to load event details');
        const data = await res.json();
        setEventData(data.event);
        setOrganization(data.organization);
        setEffectiveRole(data.effectiveRole);

        // Check export eligibility
        const allowedExportRoles = ['org_owner', 'org_admin', 'event_manager'];
        setCanExport(allowedExportRoles.includes(data.effectiveRole));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error loading event');
      }
    }
    if (eventSlug) fetchEventDetails();
  }, [eventSlug]);

  // 2. Fetch Report Analytics
  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      if (preset !== 'all') q.set('preset', preset);
      if (preset === 'custom') {
        if (fromDate) q.set('from', fromDate);
        if (toDate) q.set('to', toDate);
      }
      if (categoryFilter !== 'all') q.set('category', categoryFilter);
      if (regTypeFilter !== 'all') q.set('registrationType', regTypeFilter);
      if (attendanceFilter !== 'all') q.set('attendanceStatus', attendanceFilter);
      if (paymentFilter !== 'all') q.set('paymentStatus', paymentFilter);

      const res = await fetch(`/api/events/${eventSlug}/reports?${q.toString()}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to fetch analytics');
      }

      const data = await res.json();
      setSummary(data.summary);
      setCategoryBreakdown(data.categoryBreakdown || []);
      setTypeBreakdown(data.registrationTypeBreakdown || []);
      setPaymentBreakdown(data.paymentStatusBreakdown || []);
      setDailyRegTrends(data.dailyRegistrationTrends || []);
      setDailyAttendanceTrends(data.dailyAttendanceTrends || []);
      setActivityScans(data.recentActivity?.scans || []);
      setActivityAudits(data.recentActivity?.audits || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading reports data');
    } finally {
      setLoading(false);
    }
  }, [eventSlug, preset, fromDate, toDate, categoryFilter, regTypeFilter, attendanceFilter, paymentFilter]);

  useEffect(() => {
    if (eventSlug) {
      loadReports();
    }
  }, [loadReports, eventSlug]);

  // 3. Fetch Roster Table when Tab 2 is active
  const loadRoster = useCallback(async () => {
    if (activeTab !== 'roster') return;
    setRosterLoading(true);
    try {
      const q = new URLSearchParams({
        page: String(rosterPage),
        pageSize: '25',
      });
      if (rosterSearch) q.set('search', rosterSearch);
      if (categoryFilter !== 'all') q.set('category', categoryFilter);
      if (regTypeFilter !== 'all') q.set('registrationType', regTypeFilter);
      if (attendanceFilter !== 'all') q.set('attendanceStatus', attendanceFilter);
      if (paymentFilter !== 'all') q.set('paymentStatus', paymentFilter);

      const res = await fetch(`/api/events/${eventSlug}/attendees?${q.toString()}`);
      if (!res.ok) throw new Error('Failed to load attendees roster');
      const data = await res.json();
      setRosterAttendees(data.attendees || []);
      setRosterTotalCount(data.pagination?.totalCount || 0);
      setRosterTotalPages(data.pagination?.totalPages || 1);
    } catch {
      setRosterAttendees([]);
    } finally {
      setRosterLoading(false);
    }
  }, [activeTab, eventSlug, rosterPage, rosterSearch, categoryFilter, regTypeFilter, attendanceFilter, paymentFilter]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  // 4. Handle Export
  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    if (exportingFormat) return; // Prevent duplicate clicks
    if (!canExport) {
      const msg = 'You do not have permission to export attendee data.';
      setExportNotice({
        type: 'error',
        message: msg,
      });
      toast.error(msg);
      return;
    }

    setExportingFormat(format);
    setExportNotice(null);
    toast.info(`Preparing ${format.toUpperCase()} export...`);

    try {
      const q = new URLSearchParams({ format });
      if (preset !== 'all') q.set('preset', preset);
      if (preset === 'custom') {
        if (fromDate) q.set('from', fromDate);
        if (toDate) q.set('to', toDate);
      }
      if (categoryFilter !== 'all') q.set('category', categoryFilter);
      if (regTypeFilter !== 'all') q.set('registrationType', regTypeFilter);
      if (attendanceFilter !== 'all') q.set('attendanceStatus', attendanceFilter);
      if (paymentFilter !== 'all') q.set('paymentStatus', paymentFilter);
      if (rosterSearch) q.set('search', rosterSearch);

      const exportUrl = `/api/events/${eventSlug}/reports/export?${q.toString()}`;
      const res = await fetch(exportUrl);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const errorMsg = errJson.error || `Export failed with status ${res.status}`;
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }

      // Download file blob
      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition');
      let filename = `attendees-${eventSlug}.${format}`;
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      const successMsg = `Successfully generated and downloaded ${filename}`;
      setExportNotice({
        type: 'success',
        message: successMsg,
      });
      toast.success(successMsg);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Export failed';
      setExportNotice({
        type: 'error',
        message: errorMsg,
      });
      toast.error(errorMsg);
    } finally {
      setExportingFormat(null);
    }
  };

  const handleResetFilters = () => {
    setPreset('all');
    setFromDate('');
    setToDate('');
    setCategoryFilter('all');
    setRegTypeFilter('all');
    setAttendanceFilter('all');
    setPaymentFilter('all');
    setRosterSearch('');
    setRosterPage(1);
  };

  return (
    <div className="pb-16 font-sans">
      {/* Top Action Bar with Top-Left Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-slate-200 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <BackButton
              href={`/events/${eventSlug}`}
              label={`Back to ${eventData?.name || 'Event'}`}
            />
          </div>
          <div className="flex items-center gap-2">
            {effectiveRole && (
              <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20 capitalize">
                {effectiveRole.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Alerts / Error Notices */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#991b1b' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{error}</span>
          </div>
        )}

        {exportNotice && (
          <div style={{
            background: exportNotice.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${exportNotice.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: exportNotice.type === 'success' ? '#065f46' : '#991b1b'
          }}>
            {exportNotice.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{exportNotice.message}</span>
          </div>
        )}

        {/* Action Header & Date Filter Bar */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white m-0">Event Analytics &amp; Reports</h2>
            </div>

            {/* Export Toolbar */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={loadReports}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition shadow-xs hover:scale-[1.02] active:scale-[0.98]"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>

              {canExport && (
                <>
                  <button
                    type="button"
                    onClick={() => handleExport('csv')}
                    disabled={exportingFormat !== null}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {exportingFormat === 'csv' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    Export CSV
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExport('xlsx')}
                    disabled={exportingFormat !== null}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {exportingFormat === 'xlsx' ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                    Export Excel (.xlsx)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExport('pdf')}
                    disabled={exportingFormat !== null}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {exportingFormat === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                    Export PDF
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Date Range & Preset Selector */}
          <div className="flex items-center flex-wrap gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar size={15} /> Timeframe:
            </span>

            {(['all', 'today', '7d', '30d', 'custom'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPreset(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  preset === p
                    ? 'border border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                    : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {p === 'all' && 'All Time'}
                {p === 'today' && 'Today'}
                {p === '7d' && 'Last 7 Days'}
                {p === '30d' && 'Last 30 Days'}
                {p === 'custom' && 'Custom Date'}
              </button>
            ))}

            {preset === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>
            )}

            {/* Quick Filters */}
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="all">All Categories</option>
                <option value="Delegate">Delegate</option>
                <option value="Faculty">Faculty</option>
                <option value="VIP">VIP</option>
                <option value="Student">Student</option>
                <option value="Speaker">Speaker</option>
                <option value="Organizing Committee">Organizing Committee</option>
              </select>

              <select
                value={attendanceFilter}
                onChange={(e) => setAttendanceFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="all">All Attendance</option>
                <option value="checked_in">Checked In</option>
                <option value="checked_out">Checked Out</option>
                <option value="not_checked_in">Not Checked In</option>
              </select>

              <select
                value={regTypeFilter}
                onChange={(e) => setRegTypeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="all">All Reg Types</option>
                <option value="pre_registered">Pre-Registered</option>
                <option value="spot">Spot Registration</option>
              </select>

              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 bg-transparent border-0 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* 6 Summary Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {/* Total Attendees */}
          <div className="glass-panel p-5 rounded-xl border border-slate-200 dark:border-slate-800/80">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Attendees</span>
              <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Users size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {loading ? '...' : (summary?.totalAttendees ?? 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Pre-reg: {summary?.preRegistrations ?? 0} | Spot: {summary?.spotRegistrations ?? 0}
            </div>
          </div>

          {/* Checked In */}
          <div className="glass-panel p-5 rounded-xl border border-slate-200 dark:border-slate-800/80">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Checked In</span>
              <div className="w-7 h-7 rounded-md bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <UserCheck size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
              {loading ? '...' : (summary?.checkedIn ?? 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {summary && summary.totalAttendees > 0
                ? `${((summary.checkedIn / summary.totalAttendees) * 100).toFixed(1)}% of total`
                : '0% of total'}
            </div>
          </div>

          {/* Checked Out */}
          <div className="glass-panel p-5 rounded-xl border border-slate-200 dark:border-slate-800/80">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Checked Out</span>
              <div className="w-7 h-7 rounded-md bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Clock size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
              {loading ? '...' : (summary?.checkedOut ?? 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {summary && summary.totalAttendees > 0
                ? `${((summary.checkedOut / summary.totalAttendees) * 100).toFixed(1)}% of total`
                : '0% of total'}
            </div>
          </div>

          {/* Not Checked In */}
          <div className="glass-panel p-5 rounded-xl border border-slate-200 dark:border-slate-800/80">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Not Checked In</span>
              <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                <UserX size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-2">
              {loading ? '...' : (summary?.notCheckedIn ?? 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {summary && summary.totalAttendees > 0
                ? `${((summary.notCheckedIn / summary.totalAttendees) * 100).toFixed(1)}% remaining`
                : '0% remaining'}
            </div>
          </div>

          {/* Attendance Rate */}
          <div className="glass-panel p-5 rounded-xl border border-slate-200 dark:border-slate-800/80">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Attendance Rate</span>
              <div className="w-7 h-7 rounded-md bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Activity size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
              {loading ? '...' : `${summary?.attendanceRate ?? 0}%`}
            </div>
            {/* Mini Progress Bar */}
            <div className="w-full h-1.5 bg-purple-100 dark:bg-purple-950/60 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-purple-600 dark:bg-purple-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, summary?.attendanceRate ?? 0))}%` }}
              />
            </div>
          </div>

          {/* Desk Ops Summary */}
          <div className="glass-panel p-5 rounded-xl border border-slate-200 dark:border-slate-800/80">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">Desk Operations</span>
              <div className="w-7 h-7 rounded-md bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 dark:text-sky-400">
                <Sparkles size={16} />
              </div>
            </div>
            <div className="text-lg font-bold text-sky-600 dark:text-sky-400 mt-2">
              {loading ? '...' : `${summary?.badgesPrinted ?? 0} Badges`}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
              {summary?.totalScans ?? 0} scans ({summary?.checkInScans ?? 0} in / {summary?.checkOutScans ?? 0} out)
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 mb-5 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-0 text-sm font-semibold cursor-pointer transition-colors ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 size={16} />
            Analytics &amp; Distributions
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-0 text-sm font-semibold cursor-pointer transition-colors ${
              activeTab === 'roster'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Users size={16} />
            Attendee Roster ({summary?.totalAttendees ?? 0})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-0 text-sm font-semibold cursor-pointer transition-colors ${
              activeTab === 'activity'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Clock size={16} />
            Staff Activity Stream
          </button>
        </div>

        {/* TAB 1: ANALYTICS & DISTRIBUTIONS */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {/* Category Breakdown Card */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white m-0">
                  Category Distribution &amp; Turnout
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {categoryBreakdown.length} Categories
                </span>
              </div>

              {categoryBreakdown.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                  No category records available for this filter.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {categoryBreakdown.map((item) => (
                    <div key={item.category}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{item.category}</span>
                        <span className="text-slate-500 dark:text-slate-400">
                          <strong>{item.count}</strong> attendees ({item.percentage}%) • Check-in: <strong>{item.attendanceRate}%</strong>
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, item.percentage)}%`,
                            background: item.attendanceRate > 75 ? '#10b981' : item.attendanceRate > 40 ? '#3b82f6' : '#f59e0b',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Registration Type & Payment Breakdown */}
            <div className="flex flex-col gap-6">
              {/* Registration Method Breakdown */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 m-0">
                  Registration Method Breakdown
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {typeBreakdown.map((t) => (
                    <div key={t.type} className="p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t.label}</div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-white my-1">
                        {t.count}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        {t.percentage}% of all registrations
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Status Breakdown */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 m-0">
                  Payment Status Distribution
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {paymentBreakdown.map((p) => (
                    <div key={p.status} className="p-3 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-center">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{p.status}</div>
                      <div className="text-xl font-bold text-slate-900 dark:text-white my-1">
                        {p.count}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {p.percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Daily Trends (Registration vs Attendance Timeline) */}
            <div className="col-span-full glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white m-0">
                  Daily Activity Timeline (UTC)
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">Registrations vs Attendance Scans</span>
              </div>

              {dailyRegTrends.length === 0 && dailyAttendanceTrends.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                  No historical daily trends found for this time period.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold">
                        <th className="text-left px-4 py-3">Date (UTC)</th>
                        <th className="text-right px-4 py-3">New Registrations</th>
                        <th className="text-right px-4 py-3">Check-In Scans</th>
                        <th className="text-right px-4 py-3">Check-Out Scans</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Merge dates */}
                      {Array.from(new Set([
                        ...dailyRegTrends.map((d) => d.date),
                        ...dailyAttendanceTrends.map((d) => d.date),
                      ])).sort().map((dateStr) => {
                        const reg = dailyRegTrends.find((d) => d.date === dateStr)?.count || 0;
                        const scan = dailyAttendanceTrends.find((d) => d.date === dateStr);
                        const checkIns = scan?.checkIns || 0;
                        const checkOuts = scan?.checkOuts || 0;

                        return (
                          <tr key={dateStr} className="border-b border-slate-200 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{dateStr}</td>
                            <td className="text-right px-4 py-3 text-blue-600 dark:text-blue-400 font-semibold">{reg}</td>
                            <td className="text-right px-4 py-3 text-emerald-600 dark:text-emerald-400 font-semibold">{checkIns}</td>
                            <td className="text-right px-4 py-3 text-amber-600 dark:text-amber-400 font-semibold">{checkOuts}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}        {/* TAB 2: ATTENDEE ROSTER TABLE */}
        {activeTab === 'roster' && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs mb-6">
            {/* Search and Table Controls */}
            <div className="flex justify-between items-center mb-5 gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[240px]">
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or registration number..."
                  value={rosterSearch}
                  onChange={(e) => {
                    setRosterSearch(e.target.value);
                    setRosterPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                Showing {rosterAttendees.length} of {rosterTotalCount} attendees
              </div>
            </div>

            {/* Table */}
            {rosterLoading ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <Loader2 size={24} className="animate-spin mx-auto mb-2 text-blue-500" />
                <div className="text-sm">Loading attendee records...</div>
              </div>
            ) : rosterAttendees.length === 0 ? (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                <Users size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">No attendees found</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Try broadening your search or filter settings.</div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                      <th className="text-left px-4 py-3 text-slate-600 dark:text-slate-400 font-semibold">Reg Number</th>
                      <th className="text-left px-4 py-3 text-slate-600 dark:text-slate-400 font-semibold">Name</th>
                      <th className="text-left px-4 py-3 text-slate-600 dark:text-slate-400 font-semibold">Category</th>
                      <th className="text-left px-4 py-3 text-slate-600 dark:text-slate-400 font-semibold">Type</th>
                      <th className="text-left px-4 py-3 text-slate-600 dark:text-slate-400 font-semibold">Payment</th>
                      <th className="text-left px-4 py-3 text-slate-600 dark:text-slate-400 font-semibold">Attendance</th>
                      <th className="text-left px-4 py-3 text-slate-600 dark:text-slate-400 font-semibold">Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rosterAttendees.map((att) => (
                      <tr key={att.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-blue-600 dark:text-blue-400">
                          {att.registrationNumber}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {att.name}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                            {att.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 capitalize">
                          {att.registrationType === 'spot' ? 'Spot' : 'Pre-Reg'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                            att.paymentStatus === 'Paid'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : att.paymentStatus === 'Pending'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}>
                            {att.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                            att.attendanceStatus === 'checked_in'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : att.attendanceStatus === 'checked_out'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}>
                            {att.attendanceStatus === 'checked_in'
                              ? 'Checked In'
                              : att.attendanceStatus === 'checked_out'
                              ? 'Checked Out'
                              : 'Not Checked In'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                          {new Date(att.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {rosterTotalPages > 1 && (
              <div className="flex justify-between items-center mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Page {rosterPage} of {rosterTotalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRosterPage((p) => Math.max(1, p - 1))}
                    disabled={rosterPage <= 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setRosterPage((p) => Math.min(rosterTotalPages, p + 1))}
                    disabled={rosterPage >= rosterTotalPages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STAFF ACTIVITY STREAM */}
        {activeTab === 'activity' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scans Stream */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Recent Attendance Scans
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">Latest 15 scan operations</span>
              </div>

              {activityScans.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                  No recent scans recorded.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {activityScans.map((scan) => (
                    <div key={scan.id} className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white text-xs">
                          {scan.attendeeName}{' '}
                          <span className="text-slate-500 dark:text-slate-400 font-normal font-mono">
                            ({scan.registrationNumber})
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Staff: <code className="text-[11px] font-mono bg-slate-100 dark:bg-slate-700/60 px-1 py-0.5 rounded">{scan.staffUserId.slice(0, 12)}...</code> • {new Date(scan.scannedAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                        scan.action === 'check_in'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      }`}>
                        {scan.action === 'check_in' ? 'Check In' : 'Check Out'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit Logs Stream */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Recent Staff Audit Trail
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">Authoritative audit events</span>
              </div>

              {activityAudits.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                  No audit events recorded for this event.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {activityAudits.map((audit) => (
                    <div key={audit.id} className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          {audit.action}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {new Date(audit.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Entity: <strong className="text-slate-700 dark:text-slate-300">{audit.entityType}</strong> {audit.entityId ? `(${audit.entityId.slice(0, 8)})` : ''} • Staff: <code className="text-[11px] font-mono bg-slate-100 dark:bg-slate-700/60 px-1 py-0.5 rounded">{audit.userId.slice(0, 10)}...</code>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
