'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/app/components/ui/Toast';
import BackButton from '@/app/components/ui/BackButton';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';
import {
  Users,
  UserCheck,
  UserPlus,
  Shield,
  QrCode,
  Printer,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
} from 'lucide-react';

interface StaffAssignment {
  id: string;
  eventId: string;
  userId: string;
  role: 'event_manager' | 'registration_staff' | 'scanner_operator';
  isActive: boolean;
  createdAt: string;
}

export default function EventStaffManagementPage() {
  const router = useRouter();
  const params = useParams();
  const eventSlug = params?.eventSlug as string;
  const { toast } = useToast();

  const [event, setEvent] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [organization, setOrganization] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [staff, setStaff] = useState<StaffAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Add staff modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [targetRole, setTargetRole] = useState<'event_manager' | 'registration_staff' | 'scanner_operator'>('registration_staff');
  const [saving, setSaving] = useState(false);

  // Deactivate staff confirmation
  const [deactivateTargetId, setDeactivateTargetId] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const eventRes = await fetch(`/api/events/${eventSlug}`);
      if (!eventRes.ok) {
        router.push('/dashboard');
        return;
      }
      const eventData = await eventRes.json();
      setEvent(eventData.event);
      setOrganization(eventData.organization);

      // Load staff assignments
      const staffRes = await fetch(`/api/events/${eventData.event.id}/staff`);
      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaff(staffData.staff || []);
      }

      setLoading(false);
    } catch {
      toast.error('Failed to load event staff roster');
      setLoading(false);
    }
  }, [eventSlug, router, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/events/${event.id}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId.trim(), role: targetRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to assign staff');
      } else {
        toast.success('Staff member assigned successfully');
        setShowAddModal(false);
        setTargetUserId('');
        loadData();
      }
    } catch {
      toast.error('An unexpected error occurred while assigning staff');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDeactivateStaff = async () => {
    if (!event || !deactivateTargetId) return;
    setDeactivating(true);

    try {
      const res = await fetch(`/api/events/${event.id}/staff/${deactivateTargetId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        toast.error('Failed to deactivate staff assignment');
      } else {
        toast.success('Staff assignment deactivated');
        setDeactivateTargetId(null);
        loadData();
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setDeactivating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading Event Staff…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 font-sans">
      {/* Top Action Bar with Top-Left Back Button */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-slate-200 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <BackButton
              href={`/events/${eventSlug}`}
              label={`Back to ${event?.name || 'Event'}`}
            />
          </div>

          <Link
            href={`/events/${eventSlug}/staff/new`}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-full shadow-md shadow-blue-600/20 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Assign Staff
          </Link>
        </div>
      </div>

      {/* Main Staff Roster Body */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-xs">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Assigned Event Staff ({staff.length})
                </h2>
              </div>
            </div>
          </div>

          {staff.length === 0 ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs">
              No staff members directly assigned to this event yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-3">User Identifier</th>
                    <th className="px-6 py-3">Assigned Role</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Assigned Date</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {staff.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-900 dark:text-white">
                        {s.userId}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            s.role === 'event_manager'
                              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
                              : s.role === 'registration_staff'
                              ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60'
                              : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                          }`}
                        >
                          {s.role === 'event_manager' && <Shield className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
                          {s.role === 'registration_staff' && <Printer className="w-3 h-3 text-purple-600 dark:text-purple-400" />}
                          {s.role === 'scanner_operator' && <QrCode className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                          {s.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-semibold ${
                            s.isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                              : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60'
                          }`}
                        >
                          {s.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {s.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {s.isActive && (
                          <button
                            onClick={() => setDeactivateTargetId(s.id)}
                            className="text-xs font-semibold px-3.5 py-1 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-full hover:bg-red-50 dark:hover:bg-red-950/50 transition hover:scale-[1.02] active:scale-[0.98]"
                          >
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Accessible Branded ConfirmDialog replacing window.confirm */}
      <ConfirmDialog
        isOpen={!!deactivateTargetId}
        onClose={() => setDeactivateTargetId(null)}
        onConfirm={handleConfirmDeactivateStaff}
        title="Deactivate Staff Assignment?"
        description="Are you sure you want to deactivate this staff assignment? The operator will immediately lose permissions to scan or print badges for this event."
        confirmText="Deactivate Staff"
        variant="destructive"
        loading={deactivating}
      />
    </div>
  );
}
