'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import BackButton from '@/app/components/ui/BackButton';
import {
  QrCode,
  Camera,
  CameraOff,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  LogIn,
  LogOut,
  Keyboard,
  Volume2,
  VolumeX,
  X,
  Users,
  LayoutDashboard,
  UserPlus,
  RefreshCw,
  ChevronRight,
  History,
  Check,
} from 'lucide-react';

type ScanMode = 'check_in' | 'check_out';

interface ScanResult {
  type: 'success' | 'already' | 'invalid' | 'error';
  message: string;
  name?: string;
  regNo?: string;
  category?: string;
  status?: string;
  action?: ScanMode;
}

interface AttendeeSummary {
  id: string;
  name: string;
  registrationNumber: string;
  category: string;
  attendanceStatus: string;
  paymentStatus: string;
  foodPreference?: string;
  medicalCouncilNumber?: string;
  registrationType?: string;
}

interface ScanLogEntry {
  id: string;
  action: 'check_in' | 'check_out';
  scannedAt: string;
  staffUserId: string;
  attendeeId: string;
  attendeeName: string;
  registrationNumber: string;
  category: string;
  attendanceStatus: string;
}

interface AttendanceStats {
  totalAttendees: number;
  checkedIn: number;
  checkedOut: number;
  notCheckedIn: number;
}

const COOLDOWN_MS = 2500;

// Web Audio synthesizer for immediate desk audio chime feedback
function playScanAudio(type: 'success' | 'already' | 'error') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (type === 'success') {
      // Pleasant POS dual-tone chime (880Hz -> 1320Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, now + 0.08);
      gain2.gain.setValueAtTime(0.22, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.28);
    } else if (type === 'already') {
      // Caution double-beep (587Hz -> 440Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(587, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(440, now + 0.14);
      gain2.gain.setValueAtTime(0.18, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.14);
      osc2.stop(now + 0.3);
    } else {
      // Low buzz tone (220Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    }
  } catch {
    // Audio Context blocked or not supported
  }

  // Tactile vibration for mobile POS devices
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'success') {
        navigator.vibrate(100);
      } else if (type === 'already') {
        navigator.vibrate([60, 40, 60]);
      } else {
        navigator.vibrate([180, 80, 180]);
      }
    } catch {
      // Ignore vibration errors
    }
  }
}

