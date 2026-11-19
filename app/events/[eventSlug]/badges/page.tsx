'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Printer,
  Search,
  Eye,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  LayoutTemplate,
  Sliders,
  Filter,
  CheckSquare,
  Square,
  X,
  FileStack,
  ArrowRight,
  Shield,
} from 'lucide-react';
import BadgeRenderer, {
  BadgeLayoutData,
  AttendeeBadgeData,
  BadgeElementStyle,
} from '@/app/components/BadgeRenderer';
import { useToast } from '@/app/components/ui/Toast';
import { BackButton } from '@/app/components/ui/BackButton';

interface AttendeeRow {
  id: string;
  name: string;
  registrationNumber: string;
  category: string;
  qrToken: string;
  attendanceStatus: string;
  paymentStatus: string;
  foodPreference?: string;
  medicalCouncilNumber?: string;
  registrationType?: string;
}

interface PrintHistoryEntry {
  id: string;
  printType: string;
  reason?: string;
  printedAt: string;
  staffUserId: string;
}

export default function BadgesDeskPage() {
  const params = useParams();
  const eventSlug = params.eventSlug as string;
  const { toast } = useToast();

  // Data State
  const [loading, setLoading] = useState(true);
  const [attendees, setAttendees] = useState<AttendeeRow[]>([]);
  const [eventData, setEventData] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [layout, setLayout] = useState<BadgeLayoutData | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Print Queue & Selections
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewAttendee, setPreviewAttendee] = useState<AttendeeRow | null>(null);
  const [reprintAttendee, setReprintAttendee] = useState<AttendeeRow | null>(null);
  const [reprintReason, setReprintReason] = useState('Badge Damaged');
  const [customReason, setCustomReason] = useState('');

  // Active Print Action State
  const [printAttendees, setPrintAttendees] = useState<AttendeeRow[]>([]);
  const [printType, setPrintType] = useState<'single' | 'reprint' | 'batch'>('single');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [recordingPrint, setRecordingPrint] = useState(false);

  // Debounce Search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Load Attendees & Layout
  const loadData = useCallback(async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      // 1. Fetch layout
      const layoutRes = await fetch(`/api/events/${eventSlug}/badges/layout`);
      if (layoutRes.ok) {
        const layoutData = await layoutRes.json();
        setLayout(layoutData.layout);
      }

      // 2. Fetch Attendees
      let url = `/api/events/${eventSlug}/attendees?pageSize=100`;
      if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
      if (categoryFilter !== 'all') url += `&category=${encodeURIComponent(categoryFilter)}`;

      const attRes = await fetch(url);
      if (!attRes.ok) {
        const err = await attRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load attendees');
      }
      const attData = await attRes.json();
      setAttendees(attData.attendees || []);
      setTotalCount(attData.pagination?.totalCount || (attData.attendees || []).length);
      if (attData.event) {
        setEventData(attData.event);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading badge roster';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  }, [eventSlug, debouncedSearch, categoryFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Print Action
  const triggerPrint = async (
    targetAttendees: AttendeeRow[],
    type: 'single' | 'reprint' | 'batch',
    reasonText?: string
  ) => {
    if (targetAttendees.length === 0) return;

    setRecordingPrint(true);
    setPrintAttendees(targetAttendees);
    setPrintType(type);

    // Record print event on backend
    try {
      const res = await fetch(`/api/events/${eventSlug}/badges/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendeeIds: targetAttendees.map((a) => a.id),
          printType: type,
          reason: reasonText || null,
          deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 200) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to record print events on server');
      }

      // Clear preview/reprint modals
      setPreviewAttendee(null);
      setReprintAttendee(null);

      // Trigger browser print dialog after render tick
      setTimeout(() => {
        window.print();
        setRecordingPrint(false);
        setStatusMessage({
          type: 'success',
          text: `Successfully initiated print for ${targetAttendees.length} badge${
            targetAttendees.length === 1 ? '' : 's'
          } (Print log recorded).`,
        });
        setTimeout(() => setStatusMessage(null), 5000);
      }, 350);
    } catch (err: unknown) {
      setRecordingPrint(false);
      const msg = err instanceof Error ? err.message : 'Error processing badge print';
      setStatusMessage({ type: 'error', text: msg });
    }
  };

  // Check if attendee was printed, then decide single vs reprint
  const handlePrintClick = async (attendee: AttendeeRow) => {
    try {
      const checkRes = await fetch(`/api/events/${eventSlug}/badges/print?attendeeId=${attendee.id}`);
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.hasPrinted) {
          // Open reprint modal to collect reason
          setReprintAttendee(attendee);
          setReprintReason('Badge Damaged');
          setCustomReason('');
          return;
        }
      }
    } catch {
      // Fallback to single print if check fails
    }
    triggerPrint([attendee], 'single');
  };

  // Submit Reprint
  const handleReprintSubmit = () => {
    if (!reprintAttendee) return;
    const finalReason = reprintReason === 'Other' ? customReason.trim() : reprintReason;
    if (!finalReason) {
      toast.warning('Please specify a reprint reason.');
      return;
    }
    triggerPrint([reprintAttendee], 'reprint', finalReason);
  };

  // Batch Print Selected
  const handleBatchPrintSelected = () => {
    const selected = attendees.filter((a) => selectedIds.has(a.id));
    if (selected.length === 0) return;
    triggerPrint(selected, 'batch');
  };

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === attendees.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(attendees.map((a) => a.id)));
    }
  };

  const DEFAULT_CATEGORY_FALLBACK: BadgeElementStyle = {
    top: 4.55,
    left: 0.25,
    width: 3.5,
    fontSize: 0.2,
    color: '#475569',
    visible: true,
    textAlign: 'center',
  };

  const DEFAULT_BADGE_DESK_LAYOUT: BadgeLayoutData = {
    badgeWidthIn: 4,
    badgeHeightIn: 6,
    backgroundImageUrl: '/Empty_Sample.png',
    showBackground: true,
    registration: { top: 2.1, left: 0.25, width: 3.5, fontSize: 0.22, color: '#cf252b', visible: true, textAlign: 'center' },
    qr: { top: 2.42, left: 1.35, size: 1.3 },
    name: { top: 3.85, left: 0.25, width: 3.5, fontSize: 0.25, color: '#0f172a', visible: true, textAlign: 'center' },
    category: DEFAULT_CATEGORY_FALLBACK,
  };

  const activeLayout: BadgeLayoutData = {
    ...DEFAULT_BADGE_DESK_LAYOUT,
    ...(layout || {}),
    registration: { ...DEFAULT_BADGE_DESK_LAYOUT.registration, ...(layout?.registration || {}) },
    qr: { ...DEFAULT_BADGE_DESK_LAYOUT.qr, ...(layout?.qr || {}) },
    name: { ...DEFAULT_BADGE_DESK_LAYOUT.name, ...(layout?.name || {}) },
    category: { ...DEFAULT_CATEGORY_FALLBACK, ...(layout?.category || {}) },
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Targeted Print Container for Window.print() */}
      <div className="hidden print:block fixed inset-0 z-50 bg-white">
        <style>{`
          @page {
            size: ${activeLayout.badgeWidthIn}in ${activeLayout.badgeHeightIn}in;
            margin: 0;
          }
          @media print {
            body * {
              visibility: hidden;
            }
            #badges-print-mount, #badges-print-mount * {
              visibility: visible;
            }
            #badges-print-mount {
              position: absolute;
              left: 0;
              top: 0;
              margin: 0;
            }
            .badge-print-sheet {
              page-break-after: always;
              break-after: page;
            }
          }
        `}</style>
        <div id="badges-print-mount">
          {printAttendees.map((att) => (
            <div key={att.id} className="badge-print-sheet">
              <BadgeRenderer attendee={att} layout={activeLayout} isPrint={true} />
            </div>
          ))}
        </div>
      </div>

      {/* Top Action Bar with Top-Left Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-slate-200 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <BackButton href={`/events/${eventSlug}`} label="Back to Event" />
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/events/${eventSlug}/badges/designer`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-600 dark:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 rounded-xl border border-teal-500/20 transition shadow-xs"
            >
              <LayoutTemplate className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" />
              Open Badge Designer
            </Link>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6 print:hidden">
        {/* Status Notification */}
        {statusMessage && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            )}
            <span className="font-semibold">{statusMessage.text}</span>
          </div>
        )}

        {/* Action Header & Bulk Toolbar */}
        <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Printer className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                Badge Generation &amp; Print Desk
              </h1>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              {selectedIds.size > 0 && (
                <button
                  onClick={handleBatchPrintSelected}
                  disabled={recordingPrint}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-full shadow-md shadow-teal-600/20 transition hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Selected ({selectedIds.size})
                </button>
              )}
              <button
                onClick={() => loadData()}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                title="Refresh badge roster"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or registration number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 text-xs rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Categories</option>
                <option value="Delegate">Delegates</option>
                <option value="Faculty">Faculty</option>
                <option value="Student">Postgraduates / Students</option>
                <option value="Exhibitor">Exhibitors</option>
              </select>
            </div>
          </div>
        </div>

        {/* Badge Roster Table */}
        <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectAll}
                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1.5 font-medium"
              >
                {selectedIds.size === attendees.length && attendees.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-teal-600" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                Select All ({attendees.length})
              </button>
            </div>
            <span>Total Attendees: {totalCount}</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600 mx-auto" />
              <p>Loading badge roster...</p>
            </div>
          ) : attendees.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No attendees found matching the query.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 w-10"></th>
                    <th className="py-3 px-4">Reg #</th>
                    <th className="py-3 px-4">Attendee Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {attendees.map((attendee) => {
                    const isSelected = selectedIds.has(attendee.id);
                    return (
                      <tr key={attendee.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(attendee.id)}
                            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                          />
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-teal-700 dark:text-teal-400">
                          {attendee.registrationNumber}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {attendee.name}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {attendee.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 uppercase text-[10px] font-bold">
                          {attendee.registrationType === 'spot' ? 'Spot' : 'Pre-Reg'}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => setPreviewAttendee(attendee)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            Preview
                          </button>
                          <button
                            onClick={() => handlePrintClick(attendee)}
                            disabled={recordingPrint}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 transition shadow-xs hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Print
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* INDIVIDUAL BADGE PREVIEW MODAL */}
      {previewAttendee && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Badge Live Preview</h3>
                <p className="text-xs text-slate-500">{previewAttendee.name} • {previewAttendee.registrationNumber}</p>
              </div>
              <button
                onClick={() => setPreviewAttendee(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Centered Rendered Badge */}
            <div className="flex justify-center items-center py-4 bg-slate-100/60 rounded-xl border border-slate-200">
              <BadgeRenderer
                attendee={previewAttendee}
                layout={activeLayout}
                scale={0.65}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setPreviewAttendee(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Close
              </button>
              <button
                onClick={() => handlePrintClick(previewAttendee)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 flex items-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                Print Badge Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPRINT REASON MODAL */}
      {reprintAttendee && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">Badge Reprint Audit Reason</h3>
              </div>
              <button
                onClick={() => setReprintAttendee(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Attendee <strong className="text-slate-900">{reprintAttendee.name}</strong> ({reprintAttendee.registrationNumber}) has previously received a printed badge. Please state the reprint reason for audit logging.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Reprint
                </label>
                <select
                  value={reprintReason}
                  onChange={(e) => setReprintReason(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Badge Damaged">Badge Damaged / Torn</option>
                  <option value="Badge Lost">Badge Lost by Delegate</option>
                  <option value="Name/Category Correction">Name or Category Correction</option>
                  <option value="Printer Jam / Quality Defect">Printer Jam / Ink Smudge</option>
                  <option value="Other">Other Reason (Specify below)</option>
                </select>
              </div>

              {reprintReason === 'Other' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specific Reason
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter detailed reprint explanation..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setReprintAttendee(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReprintSubmit}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 flex items-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                Confirm &amp; Reprint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
