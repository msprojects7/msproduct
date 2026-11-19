import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../navigation/BackButton';
import { AttendeeDetailModal } from './AttendeeDetailModal';
import { AttendeeEditModal } from './AttendeeEditModal';
import { Attendee } from '../../types';
import { 
  Search, 
  Filter, 
  CreditCard, 
  UserPlus, 
  Trash2, 
  UserCheck, 
  Printer, 
  Eye, 
  Edit3, 
  Download, 
  CheckSquare, 
  Square,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';

export const AttendeesListPage: React.FC = () => {
  const { 
    attendees, 
    currentEvent, 
    navigate, 
    updateAttendee, 
    deleteAttendee, 
    openConfirm, 
    addToast,
    setSelectedBadgeAttendee
  } = useApp();

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAttendance, setSelectedAttendance] = useState<string>('All');
  const [selectedPayment, setSelectedPayment] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [detailAttendee, setDetailAttendee] = useState<Attendee | null>(null);
  const [editAttendee, setEditAttendee] = useState<Attendee | null>(null);

  // Filter attendees for this event
  const filteredAttendees = useMemo(() => {
    return attendees
      .filter(a => a.eventId === currentEvent.id)
      .filter(a => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          a.fullName.toLowerCase().includes(q) ||
          a.registrationNumber.toLowerCase().includes(q) ||
          (a.email && a.email.toLowerCase().includes(q)) ||
          (a.mobile && a.mobile.includes(q)) ||
          (a.company && a.company.toLowerCase().includes(q))
        );
      })
      .filter(a => (selectedCategory === 'All' ? true : a.category === selectedCategory))
      .filter(a => (selectedAttendance === 'All' ? true : a.attendanceStatus === selectedAttendance))
      .filter(a => (selectedPayment === 'All' ? true : a.paymentStatus === selectedPayment))
      .filter(a => (selectedType === 'All' ? true : a.registrationType === selectedType));
  }, [attendees, currentEvent.id, searchQuery, selectedCategory, selectedAttendance, selectedPayment, selectedType]);

  // Paginated records
  const totalPages = Math.ceil(filteredAttendees.length / pageSize) || 1;
  const paginatedAttendees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAttendees.slice(start, start + pageSize);
  }, [filteredAttendees, currentPage, pageSize]);

  // Bulk handlers
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedAttendees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedAttendees.map(a => a.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkCheckIn = () => {
    if (selectedIds.length === 0) return;
    const now = new Date().toISOString();
    selectedIds.forEach(id => {
      updateAttendee(id, { attendanceStatus: 'Checked In', checkInTime: now });
    });
    addToast({
      type: 'success',
      title: 'Bulk Check-In Complete',
      message: `${selectedIds.length} attendees marked as Checked In.`
    });
    setSelectedIds([]);
  };

  const handleBulkPrint = () => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach(id => {
      updateAttendee(id, { badgePrinted: true, printCount: (attendees.find(a => a.id === id)?.printCount || 0) + 1 });
    });
    addToast({
      type: 'success',
      title: 'Batch Badges Queued',
      message: `${selectedIds.length} badge print jobs sent to Print Preview.`
    });
    navigate('print-preview');
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    openConfirm({
      title: `Delete ${selectedIds.length} Attendees?`,
      message: 'This will remove the selected attendees from this event roster permanently. This action cannot be undone.',
      confirmLabel: `Delete ${selectedIds.length} Records`,
      isDestructive: true,
      onConfirm: () => {
        selectedIds.forEach(id => deleteAttendee(id));
        setSelectedIds([]);
      }
    });
  };

  const handleSinglePrint = (attendee: Attendee) => {
    setSelectedBadgeAttendee(attendee);
    updateAttendee(attendee.id, { badgePrinted: true, printCount: attendee.printCount + 1 });
    navigate('print-preview');
  };

  const handleSingleDelete = (attendee: Attendee) => {
    openConfirm({
      title: `Delete Attendee ${attendee.registrationNumber}?`,
      message: `Are you sure you want to delete ${attendee.fullName} from ${currentEvent.name}?`,
      confirmLabel: 'Delete Record',
      isDestructive: true,
      onConfirm: () => deleteAttendee(attendee.id)
    });
  };

  return (
    <div className="w-full pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* TOP BAR WITH BACK BUTTON & ACTIONS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <BackButton label="Back to Dashboard" targetRoute="dashboard" />
            <div className="pt-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Attendee Directory</h1>
              <p className="text-xs text-slate-400">
                {currentEvent.name} · <span className="font-mono text-indigo-400 font-semibold">{filteredAttendees.length} records</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('imports')}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Import / Export</span>
            </button>
            <button
              onClick={() => navigate('spot-registration')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Attendee</span>
            </button>
          </div>
        </div>

        {/* SEARCH & MULTI-FILTER BAR */}
        <div className="rounded-2xl glass-panel p-4 border border-slate-800 space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Box */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search by name, reg #, email, phone, or company..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Quick Filter Selectors */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                className="px-2.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Categories</option>
                {currentEvent.categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={selectedAttendance}
                onChange={(e) => { setSelectedAttendance(e.target.value); setCurrentPage(1); }}
                className="px-2.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Attendance</option>
                <option value="Checked In">Checked In</option>
                <option value="Checked Out">Checked Out</option>
                <option value="Not Arrived">Not Arrived</option>
              </select>

              <select
                value={selectedPayment}
                onChange={(e) => { setSelectedPayment(e.target.value); setCurrentPage(1); }}
                className="px-2.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Payments</option>
                <option value="Paid">Paid</option>
                <option value="Complimentary">Complimentary</option>
                <option value="Pending">Pending</option>
              </select>

              <select
                value={selectedType}
                onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1); }}
                className="px-2.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Types</option>
                <option value="Pre-registered">Pre-registered</option>
                <option value="On-spot">On-spot</option>
                <option value="VIP Invite">VIP Invite</option>
              </select>
            </div>
          </div>

          {/* BULK SELECTION ACTION STRIP */}
          {selectedIds.length > 0 && (
            <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 flex items-center justify-between text-xs animate-in fade-in">
              <span className="font-semibold text-indigo-300">
                {selectedIds.length} {selectedIds.length === 1 ? 'attendee' : 'attendees'} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkCheckIn}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 font-medium transition-colors"
                >
                  Mark Checked In
                </button>
                <button
                  onClick={handleBulkPrint}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm transition-colors"
                >
                  Print Badges
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-2.5 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 font-medium transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-slate-400 hover:text-white px-2 py-1"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ATTENDEE TABLE */}
        <div className="rounded-3xl glass-panel border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <button onClick={handleSelectAll} className="p-1 hover:text-white">
                      {selectedIds.length > 0 && selectedIds.length === paginatedAttendees.length ? (
                        <CheckSquare className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3 font-semibold">Reg #</th>
                  <th className="py-3 px-3 font-semibold">Full Name & Contact</th>
                  <th className="py-3 px-3 font-semibold">Category</th>
                  <th className="py-3 px-3 font-semibold">Registration Type</th>
                  <th className="py-3 px-3 font-semibold">Attendance</th>
                  <th className="py-3 px-3 font-semibold">Payment</th>
                  <th className="py-3 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {paginatedAttendees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <p className="text-sm font-semibold text-slate-300">No Attendees Found</p>
                      <p className="text-xs text-slate-500 mt-1">Try modifying your search or filter criteria.</p>
                      <button
                        onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setSelectedAttendance('All'); setSelectedPayment('All'); setSelectedType('All'); }}
                        className="mt-3 px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 hover:text-white"
                      >
                        Reset Filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  paginatedAttendees.map((att) => {
                    const isSelected = selectedIds.includes(att.id);
                    return (
                      <tr 
                        key={att.id}
                        className={`hover:bg-slate-900/60 transition-colors ${
                          isSelected ? 'bg-indigo-950/20' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <button onClick={() => toggleSelectOne(att.id)} className="p-1 hover:text-white">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-600" />
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-3 font-mono font-bold text-indigo-300">
                          {att.registrationNumber}
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-semibold text-white cursor-pointer hover:text-indigo-400" onClick={() => setDetailAttendee(att)}>
                            {att.fullName}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            {att.company && <span>{att.company}</span>}
                            {att.company && att.email && <span aria-hidden="true">·</span>}
                            {att.email && <span>{att.email}</span>}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-medium px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-200">
                            {att.category}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                          {att.registrationType}
                        </td>

                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            att.attendanceStatus === 'Checked In'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                              : att.attendanceStatus === 'Checked Out'
                              ? 'bg-amber-950/60 text-amber-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {att.attendanceStatus}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span className={`text-[11px] font-semibold ${
                            att.paymentStatus === 'Paid'
                              ? 'text-emerald-400'
                              : att.paymentStatus === 'Complimentary'
                              ? 'text-indigo-400'
                              : 'text-amber-400'
                          }`}>
                            {att.paymentStatus}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => setDetailAttendee(att)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                              title="View details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleSinglePrint(att)}
                              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg"
                              title="Print badge"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditAttendee(att)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                              title="Edit attendee"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleSingleDelete(att)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION STRIP */}
          <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <span>Showing {filteredAttendees.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredAttendees.length)} of {filteredAttendees.length} delegates</span>
              <div className="flex items-center gap-1">
                <span>Page size:</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-white font-medium px-2">
                {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* MODALS */}
        <AttendeeDetailModal
          attendee={detailAttendee}
          onClose={() => setDetailAttendee(null)}
          onEdit={(att) => { setDetailAttendee(null); setEditAttendee(att); }}
          onPrintBadge={(att) => { setDetailAttendee(null); handleSinglePrint(att); }}
        />

        <AttendeeEditModal
          attendee={editAttendee}
          onClose={() => setEditAttendee(null)}
          onSave={(updates) => {
            if (editAttendee) {
              updateAttendee(editAttendee.id, updates);
            }
          }}
        />

      </div>
    </div>
  );
};