export default function EventScannerPage() {
  const params = useParams();
  const eventSlug = params.eventSlug as string;

  // Context & Stats State
  const [initialLoading, setInitialLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [eventData, setEventData] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [stats, setStats] = useState<AttendanceStats>({
    totalAttendees: 0,
    checkedIn: 0,
    checkedOut: 0,
    notCheckedIn: 0,
  });
  const [recentScans, setRecentScans] = useState<ScanLogEntry[]>([]);

  // Scanner UI State
  const [mode, setMode] = useState<ScanMode>('check_in');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScanFlash, setLastScanFlash] = useState<'success' | 'already' | 'error' | null>(null);
  const [processing, setProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // Manual Search State
  const [manualQuery, setManualQuery] = useState('');
  const [manualSearching, setManualSearching] = useState(false);
  const [searchedAttendee, setSearchedAttendee] = useState<AttendeeSummary | null>(null);

  // References
  const html5QrRef = useRef<Html5Qrcode | null>(null);
  const lastScannedToken = useRef<string | null>(null);
  const lastScanTime = useRef<number>(0);
  const modeRef = useRef<ScanMode>(mode);
  const soundEnabledRef = useRef<boolean>(soundEnabled);
  const containerId = 'qr-scanner-viewfinder';

  useEffect(() => {
    modeRef.current = mode;
    lastScannedToken.current = null;
    setScanResult(null);
  }, [mode]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Load Event Context and Initial Attendance Stats
  const loadScanData = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventSlug}/scan`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}: Failed to load scanner data`);
      }
      const data = await res.json();
      setEventData(data.event);
      setStats(data.stats);
      setRecentScans(data.recentScans || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to event scanner';
      setInitError(msg);
    } finally {
      setInitialLoading(false);
    }
  }, [eventSlug]);

  useEffect(() => {
    loadScanData();
  }, [loadScanData]);

  // Core Scan Processing Routine
  const processScanPayload = useCallback(
    async (payload: { qrToken?: string; registrationNumber?: string }) => {
      if (processing) return;

      const currentMode = modeRef.current;
      const tokenKey = payload.qrToken || payload.registrationNumber || '';

      // Cooldown guard to prevent repeated processing of the same QR code
      const now = Date.now();
      if (lastScannedToken.current === tokenKey && now - lastScanTime.current < COOLDOWN_MS) {
        return;
      }
      lastScannedToken.current = tokenKey;
      lastScanTime.current = now;

      setProcessing(true);
      setScanResult(null);

      try {
        const res = await fetch(`/api/events/${eventSlug}/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            qrToken: payload.qrToken || null,
            registrationNumber: payload.registrationNumber || null,
            action: currentMode,
            deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 200) : null,
          }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data) {
          const errMsg = data?.error || 'Attendance could not be recorded due to a network error';
          setScanResult({ type: 'error', message: errMsg, action: currentMode });
          if (soundEnabledRef.current) playScanAudio('error');
          setLastScanFlash('error');
          setTimeout(() => setLastScanFlash(null), 1200);
          return;
        }

        const resultCode = data.result as string;
        const isSuccess = resultCode === 'success_check_in' || resultCode === 'success_check_out';
        const isAlready = resultCode === 'already_checked_in' || resultCode === 'already_checked_out';
        const isInvalid = resultCode === 'invalid_qr' || resultCode === 'not_checked_in' || !data.success;

        const resType: ScanResult['type'] = isSuccess
          ? 'success'
          : isAlready
          ? 'already'
          : isInvalid
          ? 'invalid'
          : 'error';

        setScanResult({
          type: resType,
          message: data.message || 'Scan processed',
          name: data.attendee?.name,
          regNo: data.attendee?.registrationNumber,
          category: data.attendee?.category,
          status: data.attendee?.attendanceStatus,
          action: currentMode,
        });

        // Trigger Audio & Visual Feedback
        if (soundEnabledRef.current) {
          playScanAudio(resType === 'invalid' ? 'error' : resType);
        }
        setLastScanFlash(resType === 'invalid' ? 'error' : resType);
        setTimeout(() => setLastScanFlash(null), 1200);

        // Refresh stats and live feed on successful status changes
        if (isSuccess) {
          loadScanData();
        }

        // Update searched attendee preview if currently loaded
        if (searchedAttendee && data.attendee && searchedAttendee.id === data.attendee.id) {
          setSearchedAttendee((prev) =>
            prev ? { ...prev, attendanceStatus: data.attendee.attendanceStatus } : null
          );
        }
      } catch {
        setScanResult({
          type: 'error',
          message: 'Network connection error; attendance was not recorded',
          action: currentMode,
        });
        if (soundEnabledRef.current) playScanAudio('error');
        setLastScanFlash('error');
        setTimeout(() => setLastScanFlash(null), 1200);
      } finally {
        setProcessing(false);
      }
    },
    [processing, eventSlug, loadScanData, searchedAttendee]
  );

  // Camera Start Routine
  const startCamera = useCallback(async () => {
    setCameraError('');
    setScanResult(null);
    setCameraStarting(true);

    if (html5QrRef.current) {
      try {
        if (html5QrRef.current.isScanning) {
          await html5QrRef.current.stop();
        }
        await html5QrRef.current.clear();
      } catch {
        // ignore cleanup error
      }
      html5QrRef.current = null;
    }

    try {
      const html5Qr = new Html5Qrcode(containerId);
      html5QrRef.current = html5Qr;

      const qrConfig = {
        fps: 10,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.72);
          const size = Math.max(edge, 160);
          return { width: size, height: size };
        },
        aspectRatio: 1.333334,
      };

      const onScanSuccess = (decodedText: string) => {
        processScanPayload({ qrToken: decodedText });
      };

      const onScanFailure = () => {
        // Normal frame scanning failure, ignore
      };

      // Try environment (back) camera first; if desktop or front only, fallback
      try {
        await html5Qr.start(
          { facingMode: 'environment' },
          qrConfig,
          onScanSuccess,
          onScanFailure
        );
      } catch {
        // Fallback to front or default camera
        await html5Qr.start(
          { facingMode: 'user' },
          qrConfig,
          onScanSuccess,
          onScanFailure
        );
      }

      // Check and apply video element styles
      const videoEl = document.querySelector(`#${containerId} video`) as HTMLVideoElement | null;
      if (videoEl) {
        videoEl.style.width = '100%';
        videoEl.style.height = '100%';
        videoEl.style.objectFit = 'cover';
        videoEl.style.borderRadius = '0.75rem';
        if (videoEl.paused) {
          videoEl.play().catch(() => {});
        }
      }

      setCameraActive(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Permission') || msg.includes('denied') || msg.includes('NotAllowed')) {
        setCameraError('Camera access denied. Please allow camera permissions in your browser or use manual lookup.');
      } else {
        setCameraError('Unable to start camera. Please verify device permissions or use manual lookup.');
      }
      setCameraActive(false);
    } finally {
      setCameraStarting(false);
    }
  }, [processScanPayload]);

  // Camera Stop Routine
  const stopCamera = useCallback(async () => {
    setCameraStarting(false);
    if (html5QrRef.current) {
      try {
        if (html5QrRef.current.isScanning) {
          await html5QrRef.current.stop();
        }
        await html5QrRef.current.clear();
      } catch {
        // ignore
      }
      html5QrRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Cleanup Camera on unmount
  useEffect(() => {
    return () => {
      if (html5QrRef.current) {
        try {
          if (html5QrRef.current.isScanning) {
            html5QrRef.current.stop().then(() => {
              try {
                html5QrRef.current?.clear();
              } catch {}
            }).catch(() => {});
          } else {
            try {
              html5QrRef.current.clear();
            } catch {}
          }
        } catch {}
      }
    };
  }, []);

  // Manual Attendee Search
  const handleSearchAttendee = async () => {
    const q = manualQuery.trim();
    if (!q || manualSearching) return;

    setManualSearching(true);
    setScanResult(null);
    setSearchedAttendee(null);

    try {
      const res = await fetch(`/api/events/${eventSlug}/scan?search=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      const first = data.attendees?.[0] as AttendeeSummary | undefined;
      if (first) {
        setSearchedAttendee(first);
      } else {
        setScanResult({
          type: 'invalid',
          message: `No attendee found matching "${q}"`,
        });
      }
    } catch {
      setScanResult({
        type: 'error',
        message: 'Error searching for attendee',
      });
    } finally {
      setManualSearching(false);
    }
  };

  // Quick Action from Manual Form
  const handleManualAction = (regNo: string, actionOverride?: ScanMode) => {
    processScanPayload({
      registrationNumber: regNo,
    });
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto" />
          <p className="text-sm font-medium text-slate-400">Initializing Scanner Desk...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel rounded-2xl border border-red-500/20 p-6 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Scanner Access Denied</h2>
            <p className="text-xs text-slate-400 mt-1">{initError}</p>
          </div>
          <Link
            href={`/events/${eventSlug}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-500 transition"
          >
            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            Back to Event Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16 font-sans">
      {/* Top Action Bar with Top-Left Back Button */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-slate-200 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <BackButton
              href={`/events/${eventSlug}`}
              label={`Back to ${eventData?.name || 'Event'}`}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Scanner Ready
            </span>
            <button
              onClick={() => loadScanData()}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
              title="Refresh Scan Statistics"
            >
              <RefreshCw className="w-3 h-3 text-slate-400" />
              Sync Stats
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* Attendance Statistics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Roster
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.totalAttendees}</div>
          </div>
          <div className="bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs">
            <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Checked In
            </div>
            <div className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mt-0.5">{stats.checkedIn}</div>
          </div>
          <div className="bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/20 dark:bg-amber-950/20 shadow-xs">
            <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Checked Out
            </div>
            <div className="text-xl font-bold text-amber-800 dark:text-amber-300 mt-0.5">{stats.checkedOut}</div>
          </div>
          <div className="bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Not Checked In
            </div>
            <div className="text-xl font-bold text-slate-700 dark:text-slate-300 mt-0.5">{stats.notCheckedIn}</div>
          </div>
        </div>

        {/* Scan Mode Toggle */}
        <div className="bg-slate-200/80 dark:bg-slate-800/80 p-1.5 rounded-full flex gap-2">
          <button
            onClick={() => setMode('check_in')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-xs font-bold transition shadow-xs ${
              mode === 'check_in'
                ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Check In Mode
          </button>
          <button
            onClick={() => setMode('check_out')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-xs font-bold transition shadow-xs ${
              mode === 'check_out'
                ? 'bg-amber-600 text-white shadow-amber-500/20'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <LogOut className="w-4 h-4" />
            Check Out Mode
          </button>
        </div>

        {/* Result Notification Banner (Outside Camera) */}
        {scanResult && !cameraActive && (
          <div
            className={`rounded-xl border p-4.5 transition-all ${
              scanResult.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : scanResult.type === 'already'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <div className="flex items-start gap-3">
              {scanResult.type === 'success' && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              )}
              {scanResult.type === 'already' && (
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              {(scanResult.type === 'invalid' || scanResult.type === 'error') && (
                <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm">{scanResult.message}</div>
                {scanResult.name && (
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="font-semibold">{scanResult.name}</span>
                    <span className="font-mono bg-white/70 px-1.5 py-0.5 rounded border border-current">
                      {scanResult.regNo}
                    </span>
                    {scanResult.category && <span>({scanResult.category})</span>}
                  </div>
                )}
              </div>
              <button
                onClick={() => setScanResult(null)}
                className="text-current opacity-60 hover:opacity-100 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Camera Scanning Section */}
        <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Live Camera QR Scanner
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {cameraActive ? (
                <button
                  onClick={stopCamera}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition hover:scale-[1.02] active:scale-[0.98]"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                  Stop Camera
                </button>
              ) : (
                <button
                  onClick={startCamera}
                  disabled={cameraStarting || processing}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-full shadow-md shadow-teal-600/20 disabled:opacity-50 transition hover:scale-[1.02] active:scale-[0.98]"
                >
                  {cameraStarting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                  {cameraStarting ? 'Starting...' : 'Start Camera'}
                </button>
              )}
            </div>
          </div>

          {/* Camera Error Message */}
          {cameraError && (
            <div className="mx-4 sm:mx-5 mt-4 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-800">
              <CameraOff className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">{cameraError}</div>
            </div>
          )}

          {/* Viewfinder Viewport Container */}
          <div className="p-4 sm:p-5">
            <div
              className={`relative rounded-xl overflow-hidden bg-slate-950 min-h-[360px] flex items-center justify-center border transition-all duration-300 ${
                lastScanFlash === 'success'
                  ? 'border-emerald-500 ring-4 ring-emerald-500/50 shadow-[0_0_35px_rgba(16,185,129,0.5)]'
                  : lastScanFlash === 'already'
                  ? 'border-amber-500 ring-4 ring-amber-500/50 shadow-[0_0_35px_rgba(245,158,11,0.5)]'
                  : lastScanFlash === 'error'
                  ? 'border-red-500 ring-4 ring-red-500/50 shadow-[0_0_35px_rgba(239,68,68,0.5)]'
                  : 'border-slate-800'
              }`}
            >
              {/* Isolated Html5Qrcode Mount Point */}
              <div id={containerId} className="w-full flex items-center justify-center" />

              {/* Viewfinder HUD Overlays when Camera Active */}
              {cameraActive && !cameraStarting && (
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10">
                  {/* Top HUD: Mode Pill & Audio Toggle */}
                  <div className="flex items-center justify-between w-full">
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-lg border ${
                        mode === 'check_in'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      <span className="relative flex h-2 w-2">
                        <span
                          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                            mode === 'check_in' ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                        />
                        <span
                          className={`relative inline-flex rounded-full h-2 w-2 ${
                            mode === 'check_in' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                      </span>
                      <span className="tracking-wide">
                        {mode === 'check_in' ? 'CHECK-IN SCANNER' : 'CHECK-OUT SCANNER'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSoundEnabled((prev) => !prev)}
                      className="pointer-events-auto p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 backdrop-blur-md transition-colors"
                      title={soundEnabled ? 'Mute scanner chime' : 'Enable scanner chime'}
                    >
                      {soundEnabled ? (
                        <Volume2 className="w-4 h-4 text-teal-400" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>

                  {/* Centered Reticle with Corner Accents & Laser Sweeper */}
                  <div className="relative self-center w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
                    <div
                      className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                        lastScanFlash === 'success'
                          ? 'border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.8)]'
                          : lastScanFlash === 'already'
                          ? 'border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.8)]'
                          : lastScanFlash === 'error'
                          ? 'border-2 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.8)]'
                          : 'border border-teal-500/30'
                      }`}
                    >
                      {/* 4 Illuminated Corners */}
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-teal-400 rounded-tl-lg shadow-[0_0_10px_#2dd4bf]" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-teal-400 rounded-tr-lg shadow-[0_0_10px_#2dd4bf]" />
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-teal-400 rounded-bl-lg shadow-[0_0_10px_#2dd4bf]" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-teal-400 rounded-br-lg shadow-[0_0_10px_#2dd4bf]" />

                      {/* Center Crosshair Marker */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-40">
                        <div className="w-6 h-[1px] bg-teal-300" />
                        <div className="h-6 w-[1px] bg-teal-300 absolute" />
                      </div>
                    </div>
                  </div>

                  {/* Bottom Viewfinder Result Overlay or Scanning Instruction */}
                  {!scanResult ? (
                    <div className="text-center">
                      <p className="inline-block px-3 py-1 rounded-full bg-slate-900/80 text-[11px] font-medium text-slate-300 border border-slate-700 backdrop-blur-md">
                        Align attendee QR code within the frame
                      </p>
                    </div>
                  ) : (
                    /* Live Result Confirmation Card Inside Viewfinder */
                    <div className="pointer-events-auto transition-all duration-300">
                      <div
                        className={`rounded-xl p-3.5 backdrop-blur-md border shadow-2xl ${
                          scanResult.type === 'success'
                            ? 'bg-emerald-950/95 border-emerald-500/60 text-white'
                            : scanResult.type === 'already'
                            ? 'bg-amber-950/95 border-amber-500/60 text-white'
                            : 'bg-red-950/95 border-red-500/60 text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg shrink-0 ${
                              scanResult.type === 'success'
                                ? 'bg-emerald-500 text-slate-950'
                                : scanResult.type === 'already'
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-red-500 text-white'
                            }`}
                          >
                            {scanResult.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                            {scanResult.type === 'already' && <AlertCircle className="w-5 h-5" />}
                            {(scanResult.type === 'invalid' || scanResult.type === 'error') && (
                              <XCircle className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded ${
                                  scanResult.type === 'success'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : scanResult.type === 'already'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                }`}
                              >
                                {scanResult.type === 'success'
                                  ? mode === 'check_in'
                                    ? '✓ CHECKED IN'
                                    : '✓ CHECKED OUT'
                                  : scanResult.type === 'already'
                                  ? mode === 'check_in'
                                    ? 'ALREADY CHECKED IN'
                                    : 'ALREADY CHECKED OUT'
                                  : 'SCAN REJECTED'}
                              </span>
                              <span className="text-xs text-slate-200 truncate font-medium">
                                {scanResult.message}
                              </span>
                            </div>
                            {scanResult.name && (
                              <div className="mt-1">
                                <p className="text-sm font-bold text-white truncate">
                                  {scanResult.name}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5">
                                  <span className="font-mono bg-slate-900/80 px-1.5 py-0.5 rounded text-teal-300 font-semibold border border-slate-700">
                                    {scanResult.regNo}
                                  </span>
                                  {scanResult.category && <span>• {scanResult.category}</span>}
                                </div>
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setScanResult(null)}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                            title="Dismiss overlay"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Viewfinder Placeholder when Camera is off */}
              {!cameraActive && !cameraStarting && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-sm gap-3 p-6 text-center z-10 pointer-events-none bg-slate-950">
                  <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                    <QrCode className="w-8 h-8 text-teal-400/80" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-200 text-base">Camera Viewfinder is Inactive</p>
                    <p className="text-xs text-slate-400 max-w-xs">
                      Click &ldquo;Start Camera&rdquo; to scan delegate badges or enter registration number manually below.
                    </p>
                  </div>
                </div>
              )}

              {/* Viewfinder Initializing Spinner */}
              {cameraStarting && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-3 z-10 text-white">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
                  <p className="text-sm font-medium">Starting camera video stream...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Manual Lookup & Search Desk */}
        <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Manual Lookup &amp; Fast Check-In Desk
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchAttendee();
                }}
                placeholder="Enter registration number e.g. CONF-DEL-0100 or Name..."
                className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                disabled={manualSearching || processing}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSearchAttendee}
                disabled={manualSearching || !manualQuery.trim() || processing}
                className="flex items-center justify-center gap-1.5 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold px-5 py-2.5 disabled:opacity-50 transition hover:scale-[1.02] active:scale-[0.98]"
              >
                {manualSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Lookup
              </button>
              <button
                onClick={() => handleManualAction(manualQuery.trim())}
                disabled={processing || !manualQuery.trim()}
                className={`flex items-center justify-center gap-1.5 rounded-full text-white text-sm font-bold px-6 py-2.5 disabled:opacity-50 transition hover:scale-[1.02] active:scale-[0.98] shadow-md ${
                  mode === 'check_in'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                    : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                }`}
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : mode === 'check_in' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    Check In
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    Check Out
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Searched Attendee Preview Card */}
          {searchedAttendee && (
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                    {searchedAttendee.registrationNumber}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {searchedAttendee.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <span>{searchedAttendee.category}</span>
                    {searchedAttendee.medicalCouncilNumber && (
                      <>
                        <span>•</span>
                        <span>Council: {searchedAttendee.medicalCouncilNumber}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>Food: {searchedAttendee.foodPreference || 'Standard'}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                      searchedAttendee.attendanceStatus === 'checked_in'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : searchedAttendee.attendanceStatus === 'checked_out'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {searchedAttendee.attendanceStatus === 'checked_in'
                      ? 'Checked In'
                      : searchedAttendee.attendanceStatus === 'checked_out'
                      ? 'Checked Out'
                      : 'Not Checked In'}
                  </span>
                </div>
              </div>

              {/* Action Buttons for Searched Attendee */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <button
                  onClick={() => {
                    modeRef.current = 'check_in';
                    processScanPayload({ registrationNumber: searchedAttendee.registrationNumber });
                  }}
                  disabled={processing || searchedAttendee.attendanceStatus === 'checked_in'}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-50 transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  {searchedAttendee.attendanceStatus === 'checked_in'
                    ? 'Already Checked In'
                    : 'Check In Attendee'}
                </button>
                <button
                  onClick={() => {
                    modeRef.current = 'check_out';
                    processScanPayload({ registrationNumber: searchedAttendee.registrationNumber });
                  }}
                  disabled={processing || searchedAttendee.attendanceStatus === 'checked_out'}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold disabled:opacity-50 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Check Out Attendee
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Attendance History Feed */}
        <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Event Scans Stream
              </h3>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500">Latest 25 desk scans</span>
          </div>

          {recentScans.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
              No scans recorded for this event yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-80 overflow-y-auto">
              {recentScans.map((scan) => (
                <div
                  key={scan.id}
                  className="px-4 py-3 sm:px-5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        scan.action === 'check_in' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-white truncate">
                        {scan.attendeeName}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px] truncate">
                        {scan.registrationNumber} • {scan.category}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        scan.action === 'check_in'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                      }`}
                    >
                      {scan.action === 'check_in' ? 'Check In' : 'Check Out'}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 text-[11px] hidden sm:inline">
                      {new Date(scan.scannedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
