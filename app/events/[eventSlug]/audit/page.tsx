'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import { EmptyState } from '@/app/components/ui/EmptyState';
import { Modal } from '@/app/components/ui/Modal';
import BackButton from '@/app/components/ui/BackButton';
import {
  ShieldAlert,
  ArrowLeft,
  Clock,
  Filter,
  Search,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  User,
  Activity,
} from 'lucide-react';

interface AuditEventItem {
  id: string;
  organizationId: string;
  eventId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export default function EventAuditLogPage() {
  const params = useParams();
  const eventSlug = params.eventSlug as string;

  const [events, setEvents] = useState<AuditEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [actionFilter, setActionFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');

  // Selected event modal
  const [selectedEvent, setSelectedEvent] = useState<AuditEventItem | null>(null);

  const fetchAuditLogs = async (targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      q.set('page', String(targetPage));
      q.set('pageSize', '20');
      if (actionFilter !== 'all') q.set('action', actionFilter);
      if (searchInput.trim()) q.set('search', searchInput.trim());

      const res = await fetch(`/api/events/${eventSlug}/audit?${q.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to load audit logs.');
      }
      const data = await res.json();
      setEvents(data.events || []);
      setPage(data.pagination?.page || 1);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching audit trail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs(1);
  }, [actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAuditLogs(1);
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('delete') || action.includes('destroy') || action.includes('revoke')) return 'danger';
    if (action.includes('create') || action.includes('add') || action.includes('imported')) return 'success';
    if (action.includes('update') || action.includes('settings')) return 'warning';
    if (action.includes('print')) return 'info';
    if (action.includes('scan') || action.includes('check_in')) return 'navy';
    return 'neutral';
  };

  return (
    <div className="pb-16 font-sans">
      {/* Top Action Bar with Top-Left Back Button */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-slate-200 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <BackButton
              href={`/events/${eventSlug}`}
              label="Back to Event"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchAuditLogs(page)}
              loading={loading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-5">
        {/* Filter bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search action or details..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Search
            </Button>
          </form>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Action:
            </span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Actions</option>
              <option value="attendee.created">Attendee Created</option>
              <option value="attendee.imported_batch">Attendees Batch Imported</option>
              <option value="attendee.updated">Attendee Updated</option>
              <option value="attendee.deleted">Attendee Deleted</option>
              <option value="badge.printed">Badge Printed</option>
              <option value="event.settings_updated">Settings Updated</option>
              <option value="staff.assigned">Staff Assigned</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Audit Records ({totalCount} Total)
              </h2>
            </div>
          </div>

          <div className="p-0">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-600 mx-auto mb-2" />
                Loading audit trail entries...
              </div>
            ) : error ? (
              <div className="p-8 text-center text-xs text-rose-600">
                {error}
                <div className="mt-2">
                  <Button variant="secondary" size="sm" onClick={() => fetchAuditLogs(page)}>
                    Retry
                  </Button>
                </div>
              </div>
            ) : events.length === 0 ? (
              <EmptyState
                icon={<Activity className="w-6 h-6" />}
                title="No Audit Records Found"
                description="No operations match your selected filter criteria for this event."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Timestamp</th>
                      <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Action</th>
                      <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Entity</th>
                      <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Actor (User ID)</th>
                      <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">IP Address</th>
                      <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {events.map((evt) => (
                      <tr key={evt.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(evt.createdAt).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={getActionBadgeVariant(evt.action)} size="sm">
                            {evt.action}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                          {evt.entityType}
                          {evt.entityId && (
                            <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px] block truncate max-w-[120px]">
                              {evt.entityId}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                          <span className="inline-flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {evt.userId.slice(0, 16)}...
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400 dark:text-slate-500 text-[11px]">
                          {evt.ipAddress || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedEvent(evt)}
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                          >
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50/50">
                <span className="text-xs text-slate-500">
                  Page {page} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => fetchAuditLogs(page - 1)}
                    leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => fetchAuditLogs(page + 1)}
                    rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Audit Detail Modal */}
      <Modal
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title="Audit Log Event Details"
        description={`Record ID: ${selectedEvent?.id || ''}`}
        maxWidth="lg"
      >
        {selectedEvent && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 block font-medium">Action</span>
                <span className="font-semibold text-slate-900">{selectedEvent.action}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Timestamp</span>
                <span className="font-mono text-slate-800">
                  {new Date(selectedEvent.createdAt).toISOString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Entity Type</span>
                <span className="text-slate-800">{selectedEvent.entityType}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Entity ID</span>
                <span className="font-mono text-slate-800">{selectedEvent.entityId || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Actor User ID</span>
                <span className="font-mono text-slate-800">{selectedEvent.userId}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Client IP</span>
                <span className="font-mono text-slate-800">{selectedEvent.ipAddress || 'Not recorded'}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-600 font-semibold block mb-1">Payload Details (JSON)</span>
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg overflow-x-auto text-[11px] font-mono max-h-60">
                {JSON.stringify(selectedEvent.details, null, 2) || '{}'}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
