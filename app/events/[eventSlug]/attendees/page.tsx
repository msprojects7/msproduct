'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/app/components/ui/Toast';
import BackButton from '@/app/components/ui/BackButton';
import {
  Search,
  Plus,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Lock,
  Users,
  CheckSquare,
  Square,
  Loader2,
  Filter,
  UserPlus,
  QrCode,
  Printer,
  Upload,
} from 'lucide-react';

export interface Attendee {
  id: string;
  eventId: string;
  registrationNumber: string;
  name: string;
  category: string;
  phoneNumber: string | null;
  email: string | null;
  gender: string | null;
  medicalCouncilNumber: string | null;
  foodPreference: string;
  paymentStatus: string;
  registrationType: 'pre_registered' | 'spot';
  attendanceStatus: 'not_checked_in' | 'checked_in' | 'checked_out';
  qrToken: string;
  importBatchId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EventContextInfo {
  event: { id: string; name: string; slug: string; status: string };
  organization: { id: string; name: string; slug: string };
  effectiveRole: string;
}

const CATEGORY_OPTIONS = [
  'Faculty',
  'Delegate',
  'Student',
  'VIP',
  'Exhibitor',
  'Organizer',
  'General',
];

const FOOD_OPTIONS = [
  'Vegetarian',
  'Non-Vegetarian',
  'Jain Food',
  'Vegan',
  'Not Specified',
];

const PAYMENT_OPTIONS = ['Paid', 'Pending', 'Complimentary'];

export default function AttendeeManagementPage() {
  const router = useRouter();
  const params = useParams();
  const eventSlug = params?.eventSlug as string;

  // Event & Auth Context
  const [contextInfo, setContextInfo] = useState<EventContextInfo | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Attendees & Table State
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [attendanceFilter, setAttendanceFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [regTypeFilter, setRegTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal States
  const [viewingAttendee, setViewingAttendee] = useState<Attendee | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [editingAttendee, setEditingAttendee] = useState<Attendee | null>(null);
  const [deletingAttendee, setDeletingAttendee] = useState<Attendee | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Form Submissions State
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { toast: globalToast } = useToast();

  const setToast = useCallback(
    (t: { type: 'success' | 'error'; message: string } | null) => {
      if (!t) return;
      if (t.type === 'success') {
        globalToast.success(t.message);
      } else {
        globalToast.error(t.message);
      }
    },
    [globalToast]
  );

  // Register Form Data
  const [regName, setRegName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [regCategory, setRegCategory] = useState('Delegate');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regGender, setRegGender] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regMedicalNo, setRegMedicalNo] = useState('');
  const [regFood, setRegFood] = useState('Not Specified');
  const [regPayment, setRegPayment] = useState('Paid');
  const [regType, setRegType] = useState<'pre_registered' | 'spot'>('pre_registered');

  // Edit Form Data
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editMedicalNo, setEditMedicalNo] = useState('');
  const [editFood, setEditFood] = useState('');
  const [editPayment, setEditPayment] = useState('');
  const [editAttendance, setEditAttendance] = useState<'not_checked_in' | 'checked_in' | 'checked_out'>('not_checked_in');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Derived permissions from server role
  const permissions = useMemo(() => {
    const role = contextInfo?.effectiveRole || '';
    return {
      canCreate: ['org_owner', 'org_admin', 'event_manager', 'registration_staff'].includes(role),
      canUpdate: ['org_owner', 'org_admin', 'event_manager', 'registration_staff'].includes(role),
      canDelete: ['org_owner', 'org_admin', 'event_manager'].includes(role),
      canViewPii: ['org_owner', 'org_admin', 'event_manager', 'registration_staff'].includes(role),
      canManageStaff: ['org_owner', 'org_admin', 'event_manager'].includes(role),
    };
  }, [contextInfo?.effectiveRole]);

  // Load Event Context
  const loadEventContext = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventSlug}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/sign-in');
          return;
        }
        router.push('/dashboard');
        return;
      }
      const data = await res.json();
      setContextInfo({
        event: data.event,
        organization: data.organization,
        effectiveRole: data.effectiveRole,
      });
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to load event context' });
    } finally {
      setInitialLoading(false);
    }
  }, [eventSlug, router]);

  useEffect(() => {
    loadEventContext();
  }, [loadEventContext]);

  // Load Attendees List
  const fetchAttendees = useCallback(async () => {
    if (!contextInfo?.event?.id) return;
    setTableLoading(true);

    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (debouncedSearch) queryParams.set('search', debouncedSearch);
      if (categoryFilter !== 'all') queryParams.set('category', categoryFilter);
      if (attendanceFilter !== 'all') queryParams.set('attendanceStatus', attendanceFilter);
      if (paymentFilter !== 'all') queryParams.set('paymentStatus', paymentFilter);
      if (regTypeFilter !== 'all') queryParams.set('registrationType', regTypeFilter);

      const res = await fetch(`/api/events/${contextInfo.event.id}/attendees?${queryParams.toString()}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to load attendees');
      }

      const data = await res.json();
      setAttendees(data.attendees || []);
      setTotalCount(data.pagination?.totalCount || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Error loading attendees' });
    } finally {
      setTableLoading(false);
    }
  }, [
    contextInfo?.event?.id,
    page,
    pageSize,
    debouncedSearch,
    categoryFilter,
    attendanceFilter,
    paymentFilter,
    regTypeFilter,
  ]);

  useEffect(() => {
    if (contextInfo?.event?.id) {
      fetchAttendees();
    }
  }, [contextInfo?.event?.id, fetchAttendees]);

  // Clear all selections when page or filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, categoryFilter, attendanceFilter, paymentFilter, regTypeFilter, debouncedSearch]);

  // Row selection toggle
  const toggleSelectAttendee = (id: string) => {
    setSelectedIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  // Select all on page toggle
  const isAllOnPageSelected = useMemo(() => {
    if (attendees.length === 0) return false;
    return attendees.every((a) => selectedIds.has(a.id));
  }, [attendees, selectedIds]);

  const toggleSelectAllOnPage = () => {
    if (isAllOnPageSelected) {
      setSelectedIds((prev) => {
        const updated = new Set(prev);
        attendees.forEach((a) => updated.delete(a.id));
        return updated;
      });
    } else {
      setSelectedIds((prev) => {
        const updated = new Set(prev);
        attendees.forEach((a) => updated.add(a.id));
        return updated;
      });
    }
  };

  // Open Edit Modal
  const openEditModal = (attendee: Attendee) => {
    setEditingAttendee(attendee);
    setEditName(attendee.name);
    setEditCategory(attendee.category);
    setEditPhone(attendee.phoneNumber || '');
    setEditEmail(attendee.email || '');
    setEditGender(attendee.gender || '');
    setEditMedicalNo(attendee.medicalCouncilNumber || '');
    setEditFood(attendee.foodPreference || 'Not Specified');
    setEditPayment(attendee.paymentStatus || 'Paid');
    setEditAttendance(attendee.attendanceStatus);
    setFormError(null);
  };

  // Submit Register Form
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contextInfo?.event?.id) return;
    setFormError(null);
    setFormSubmitting(true);

    try {
      const payload = {
        name: regName.trim(),
        registrationNumber: regNumber.trim(),
        category: regCategory.trim() || 'Delegate',
        phoneNumber: regPhone.trim() || null,
        email: regEmail.trim() || null,
        gender: regGender.trim() || null,
        address: regAddress.trim() || null,
        medicalCouncilNumber: regMedicalNo.trim() || null,
        foodPreference: regFood,
        paymentStatus: regPayment,
        registrationType: regType,
      };

      const res = await fetch(`/api/events/${contextInfo.event.id}/attendees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setFormError(`Registration number '${regNumber.trim()}' already exists in this event.`);
        } else {
          setFormError(data.error || 'Failed to register attendee');
        }
        return;
      }

      setToast({ type: 'success', message: `Attendee ${data.attendee.name} registered successfully!` });
      setShowRegisterModal(false);
      // Reset form
      setRegName('');
      setRegNumber('');
      setRegPhone('');
      setRegEmail('');
      setRegAddress('');
      setRegMedicalNo('');
      fetchAttendees();
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Submit Edit Form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contextInfo?.event?.id || !editingAttendee) return;
    setFormError(null);
    setFormSubmitting(true);

    try {
      const payload = {
        name: editName.trim(),
        category: editCategory.trim(),
        phoneNumber: editPhone.trim() || null,
        email: editEmail.trim() || null,
        gender: editGender.trim() || null,
        medicalCouncilNumber: editMedicalNo.trim() || null,
        foodPreference: editFood,
        paymentStatus: editPayment,
        attendanceStatus: editAttendance,
      };

      const res = await fetch(`/api/events/${contextInfo.event.id}/attendees/${editingAttendee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to update attendee');
        return;
      }

      setToast({ type: 'success', message: `Attendee ${data.attendee.name} updated successfully!` });
      setEditingAttendee(null);
      fetchAttendees();
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Single Delete
  const handleConfirmSingleDelete = async () => {
    if (!contextInfo?.event?.id || !deletingAttendee) return;
    setFormSubmitting(true);

    try {
      const res = await fetch(`/api/events/${contextInfo.event.id}/attendees/${deletingAttendee.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete attendee');
      }

      setToast({ type: 'success', message: 'Attendee deleted successfully' });
      setDeletingAttendee(null);
      setSelectedIds((prev) => {
        const updated = new Set(prev);
        updated.delete(deletingAttendee.id);
        return updated;
      });
      fetchAttendees();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Error deleting attendee' });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Bulk Delete
  const handleConfirmBulkDelete = async () => {
    if (!contextInfo?.event?.id || selectedIds.size === 0) return;
    setFormSubmitting(true);

    try {
      const res = await fetch(`/api/events/${contextInfo.event.id}/attendees/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete selected attendees');
      }

      setToast({
        type: 'success',
        message: `Successfully deleted ${data.deletedCount} attendee(s).`,
      });
      setShowBulkDeleteModal(false);
      setSelectedIds(new Set());
      fetchAttendees();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Error deleting attendees' });
    } finally {
      setFormSubmitting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="py-20 flex items-center justify-center text-slate-400 text-xs gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
        Loading attendee directory...
      </div>
    );
  }

  if (!contextInfo) return null;

  return (
    <div className="pb-16">
      {/* Top Action Bar with Top-Left Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-slate-200 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <BackButton
              href={`/events/${contextInfo.event.slug}`}
              label={`Back to ${contextInfo.event.name}`}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11.5px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3.5 py-1 rounded-full border border-indigo-500/20 capitalize shadow-xs">
              Role: {contextInfo.effectiveRole.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Actions & Title Bar */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Attendees</h2>
          </div>
          <div className="flex gap-2.5 items-center flex-wrap">
            <button
              onClick={() => fetchAttendees()}
              title="Refresh Attendees"
              aria-label="Refresh Attendees List"
              className="p-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex items-center transition shadow-xs hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw size={16} className={tableLoading ? 'animate-spin' : ''} />
            </button>

            {permissions.canCreate && (
              <Link
                href={`/events/${contextInfo.event.slug}/import`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-bold shadow-md shadow-emerald-600/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Upload size={15} />
                Excel / CSV Import
              </Link>
            )}
            {permissions.canCreate && (
              <button
                onClick={() => {
                  setFormError(null);
                  setShowRegisterModal(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-bold shadow-md shadow-blue-600/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus size={15} />
                Register Attendee
              </button>
            )}
          </div>
        </div>

        {/* Search & Filters Card */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800/80 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[260px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, reg #, phone, email..."
                aria-label="Search attendees by name, reg number, phone, or email"
                className="w-full pl-9 pr-8 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 box-border"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0 bg-transparent border-0"
                  aria-label="Clear search query"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              aria-label="Filter by Category"
              className="px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">All Categories</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Attendance Status Filter */}
            <select
              value={attendanceFilter}
              onChange={(e) => { setAttendanceFilter(e.target.value); setPage(1); }}
              aria-label="Filter by Attendance Status"
              className="px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">All Attendance</option>
              <option value="not_checked_in">Not Checked In</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
            </select>

            {/* Payment Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
              aria-label="Filter by Payment Status"
              className="px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">All Payment</option>
              {PAYMENT_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* Registration Type Filter */}
            <select
              value={regTypeFilter}
              onChange={(e) => { setRegTypeFilter(e.target.value); setPage(1); }}
              aria-label="Filter by Registration Type"
              className="px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">All Types</option>
              <option value="pre_registered">Pre-Registered</option>
              <option value="spot">Spot Desk</option>
            </select>

            {/* Page Size Selector */}
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              aria-label="Items per page"
              className="px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Bar (when rows selected) */}
        {selectedIds.size > 0 && permissions.canDelete && (
          <div
            className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 p-3.5 rounded-xl flex justify-between items-center mb-4 transition-colors"
          >
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-sm font-semibold">
              <CheckSquare size={18} />
              <span>{selectedIds.size} attendee(s) selected</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedIds(new Set())}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-md text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
              >
                Deselect All
              </button>
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Trash2 size={14} />
                Delete Selected ({selectedIds.size})
              </button>
            </div>
          </div>
        )}

        {/* Attendees Table Card */}
        <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl mb-6">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800/80 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                  {permissions.canDelete && (
                    <th style={{ padding: '0.75rem 1rem', width: '40px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isAllOnPageSelected}
                        onChange={toggleSelectAllOnPage}
                        aria-label="Select all attendees on this page"
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                  )}
                  <th style={{ padding: '0.75rem 1.25rem' }}>Reg Number</th>
                  <th style={{ padding: '0.75rem 1.25rem' }}>Full Name</th>
                  <th style={{ padding: '0.75rem 1.25rem' }}>Category</th>
                  <th style={{ padding: '0.75rem 1.25rem' }}>Type</th>
                  <th style={{ padding: '0.75rem 1.25rem' }}>Attendance</th>
                  <th style={{ padding: '0.75rem 1.25rem' }}>Payment</th>
                  <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableLoading ? (
                  <tr>
                    <td colSpan={permissions.canDelete ? 8 : 7} style={{ padding: '3.5rem', textAlign: 'center', color: '#6b7280' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Loading attendee records...</span>
                      </div>
                    </td>
                  </tr>
                ) : attendees.length === 0 ? (
                  <tr>
                    <td colSpan={permissions.canDelete ? 8 : 7} style={{ padding: '4rem 1rem', textAlign: 'center', color: '#6b7280' }}>
                      <Users size={40} style={{ margin: '0 auto 0.75rem auto', color: '#cbd5e1' }} />
                      <div style={{ fontWeight: 600, color: '#374151', fontSize: '1rem', marginBottom: '0.25rem' }}>
                        No attendees found
                      </div>
                      <p style={{ margin: 0, fontSize: '0.875rem' }}>
                        {debouncedSearch || categoryFilter !== 'all' || attendanceFilter !== 'all' || paymentFilter !== 'all' || regTypeFilter !== 'all'
                          ? 'Try clearing search terms or selecting different filters.'
                          : 'Get started by registering delegates for this event.'}
                      </p>
                      {(debouncedSearch || categoryFilter !== 'all' || attendanceFilter !== 'all' || paymentFilter !== 'all' || regTypeFilter !== 'all') && (
                        <button
                          onClick={() => {
                            setSearch('');
                            setCategoryFilter('all');
                            setAttendanceFilter('all');
                            setPaymentFilter('all');
                            setRegTypeFilter('all');
                          }}
                          style={{ marginTop: '1rem', padding: '0.375rem 0.875rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}
                        >
                          Clear Filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  attendees.map((a) => {
                    const isSelected = selectedIds.has(a.id);
                    return (
                      <tr
                        key={a.id}
                        className={`border-b border-slate-200 dark:border-slate-800/80 transition-colors ${
                          isSelected ? 'bg-emerald-500/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {permissions.canDelete && (
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectAttendee(a.id)}
                              aria-label={`Select ${a.name}`}
                              style={{ cursor: 'pointer' }}
                            />
                          </td>
                        )}
                        <td className="px-5 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded text-xs">
                            {a.registrationNumber}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-semibold text-slate-900 dark:text-white">{a.name}</div>
                          {a.gender && (
                            <div className="text-xs text-slate-500 dark:text-slate-400">{a.gender}</div>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                            {a.category}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                            a.registrationType === 'spot'
                              ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                              : 'bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300'
                          }`}>
                            {a.registrationType === 'spot' ? 'Spot' : 'Pre-Reg'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {a.attendanceStatus === 'checked_in' ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-semibold">
                              Checked In
                            </span>
                          ) : a.attendanceStatus === 'checked_out' ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-semibold">
                              Checked Out
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                              Not Checked In
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                            a.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300'
                          }`}>
                            {a.paymentStatus}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setViewingAttendee(a)}
                              title="View Details"
                              aria-label={`View details for ${a.name}`}
                              className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                            >
                              <Eye size={15} />
                            </button>
                            {permissions.canUpdate && (
                              <button
                                onClick={() => openEditModal(a)}
                                title="Edit Attendee"
                                aria-label={`Edit ${a.name}`}
                                className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 cursor-pointer transition-colors"
                              >
                                <Pencil size={15} />
                              </button>
                            )}
                            {permissions.canDelete && (
                              <button
                                onClick={() => setDeletingAttendee(a)}
                                title="Delete Attendee"
                                aria-label={`Delete ${a.name}`}
                                className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 cursor-pointer transition-colors"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 sm:px-5 border-t border-slate-200 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/60 dark:bg-slate-900/60 flex-wrap gap-3">
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Showing {attendees.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, totalCount)} of {totalCount} attendees
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || tableLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                  page <= 1
                    ? 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed bg-slate-100/50 dark:bg-slate-800/50'
                    : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer'
                }`}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span className="text-xs text-slate-600 dark:text-slate-400 px-2">
                Page {page} of {totalPages || 1}
              </span>
              <button
                disabled={page >= totalPages || tableLoading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                  page >= totalPages
                    ? 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed bg-slate-100/50 dark:bg-slate-800/50'
                    : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer'
                }`}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 1. VIEW ATTENDEE MODAL                                                  */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {viewingAttendee && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="view-attendee-title"
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl max-w-lg w-full p-7 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-5">
              <div>
                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {viewingAttendee.registrationNumber}
                </span>
                <h3 id="view-attendee-title" className="text-xl font-bold mt-2 text-slate-900 dark:text-white">
                  {viewingAttendee.name}
                </h3>
              </div>
              <button
                onClick={() => setViewingAttendee(null)}
                aria-label="Close modal"
                className="bg-transparent border-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Badges Bar */}
            <div className="flex flex-wrap gap-2 mb-5">
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium">
                {viewingAttendee.category}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                viewingAttendee.attendanceStatus === 'checked_in'
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {viewingAttendee.attendanceStatus.replace('_', ' ')}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-medium">
                Payment: {viewingAttendee.paymentStatus}
              </span>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-slate-200 dark:border-slate-800">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Registration Type</label>
                <div className="text-sm text-slate-900 dark:text-white mt-0.5">
                  {viewingAttendee.registrationType === 'spot' ? 'Spot Registration' : 'Pre-Registered'}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Food Preference</label>
                <div className="text-sm text-slate-900 dark:text-white mt-0.5">{viewingAttendee.foodPreference}</div>
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Gender</label>
                <div className="text-sm text-slate-900 dark:text-white mt-0.5">{viewingAttendee.gender || 'Not Specified'}</div>
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Registered Date</label>
                <div className="text-sm text-slate-900 dark:text-white mt-0.5">
                  {new Date(viewingAttendee.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Contact / PII Section */}
            <div className="mt-5 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={16} className="text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Confidential PII Contact Details</span>
              </div>
              {permissions.canViewPii ? (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-xs block">Phone Number:</span>
                    <span className="text-slate-900 dark:text-white font-medium">{viewingAttendee.phoneNumber || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-xs block">Email Address:</span>
                    <span className="text-slate-900 dark:text-white font-medium">{viewingAttendee.email || 'None'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 dark:text-slate-400 text-xs block">Medical Council Reg #:</span>
                    <span className="text-slate-900 dark:text-white font-medium">{viewingAttendee.medicalCouncilNumber || 'Not provided'}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-800/40">
                  <Lock size={16} />
                  <span>PII Redacted: Your assigned role ({contextInfo.effectiveRole}) is restricted from viewing contact info.</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setViewingAttendee(null)}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
              >
                Close
              </button>
              {permissions.canUpdate && (
                <button
                  onClick={() => {
                    const target = viewingAttendee;
                    setViewingAttendee(null);
                    openEditModal(target);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white border-0 rounded-lg text-sm font-medium cursor-pointer shadow-sm transition-colors"
                >
                  Edit Attendee
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 2. REGISTER ATTENDEE MODAL                                              */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {showRegisterModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="register-attendee-title"
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl max-w-xl w-full p-7 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 id="register-attendee-title" className="text-xl font-bold text-slate-900 dark:text-white">
                  Register New Attendee
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Add a delegate or participant manually into this event workspace.
                </p>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                aria-label="Close modal"
                className="bg-transparent border-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm mb-4 flex items-center gap-2">
                <AlertTriangle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit}>
              <div className="grid grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Surya Kumar"
                    className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 box-border"
                  />
                </div>

                {/* Registration Number (Optional / Auto-Generated) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Registration # <span className="text-slate-400 font-normal">(Optional — auto-generated)</span>
                  </label>
                  <input
                    type="text"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    placeholder="Auto-generated sequential number"
                    className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 box-border"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={regCategory}
                    onChange={(e) => setRegCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 box-border"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 box-border"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 box-border"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gender
                  </label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 box-border"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Address */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Address <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="e.g. 123 Healthcare Ave, Medical City, Chennai"
                    className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 box-border"
                  />
                </div>

                {/* Medical Council Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Medical Council Reg #
                  </label>
                  <input
                    type="text"
                    value={regMedicalNo}
                    onChange={(e) => setRegMedicalNo(e.target.value)}
                    placeholder="Optional council id"
                    className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 box-border"
                  />
                </div>

                {/* Food Preference */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Food Preference
                  </label>
                  <select
                    value={regFood}
                    onChange={(e) => setRegFood(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 box-border"
                  >
                    {FOOD_OPTIONS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                {/* Payment Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={regPayment}
                    onChange={(e) => setRegPayment(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 box-border"
                  >
                    {PAYMENT_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Registration Type */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Registration Type
                  </label>
                  <div className="flex gap-6 mt-1">
                    <label className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="radio"
                        checked={regType === 'pre_registered'}
                        onChange={() => setRegType('pre_registered')}
                      />
                      Pre-Registered
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="radio"
                        checked={regType === 'spot'}
                        onChange={() => setRegType('spot')}
                      />
                      Spot Registration
                    </label>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="mt-7 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold cursor-pointer shadow-sm transition-colors"
                >
                  {formSubmitting && <Loader2 size={16} className="animate-spin" />}
                  Register Attendee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 3. EDIT ATTENDEE MODAL                                                  */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {editingAttendee && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-attendee-title"
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl max-w-xl w-full p-7 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 id="edit-attendee-title" className="text-xl font-bold text-slate-900 dark:text-white">
                  Edit Attendee Record
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Update delegate credentials and event participation status.
                </p>
              </div>
              <button
                onClick={() => setEditingAttendee(null)}
                aria-label="Close modal"
                className="bg-transparent border-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm mb-4 flex items-center gap-2">
                <AlertTriangle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit}>
              <div className="grid grid-cols-2 gap-4">
                {/* Registration Number (Read-Only) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Registration # (Locked)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingAttendee.registrationNumber}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 box-border cursor-not-allowed font-mono"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 box-border"
                  />
                </div>

                {/* Full Name */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 box-border"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 box-border"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 box-border"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gender
                  </label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 box-border"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Medical Council Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Medical Council #
                  </label>
                  <input
                    type="text"
                    value={editMedicalNo}
                    onChange={(e) => setEditMedicalNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 box-border"
                  />
                </div>

                {/* Food Preference */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Food Preference
                  </label>
                  <select
                    value={editFood}
                    onChange={(e) => setEditFood(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 box-border"
                  >
                    {FOOD_OPTIONS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                {/* Payment Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={editPayment}
                    onChange={(e) => setEditPayment(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 box-border"
                  >
                    {PAYMENT_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Attendance Status */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Attendance Status
                  </label>
                  <select
                    value={editAttendance}
                    onChange={(e) => setEditAttendance(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 box-border"
                  >
                    <option value="not_checked_in">Not Checked In</option>
                    <option value="checked_in">Checked In</option>
                    <option value="checked_out">Checked Out</option>
                  </select>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="mt-7 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingAttendee(null)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold cursor-pointer shadow-sm transition-colors"
                >
                  {formSubmitting && <Loader2 size={16} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 4. SINGLE DELETE CONFIRMATION MODAL                                     */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {deletingAttendee && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <AlertTriangle size={24} />
              <h3 id="delete-dialog-title" className="text-lg font-bold text-slate-900 dark:text-white m-0">
                Delete Attendee
              </h3>
            </div>
            <p className="m-0 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong>{deletingAttendee.name}</strong> ({deletingAttendee.registrationNumber})?
              All associated attendance logs and badge printing history will be permanently deleted.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingAttendee(null)}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={formSubmitting}
                onClick={handleConfirmSingleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold cursor-pointer shadow-sm transition-colors"
              >
                {formSubmitting && <Loader2 size={16} className="animate-spin" />}
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 5. BULK DELETE CONFIRMATION MODAL                                       */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {showBulkDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-delete-dialog-title"
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <AlertTriangle size={24} />
              <h3 id="bulk-delete-dialog-title" className="text-lg font-bold text-slate-900 dark:text-white m-0">
                Bulk Delete Attendees
              </h3>
            </div>
            <p className="m-0 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete <strong>{selectedIds.size}</strong> selected attendees?
              This operation cannot be undone and will be recorded in the organization audit log.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={formSubmitting}
                onClick={handleConfirmBulkDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold cursor-pointer shadow-sm transition-colors"
              >
                {formSubmitting && <Loader2 size={16} className="animate-spin" />}
                Delete {selectedIds.size} Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
