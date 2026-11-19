'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import BackButton from '@/app/components/ui/BackButton';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  MapPin,
  Clock,
  Plus,
  QrCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Search,
  Edit2,
  Trash2,
  Sliders,
  Sparkles,
  ArrowRightLeft,
  ChevronRight,
  LogOut,
  LogIn,
  Layers,
} from 'lucide-react';

interface ZoneItem {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  capacity: number;
  openTime: string | null;
  closeTime: string | null;
  isActive: boolean;
  allowedTicketTypes: string[];
  allowedRoles: string[];
  currentOccupancy: number;
  isOverCapacity: boolean;
  occupancyPercentage: number;
}

interface ScanLogItem {
  id: string;
  zoneId: string;
  attendeeId: string;
  action: 'check_in' | 'check_out';
  status: 'granted' | 'denied';
  denialReason?: string | null;
  scannedAt: string;
  deviceInfo?: string | null;
}

const TICKET_PRESETS = [
  'VIP',
  'Delegate',
  'General',
  'Speaker',
  'Exhibitor',
  'Press / Media',
  'Staff',
  'Student',
  'All Access',
];

export default function ZoneAccessControlPage() {
  const params = useParams();
  const eventSlug = params?.eventSlug as string;

  const [zones, setZones] = useState<ZoneItem[]>([]);
  const [recentLogs, setRecentLogs] = useState<ScanLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Scanning State
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [scanAction, setScanAction] = useState<'check_in' | 'check_out'>('check_in');
  const [scanInput, setScanInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<{
    access: 'granted' | 'denied';
    message: string;
    reason?: string;
    attendee?: {
      name: string;
      registrationNumber: string;
      category: string;
      email: string;
    };
    zone?: {
      name: string;
      currentOccupancy: number;
      capacity: number;
    };
  } | null>(null);

  // Zone Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ZoneItem | null>(null);
  const [modalForm, setModalForm] = useState({
    name: '',
    location: '',
    description: '',
    capacity: 50,
    isActive: true,
    allowedTicketTypes: [] as string[],
  });
  const [savingZone, setSavingZone] = useState(false);

  const scanInputRef = useRef<HTMLInputElement>(null);

  const fetchZones = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/events/${eventSlug}/zones`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load zones');
      setZones(data.zones || []);
      setRecentLogs(data.recentLogs || []);
      if (data.zones && data.zones.length > 0 && !selectedZoneId) {
        setSelectedZoneId(data.zones[0].id);
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error fetching zone data');
    } finally {
      setLoading(false);
    }
  }, [eventSlug, selectedZoneId]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  // Handle Scanning QR / Badge
  const handleExecuteScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = scanInput.trim();
    if (!trimmed || !selectedZoneId) return;

    try {
      setScanning(true);
      setScanFeedback(null);

      const res = await fetch(`/api/events/${eventSlug}/zones/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneId: selectedZoneId,
          identifier: trimmed,
          action: scanAction,
          deviceInfo: 'Gate Scanner Desk',
        }),
      });

      const data = await res.json();
      setScanFeedback({
        access: data.access || 'denied',
        message: data.message || (data.access === 'granted' ? 'Access Granted' : 'Access Denied'),
        reason: data.denialReason,
        attendee: data.attendee,
        zone: data.zone,
      });

      setScanInput('');
      fetchZones(); // Refresh occupancy and logs
    } catch (err: unknown) {
      const e = err as Error;
      setScanFeedback({
        access: 'denied',
        message: e.message || 'Network communication failure during scan',
        reason: 'SYSTEM_ERROR',
      });
    } finally {
      setScanning(false);
      setTimeout(() => scanInputRef.current?.focus(), 100);
    }
  };

  // Open Create / Edit Zone Modal
  const handleOpenCreateModal = () => {
    setEditingZone(null);
    setModalForm({
      name: '',
      location: '',
      description: '',
      capacity: 50,
      isActive: true,
      allowedTicketTypes: ['VIP', 'Speaker', 'Delegate'],
    });
    setIsModalOpen(true);
  };

  const handleSeedDefaultZones = async () => {
    try {
      setSavingZone(true);
      const defaults = [
        { name: 'Main Auditorium', location: 'Hall A, Ground Floor', capacity: 500, allowedTicketTypes: ['Delegate', 'VIP', 'Speaker'] },
        { name: 'VIP Networking Lounge', location: 'Mezzanine Level', capacity: 50, allowedTicketTypes: ['VIP'] },
        { name: 'Speaker & Faculty Lounge', location: 'Behind Main Stage', capacity: 25, allowedTicketTypes: ['Speaker'] },
      ];

      for (const zone of defaults) {
        await fetch(`/api/events/${eventSlug}/zones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(zone),
        });
      }
      fetchZones();
    } catch (err: unknown) {
      const e = err as Error;
      setError(`Error initializing default zones: ${e.message}`);
    } finally {
      setSavingZone(false);
    }
  };

  const handleOpenEditModal = (zone: ZoneItem) => {
    setEditingZone(zone);
    setModalForm({
      name: zone.name,
      location: zone.location || '',
      description: zone.description || '',
      capacity: zone.capacity,
      isActive: zone.isActive,
      allowedTicketTypes: zone.allowedTicketTypes || [],
    });
    setIsModalOpen(true);
  };

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.name.trim()) return;

    try {
      setSavingZone(true);
      const url = `/api/events/${eventSlug}/zones`;
      const method = editingZone ? 'PUT' : 'POST';
      const body = editingZone
        ? { zoneId: editingZone.id, ...modalForm }
        : modalForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save zone');

      setIsModalOpen(false);
      fetchZones();
    } catch (err: unknown) {
      const e = err as Error;
      setError(`Error: ${e.message}`);
    } finally {
      setSavingZone(false);
    }
  };

  const handleDeleteZone = async (zoneId: string, zoneName: string) => {
    try {
      const res = await fetch(`/api/events/${eventSlug}/zones?zoneId=${zoneId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete zone');
      }
      fetchZones();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message);
    }
  };

  const toggleTicketPreset = (ticket: string) => {
    setModalForm((prev) => {
      const exists = prev.allowedTicketTypes.includes(ticket);
      const updated = exists
        ? prev.allowedTicketTypes.filter((t) => t !== ticket)
        : [...prev.allowedTicketTypes, ticket];
      return { ...prev, allowedTicketTypes: updated };
    });
  };

  const activeZone = zones.find((z) => z.id === selectedZoneId) || zones[0];
  const totalOccupancy = zones.reduce((acc, z) => acc + z.currentOccupancy, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24 transition-colors duration-200">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref={`/events/${eventSlug}`} label="Back to Event" />
            <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-800" />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Zone Access Control &amp; Capacity Desk</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Zoho Backstage-grade gated zone access, live headcount monitoring, and rapid badge validation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Configure New Zone</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-md">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold">Configured Zones</span>
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{zones.length}</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Active physical gate points</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-md">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold">Live Headcount</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{totalOccupancy}</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Attendees inside all zones</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-md">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold">Recent Gate Scans</span>
              <QrCode className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-400">{recentLogs.length}</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Logged entry &amp; exit records</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-md">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold">Capacity Alert</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">
              {zones.filter((z) => z.isOverCapacity).length}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Zones at/near maximum quota</p>
          </div>
        </div>

        {/* Main Work Area: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Left Column: Interactive Gate Scanner Desk (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 shadow-sm dark:shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Interactive Gate Scanner Desk</h2>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ready to Scan
                </span>
              </div>

              {/* Zone Selector & Action Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Select Target Zone
                  </label>
                  <select
                    value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    {zones.length === 0 ? (
                      <option value="">No zones configured (Click Initialize below)</option>
                    ) : (
                      zones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name} ({z.currentOccupancy}/{z.capacity || '∞'})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Gate Action Mode
                  </label>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setScanAction('check_in')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition ${scanAction === 'check_in'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Entry Scan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setScanAction('check_out')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition ${scanAction === 'check_out'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Exit Scan</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Scanner Input Form */}
              <form onSubmit={handleExecuteScan} className="pt-2">
                <div className="relative">
                  <input
                    ref={scanInputRef}
                    type="text"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    placeholder="Scan attendee QR code or type Reg # / Badge Token..."
                    autoFocus
                    disabled={scanning}
                    className="w-full pl-11 pr-24 py-3 bg-slate-50 dark:bg-slate-950 border-2 border-indigo-400 dark:border-indigo-500/60 focus:border-indigo-600 dark:focus:border-indigo-400 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-inner focus:outline-none"
                  />
                  <QrCode className="w-5 h-5 text-indigo-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <button
                    type="submit"
                    disabled={scanning || !scanInput.trim()}
                    className="absolute right-2 top-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition disabled:opacity-40"
                  >
                    {scanning ? 'Validating...' : 'Validate'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Compatible with handheld 2D barcode USB scanners, mobile cameras, and manual keyboard lookup.
                </p>
              </form>

              {/* Real-time Scan Result Banner */}
              {scanFeedback && (
                <div
                  className={`p-4 rounded-xl border transition-all duration-300 ${scanFeedback.access === 'granted'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/50 text-emerald-900 dark:text-emerald-200'
                    : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-500/50 text-red-900 dark:text-red-200'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    {scanFeedback.access === 'granted' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {scanFeedback.access === 'granted' ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
                        </span>
                        {scanFeedback.reason && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-900/60 border border-red-700/60 text-red-300">
                            {scanFeedback.reason}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                        {scanFeedback.message}
                      </p>

                      {scanFeedback.attendee && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-white/10 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500 dark:text-slate-400">Attendee:</span>{' '}
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {scanFeedback.attendee.name}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400">Reg #:</span>{' '}
                            <span className="font-mono text-slate-900 dark:text-white">
                              {scanFeedback.attendee.registrationNumber}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400">Category:</span>{' '}
                            <span className="font-semibold text-indigo-300 uppercase">
                              {scanFeedback.attendee.category}
                            </span>
                          </div>
                          {scanFeedback.zone && (
                            <div>
                              <span className="text-slate-500 dark:text-slate-400">Zone Occupancy:</span>{' '}
                              <span className="font-bold text-slate-900 dark:text-white">
                                {scanFeedback.zone.currentOccupancy} / {scanFeedback.zone.capacity || '∞'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Headcount Gauges for Active Zone */}
            {activeZone && (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{activeZone.name} — Status</h3>
                    <p className="text-xs text-slate-400">{activeZone.location || 'Main Venue Area'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {activeZone.currentOccupancy}
                    </span>
                    <span className="text-xs text-slate-400">
                      {' '}/ {activeZone.capacity > 0 ? activeZone.capacity : 'Unlimited'}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                {activeZone.capacity > 0 && (
                  <div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${activeZone.isOverCapacity
                          ? 'bg-red-500'
                          : activeZone.occupancyPercentage > 80
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                          }`}
                        style={{ width: `${activeZone.occupancyPercentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>{activeZone.occupancyPercentage}% capacity utilized</span>
                      <span>
                        {Math.max(0, activeZone.capacity - activeZone.currentOccupancy)} slots available
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Configured Zones Registry (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 shadow-sm dark:shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Configured Zones ({zones.length})</h3>
                <span className="text-[11px] text-slate-400">Real-time occupancy</span>
              </div>

              {zones.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs space-y-3">
                  <p className="text-slate-600 dark:text-slate-400">No zones configured yet for this event.</p>
                  <button
                    type="button"
                    onClick={handleSeedDefaultZones}
                    disabled={savingZone}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{savingZone ? 'Initializing...' : 'Seed Recommended Venue Zones'}</span>
                  </button>
                  <p className="text-[10px] text-slate-400">
                    Creates: Main Auditorium (500), VIP Lounge (50), Speaker Lounge (25)
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
                  {zones.map((zone) => (
                    <div
                      key={zone.id}
                      onClick={() => setSelectedZoneId(zone.id)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer ${selectedZoneId === zone.id
                        ? 'bg-indigo-50/70 dark:bg-slate-800/90 border-indigo-500 shadow-xs dark:shadow-md'
                        : 'bg-slate-50/80 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{zone.name}</span>
                            <span
                              className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${zone.isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-800 text-slate-400'
                                }`}
                            >
                              {zone.isActive ? 'Active' : 'Closed'}
                            </span>
                          </div>
                          {zone.location && (
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              <span>{zone.location}</span>
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(zone);
                            }}
                            className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-800"
                            title="Edit Zone"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteZone(zone.id, zone.name);
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Delete Zone"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Capacity Indicator */}
                      <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/60">
                        <span className="text-slate-500 dark:text-slate-400">Headcount:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {zone.currentOccupancy} / {zone.capacity > 0 ? zone.capacity : '∞'}
                        </span>
                      </div>

                      {/* Allowed Ticket Pills */}
                      {zone.allowedTicketTypes && zone.allowedTicketTypes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {zone.allowedTicketTypes.map((t) => (
                            <span
                              key={t}
                              className="text-[9px] bg-indigo-950/70 text-indigo-300 border border-indigo-800/60 px-1.5 py-0.2 rounded"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Real-time Zone Access Timeline Log */}
        <div className="mt-8 p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 shadow-sm dark:shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Real-Time Zone Access Audit Ledger</span>
            </h3>
            <span className="text-xs text-slate-400">Last 20 scan events</span>
          </div>

          {recentLogs.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4 text-center">
              No zone scan events recorded yet. Start scanning badges above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Zone ID</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Denial Reason</th>
                    <th className="py-2.5 px-3">Operator / Device</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                        {new Date(log.scannedAt).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                        {log.zoneId.slice(0, 8)}...
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${log.action === 'check_in'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                            }`}
                        >
                          {log.action === 'check_in' ? 'ENTRY' : 'EXIT'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-semibold ${log.status === 'granted' ? 'text-emerald-400' : 'text-red-400'
                            }`}
                        >
                          {log.status === 'granted' ? '✓ Granted' : '✗ Denied'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                        {log.denialReason || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                        {log.deviceInfo || 'Gate Scanner Desk'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ZONE CONFIGURATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <span>{editingZone ? 'Edit Venue Zone' : 'Configure New Zone'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveZone} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Zone Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Lounge, Speaker Lounge, Main Hall, Media Center"
                  value={modalForm.name}
                  onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Location / Room
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2nd Floor, Hall B"
                    value={modalForm.location}
                    onChange={(e) => setModalForm({ ...modalForm, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Max Capacity (0 = Unlimited)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={modalForm.capacity}
                    onChange={(e) => setModalForm({ ...modalForm, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Purpose
                </label>
                <input
                  type="text"
                  placeholder="e.g. Reserved for keynote speakers and media correspondents"
                  value={modalForm.description}
                  onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Authorized Ticket Tiers
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TICKET_PRESETS.map((ticket) => {
                    const active = modalForm.allowedTicketTypes.includes(ticket);
                    return (
                      <button
                        key={ticket}
                        type="button"
                        onClick={() => toggleTicketPreset(ticket)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${active
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs'
                          : 'bg-slate-950 border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                      >
                        {ticket}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Leave unselected to allow all valid event ticket classes.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="zoneActive"
                  checked={modalForm.isActive}
                  onChange={(e) => setModalForm({ ...modalForm, isActive: e.target.checked })}
                  className="rounded border-slate-800 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="zoneActive" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                  Zone gate is open and active
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingZone}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20"
                >
                  {savingZone ? 'Saving...' : editingZone ? 'Update Zone' : 'Create Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
