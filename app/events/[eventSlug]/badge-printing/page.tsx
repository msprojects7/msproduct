'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Printer,
  CheckCircle,
  Search,
  RotateCcw,
  Eye,
  Layers,
  Palette,
  Loader2,
  Plus,
} from 'lucide-react';

interface QueueAttendee {
  id: string;
  name: string;
  registrationNumber: string;
  category: string;
  email?: string | null;
  foodPreference?: string;
  attendanceStatus: string;
  paymentStatus: string;
  qrToken: string;
  printCount: number;
  hasPrinted: boolean;
  lastPrintedAt?: string | null;
}

export default function BadgePrintingOperationsPage() {
  const params = useParams();
  const eventSlug = params.eventSlug as string;

  const [loading, setLoading] = useState(true);
  const [attendees, setAttendees] = useState<QueueAttendee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unprinted' | 'printed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activePreviewAttendee, setActivePreviewAttendee] = useState<QueueAttendee | null>(null);

  // Reprint modal
  const [reprintModalOpen, setReprintModalOpen] = useState(false);
  const [reprintTarget, setReprintTarget] = useState<QueueAttendee | null>(null);
  const [reprintReason, setReprintReason] = useState('');
  const [actionProcessing, setActionProcessing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      let url = `/api/events/${eventSlug}/badges/queue?`;
      if (searchQuery.trim()) url += `search=${encodeURIComponent(searchQuery.trim())}&`;
      if (statusFilter !== 'all') url += `status=${statusFilter}&`;
      if (categoryFilter !== 'all') url += `category=${encodeURIComponent(categoryFilter)}&`;

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setAttendees(json.attendees || []);

        // Derive unique categories
        const cats = Array.from(new Set(json.attendees.map((a: QueueAttendee) => a.category).filter(Boolean))) as string[];
        setCategories(cats);

        if (!activePreviewAttendee && json.attendees.length > 0) {
          setActivePreviewAttendee(json.attendees[0]);
        }
      }
    } catch (err) {
      console.error('Queue load error:', err);
    } finally {
      setLoading(false);
    }
  }, [eventSlug, searchQuery, statusFilter, categoryFilter, activePreviewAttendee]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Selection handlers
  const toggleSelect = (id: string) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) updated.delete(id);
    else updated.add(id);
    setSelectedIds(updated);
  };

  const selectAll = () => {
    if (selectedIds.size === attendees.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(attendees.map((a) => a.id)));
    }
  };

  // Execute Print
  const handlePrintBadge = async (attendee: QueueAttendee) => {
    if (attendee.hasPrinted) {
      // Must prompt for reprint reason
      setReprintTarget(attendee);
      setReprintReason('');
      setReprintModalOpen(true);
      return;
    }

    setActionProcessing(true);
    try {
      const res = await fetch(`/api/events/${eventSlug}/badges/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendeeIds: [attendee.id],
          printType: 'single',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record print');

      setNotification({
        type: 'success',
        message: `Badge print recorded for ${attendee.name}`,
      });
      fetchQueue();
    } catch (err: unknown) {
      const error = err as Error;
      setNotification({ type: 'error', message: error.message || 'Print error' });
    } finally {
      setActionProcessing(false);
    }
  };

  // Submit Reprint
  const handleConfirmReprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reprintTarget || !reprintReason.trim()) return;

    setActionProcessing(true);
    try {
      const res = await fetch(`/api/events/${eventSlug}/badges/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendeeIds: [reprintTarget.id],
          printType: 'reprint',
          reason: reprintReason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reprint failed');

      setReprintModalOpen(false);
      setReprintTarget(null);
      setReprintReason('');
      setNotification({
        type: 'success',
        message: `Reprint recorded: reason logged in audit trail.`,
      });
      fetchQueue();
    } catch (err: unknown) {
      const error = err as Error;
      setNotification({ type: 'error', message: error.message || 'Reprint error' });
    } finally {
      setActionProcessing(false);
    }
  };

  // Batch Print Selected
  const handleBatchPrint = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setActionProcessing(true);
    try {
      const res = await fetch(`/api/events/${eventSlug}/badges/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendeeIds: ids,
          printType: 'batch',
          reason: 'Batch printing desk dispatch',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Batch print failed');

      setNotification({
        type: 'success',
        message: `Batch recorded for ${data.count} attendees`,
      });
      setSelectedIds(new Set());
      fetchQueue();
    } catch (err: unknown) {
      const error = err as Error;
      setNotification({ type: 'error', message: error.message || 'Batch print error' });
    } finally {
      setActionProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <Printer className="w-6 h-6 text-blue-400" />
              <span>Badge Printing Operations Desk</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Onsite badge queue, single click issuance, reprint justification tracking, and bulk printing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/events/${eventSlug}/badges/designer`}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/25 transition border border-indigo-400/30"
            >
              <Palette className="w-4 h-4" />
              <span>Badge Designer</span>
            </Link>

            {selectedIds.size > 0 && (
              <button
                onClick={handleBatchPrint}
                disabled={actionProcessing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition"
              >
                <Layers className="w-4 h-4" />
                <span>Print Selected ({selectedIds.size})</span>
              </button>
            )}
          </div>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div
            className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-xs ${notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
              }`}
          >
            <span className="font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white ml-2 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="p-4 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search attendee by name, reg #, email..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Print Status Filter */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${statusFilter === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('unprinted')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${statusFilter === 'unprinted' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                Unprinted
              </button>
              <button
                onClick={() => setStatusFilter('printed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${statusFilter === 'printed' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                Printed
              </button>
            </div>
          </div>

          {/* Category Dropdown */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Layout: Table on left, Preview on right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs dark:shadow-xl">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={attendees.length > 0 && selectedIds.size === attendees.length}
                  onChange={selectAll}
                  className="rounded border-slate-700 text-blue-600 focus:ring-0"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select All ({attendees.length} records)
                </span>
              </div>

              <span className="text-[11px] text-slate-500 font-mono">
                {selectedIds.size} selected
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <span className="text-xs">Loading badge printing queue...</span>
              </div>
            ) : attendees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
                      <th className="py-2.5 px-3 w-8"></th>
                      <th className="py-2.5 px-3">Attendee</th>
                      <th className="py-2.5 px-3">Reg #</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Print Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {attendees.map((att) => {
                      const isSelected = selectedIds.has(att.id);
                      return (
                        <tr
                          key={att.id}
                          onClick={() => setActivePreviewAttendee(att)}
                          className={`cursor-pointer transition ${activePreviewAttendee?.id === att.id
                            ? 'bg-blue-50/80 dark:bg-blue-900/30'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                        >
                          <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(att.id)}
                              className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-0"
                            />
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{att.name}</td>
                          <td className="py-2.5 px-3 text-blue-600 dark:text-blue-400 font-mono text-[11px] font-bold">
                            {att.registrationNumber}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-medium">{att.category}</td>
                          <td className="py-2.5 px-3">
                            {att.hasPrinted ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                <CheckCircle className="w-3 h-3" />
                                <span>Printed ({att.printCount})</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                Unprinted
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handlePrintBadge(att)}
                              disabled={actionProcessing}
                              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${att.hasPrinted
                                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                                }`}
                            >
                              {att.hasPrinted ? 'Reprint...' : 'Print Badge'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400">
                  <Printer className="w-6 h-6 text-blue-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">No Attendees in Current Queue</h4>
                  <p className="text-xs text-slate-400 max-w-sm">
                    {statusFilter !== 'all'
                      ? `No attendees found with filter "${statusFilter}". Try switching to "All" or clearing the search.`
                      : 'No attendees registered yet for this event.'}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  {statusFilter !== 'all' && (
                    <button
                      onClick={() => setStatusFilter('all')}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
                    >
                      Show All Attendees
                    </button>
                  )}
                  <Link
                    href={`/events/${eventSlug}/spot-registration`}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Spot Register Walk-In</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Badge Preview Pane */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col items-center shadow-xs dark:shadow-xl">
            <div className="w-full flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Live Badge Preview</h3>
              </div>
              {activePreviewAttendee && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {activePreviewAttendee.registrationNumber}
                </span>
              )}
            </div>

            {activePreviewAttendee ? (
              <div className="w-full flex flex-col items-center space-y-4">
                {/* Visual badge card */}
                <div className="w-full max-w-[280px] bg-white text-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-300 text-center space-y-3">
                  <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500">
                    MS Backstage
                  </div>
                  <h4 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                    {activePreviewAttendee.name}
                  </h4>
                  <div className="inline-block px-3 py-1 bg-blue-600 text-white font-extrabold text-xs rounded-md uppercase tracking-wider">
                    {activePreviewAttendee.category}
                  </div>
                  <div className="pt-2 text-xs font-mono font-bold text-slate-700">
                    {activePreviewAttendee.registrationNumber}
                  </div>
                </div>

                <div className="w-full space-y-2 pt-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200 dark:border-slate-800/80">
                    <span className="font-medium text-slate-600 dark:text-slate-400">Print Status:</span>
                    <span className="font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-300 dark:border-slate-700">
                      {activePreviewAttendee.hasPrinted ? `Printed (${activePreviewAttendee.printCount}x)` : 'Not Printed'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200 dark:border-slate-800/80">
                    <span className="font-medium text-slate-600 dark:text-slate-400">Attendance:</span>
                    <span className="font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-300 dark:border-slate-700 capitalize">
                      {activePreviewAttendee.attendanceStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handlePrintBadge(activePreviewAttendee)}
                  disabled={actionProcessing}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>{activePreviewAttendee.hasPrinted ? 'Reprint Badge...' : 'Print This Badge'}</span>
                </button>
              </div>
            ) : (
              <div className="w-full flex-1 flex flex-col items-center justify-center py-12 text-center text-slate-400 space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                  <Printer className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-300">Select an attendee from queue</p>
                <p className="text-[11px] text-slate-500 max-w-[200px]">
                  Click any attendee row to inspect live badge layout and execute single-pass printing.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Reprint Reason Modal */}
      {reprintModalOpen && reprintTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-amber-600/40 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-amber-400">
              <RotateCcw className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Record Badge Reprint</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Badge for <strong className="text-slate-900 dark:text-white">{reprintTarget.name}</strong> was already printed{' '}
              <span className="text-amber-400 font-bold">{reprintTarget.printCount} time(s)</span>. Please document the reason for reprinting for audit and consumables tracking.
            </p>

            <form onSubmit={handleConfirmReprint} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Reprint Reason (Mandatory)
                </label>
                <textarea
                  required
                  rows={3}
                  value={reprintReason}
                  onChange={(e) => setReprintReason(e.target.value)}
                  placeholder="e.g. Lost badge at venue; Name spelling corrected; Paper tear in printer"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReprintModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionProcessing || !reprintReason.trim()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                >
                  {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Confirm Reprint</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
