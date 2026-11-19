'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Sparkles, Loader2 } from 'lucide-react';
import BackButton from '@/app/components/ui/BackButton';
import { useToast } from '@/app/components/ui/Toast';

export default function AssignStaffPage() {
  const router = useRouter();
  const params = useParams();
  const eventSlug = params?.eventSlug as string;
  const { toast } = useToast();

  const [eventData, setEventData] = useState<any>(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const [targetUserId, setTargetUserId] = useState('');
  const [targetRole, setTargetRole] = useState<'event_manager' | 'registration_staff' | 'scanner_operator'>('registration_staff');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvent() {
      try {
        const res = await fetch(`/api/events/${eventSlug}`);
        if (!res.ok) throw new Error('Failed to load event');
        const data = await res.json();
        setEventData(data.event);
      } catch {
        setError('Failed to load event information.');
      } finally {
        setLoadingContext(false);
      }
    }
    loadEvent();
  }, [eventSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId.trim() || !eventData) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/events/${eventData.id}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUserId.trim(),
          role: targetRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to assign staff member');
      }

      toast.success('Staff member assigned successfully!');
      router.push(`/events/${eventSlug}/staff`);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      setError(msg);
      toast.error(msg);
      setSaving(false);
    }
  };

  if (loadingContext) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 font-sans text-slate-900 dark:text-white">
      {/* Top Action Bar with Top-Left Back Button */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <BackButton
              href={`/events/${eventSlug}/staff`}
              label="Back to Staff Roster"
            />
            <div className="hidden sm:block h-4 w-px bg-slate-300 dark:bg-slate-800" />
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Assign Staff to Event
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Body */}
      <main className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-xl shadow-slate-900/5 backdrop-blur-md p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Staff Member Access</h2>
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl text-xs text-red-800 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                User ID (UUID or Email Identifier) *
              </label>
              <input
                type="text"
                required
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="e.g. u1111111-... or user@example.com"
                className="w-full px-4 py-2.5 text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Assigned Event Role *
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as any)}
                className="w-full px-4 py-2.5 text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
              >
                <option value="registration_staff">Registration Staff (Spot Reg &amp; Badge Printing)</option>
                <option value="scanner_operator">Scanner Operator (QR Scanning Only)</option>
                <option value="event_manager">Event Manager (Settings, Badges &amp; Staff)</option>
              </select>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <Link
                href={`/events/${eventSlug}/staff`}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving || !targetUserId.trim()}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 rounded-full shadow-md shadow-blue-600/20 transition hover:scale-[1.02] active:scale-[0.98]"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {saving ? 'Assigning…' : 'Assign Role'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
