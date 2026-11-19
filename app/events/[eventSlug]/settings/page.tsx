'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Settings,
  Calendar,
  MapPin,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Sliders,
  Printer,
  UserCheck,
  Building,
  RefreshCw,
  Clock,
  Radio,
  FileText,
} from 'lucide-react';
import { BackButton } from '@/app/components/ui/BackButton';
import { useToast } from '@/app/components/ui/Toast';

export default function EventSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const eventSlug = params.eventSlug as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [effectiveRole, setEffectiveRole] = useState<string>('');

  // Form states
  const [name, setName] = useState('');
  const [venue, setVenue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('published');

  // Event feature toggles
  const [allowSpotReg, setAllowSpotReg] = useState(true);
  const [autoSequentialBadges, setAutoSequentialBadges] = useState(true);
  const [duplicateScanProtection, setDuplicateScanProtection] = useState(true);
  const [thermalDirectPrint, setThermalDirectPrint] = useState(false);

  const fetchEventInfo = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/events/${eventSlug}`);
      if (!res.ok) {
        throw new Error('Failed to load event data');
      }
      const data = await res.json();
      setEventData(data.event);
      setEffectiveRole(data.effectiveRole || 'viewer');

      setName(data.event.name || '');
      setVenue(data.event.venue || '');
      if (data.event.startDate) {
        setStartDate(new Date(data.event.startDate).toISOString().slice(0, 10));
      }
      if (data.event.endDate) {
        setEndDate(new Date(data.event.endDate).toISOString().slice(0, 10));
      }
      setStatus(data.event.status || 'published');

      // Fetch event settings key-values
      const settingsRes = await fetch(`/api/events/${eventSlug}/settings`);
      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        const settingsList = sData.settings || [];
        settingsList.forEach((s: { key: string; value: any }) => {
          if (s.key === 'allowSpotReg') setAllowSpotReg(Boolean(s.value));
          if (s.key === 'autoSequentialBadges') setAutoSequentialBadges(Boolean(s.value));
          if (s.key === 'duplicateScanProtection') setDuplicateScanProtection(Boolean(s.value));
          if (s.key === 'thermalDirectPrint') setThermalDirectPrint(Boolean(s.value));
        });
      }
    } catch (err: any) {
      toast.error(err.message || 'Error loading event configuration');
    } finally {
      setLoading(false);
    }
  }, [eventSlug, toast]);

  useEffect(() => {
    fetchEventInfo();
  }, [fetchEventInfo]);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventData?.id) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/events/${eventData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          venue: venue.trim() || null,
          startDate: startDate ? new Date(startDate).toISOString() : null,
          endDate: endDate ? new Date(endDate).toISOString() : null,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update event');
      }

      // Save feature toggle settings
      const settingsPayloads = [
        { key: 'allowSpotReg', value: allowSpotReg },
        { key: 'autoSequentialBadges', value: autoSequentialBadges },
        { key: 'duplicateScanProtection', value: duplicateScanProtection },
        { key: 'thermalDirectPrint', value: thermalDirectPrint },
      ];

      for (const item of settingsPayloads) {
        await fetch(`/api/events/${eventData.id}/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
      }

      toast.success('Event settings updated successfully');
      fetchEventInfo();
    } catch (err: any) {
      toast.error(err.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="text-xs">Loading event settings…</span>
      </div>
    );
  }

  const isEditable = ['admin', 'org_owner', 'event_manager'].includes(effectiveRole.toLowerCase());

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-slate-200 dark:border-slate-800/80 mb-6">
        <div className="flex items-center gap-3">
          <BackButton href={`/events/${eventSlug}`} label="Back to Event" />
          <div className="hidden sm:block h-4 w-px bg-slate-300 dark:bg-slate-700" />
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h1 className="text-sm font-bold text-slate-900 dark:text-white">
              Event Configuration &amp; Settings
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchEventInfo}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-lg transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <form onSubmit={handleSaveGeneral} className="space-y-6">
        {/* Card 1: Core Details */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              General Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Event Name *
              </label>
              <input
                type="text"
                required
                disabled={!isEditable}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Apex Global Summit 2026"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Venue / Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  disabled={!isEditable}
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Grand Convention Center, San Francisco"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Start Date
              </label>
              <input
                type="date"
                disabled={!isEditable}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                End Date
              </label>
              <input
                type="date"
                disabled={!isEditable}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Event Status
              </label>
              <select
                disabled={!isEditable}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="published">Published &amp; Active</option>
                <option value="draft">Draft Mode</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card 2: Operations & Badge Printing Engine Toggles */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Operations &amp; Badge Printing Engine
            </h2>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
            {/* Toggle 1 */}
            <div className="py-3 flex items-center justify-between gap-4">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Spot Registration Desk
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Allow on-site staff to register walk-ins and generate immediate badges.
                </span>
              </div>
              <input
                type="checkbox"
                disabled={!isEditable}
                checked={allowSpotReg}
                onChange={(e) => setAllowSpotReg(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
              />
            </div>

            {/* Toggle 2 */}
            <div className="py-3 flex items-center justify-between gap-4">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Automatic Sequential Badge Numbers
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Automatically assign monotonic sequence numbers (e.g. REG-1001) with database locking.
                </span>
              </div>
              <input
                type="checkbox"
                disabled={!isEditable}
                checked={autoSequentialBadges}
                onChange={(e) => setAutoSequentialBadges(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
              />
            </div>

            {/* Toggle 3 */}
            <div className="py-3 flex items-center justify-between gap-4">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Duplicate Scan &amp; Anti-Passback Protection
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Reject attendee QR re-scans within a 30-second window to prevent badge swapping.
                </span>
              </div>
              <input
                type="checkbox"
                disabled={!isEditable}
                checked={duplicateScanProtection}
                onChange={(e) => setDuplicateScanProtection(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
              />
            </div>

            {/* Toggle 4 */}
            <div className="py-3 flex items-center justify-between gap-4">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Thermal POS Direct Print Integration
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Format badges optimized for thermal label printers (ESC/POS / ZPL emulation).
                </span>
              </div>
              <input
                type="checkbox"
                disabled={!isEditable}
                checked={thermalDirectPrint}
                onChange={(e) => setThermalDirectPrint(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        {isEditable && (
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-md transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Saving Changes…' : 'Save Event Settings'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
