import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../navigation/BackButton';
import { 
  QrCode, 
  Camera, 
  CameraOff, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  Clock, 
  Sparkles, 
  RefreshCw,
  LogOut,
  LogIn
} from 'lucide-react';
import { Attendee } from '../../types';

export const QrScannerPage: React.FC = () => {
  const { 
    currentEvent, 
    recordScan, 
    attendees, 
    recentScans, 
    currentUser, 
    addToast 
  } = useApp();

  const [scanMode, setScanMode] = useState<'check-in' | 'check-out'>('check-in');
  const [isScanning, setIsScanning] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(currentUser.soundEnabled ?? true);
  
  // Status states: 'ready' | 'scanning' | 'success' | 'already-processed' | 'invalid' | 'camera-denied'
  const [scanState, setScanState] = useState<'ready' | 'scanning' | 'success' | 'already-processed' | 'invalid'>('scanning');
  const [lastScannedAttendee, setLastScannedAttendee] = useState<Attendee | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('Scanner reticle active. Point camera or pick demo badge below.');
  const [manualCode, setManualCode] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);

  // Play audio chime if enabled
  const playBeep = (type: 'success' | 'error') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      if (type === 'success') {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch A5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      } else {
        osc.frequency.setValueAtTime(330, audioCtx.currentTime); // Low buzz
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      }
    } catch {
      // AudioContext unavailable or suppressed
    }
  };

  const handleProcessCode = (code: string) => {
    if (!code.trim()) return;
    const result = recordScan(code, scanMode);

    if (result.success && result.attendee) {
      setScanState('success');
      setLastScannedAttendee(result.attendee);
      setFeedbackMessage(result.message);
      playBeep('success');
    } else if (result.attendee) {
      setScanState('already-processed');
      setLastScannedAttendee(result.attendee);
      setFeedbackMessage(result.message);
      playBeep('error');
    } else {
      setScanState('invalid');
      setLastScannedAttendee(null);
      setFeedbackMessage(result.message);
      playBeep('error');
    }

    setManualCode('');
  };

  const toggleScanner = () => {
    setIsScanning(!isScanning);
    if (!isScanning) {
      setScanState('scanning');
      setFeedbackMessage('Camera optical scanner active.');
    } else {
      setScanState('ready');
      setFeedbackMessage('Scanner paused.');
    }
  };

  return (
    <div className="w-full pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <BackButton label="Back to Dashboard" targetRoute="dashboard" />
            <div className="pt-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Gate Optical Turnstile</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">QR Access Scanner</h1>
              <p className="text-xs text-slate-400">
                {currentEvent.name} · Operator: <span className="text-slate-200">{currentUser.name}</span>
              </p>
            </div>
          </div>

          {/* Mode Switcher & Controls */}
          <div className="flex items-center gap-2">
            {/* Check-In / Check-Out Toggle */}
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setScanMode('check-in')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  scanMode === 'check-in' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Check-In</span>
              </button>
              <button
                onClick={() => setScanMode('check-out')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  scanMode === 'check-out' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Check-Out</span>
              </button>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Disable audio chimes' : 'Enable audio chimes'}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Start/Stop Camera */}
            <button
              onClick={toggleScanner}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                isScanning ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60' : 'bg-indigo-600 text-white'
              }`}
            >
              {isScanning ? (
                <>
                  <CameraOff className="w-3.5 h-3.5" />
                  <span>Pause Lens</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5" />
                  <span>Activate Lens</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2-COLUMN LAYOUT: CAMERA VIEWFINDER & LIVE RESULT BANNER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* CAMERA VIEWFINDER (COL 1-7) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-[4/3] rounded-3xl glass-panel border border-slate-800 overflow-hidden flex flex-col items-center justify-center p-6 shadow-2xl bg-slate-950">
              
              {/* Camera Simulation Viewport */}
              {isScanning ? (
                <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-900/60 border border-slate-800/80 flex items-center justify-center">
                  {/* Subtle Grid Backdrop */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />

                  {/* Scanning Laser Animation */}
                  <div className="absolute left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_12px_#6366f1] animate-[pulse_1.5s_ease-in-out_infinite]" />

                  {/* Optical Reticle Box */}
                  <div className="relative w-56 h-56 rounded-2xl border-2 border-indigo-500/50 flex items-center justify-center">
                    {/* Reticle Corner Marks */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-indigo-400" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-indigo-400" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-indigo-400" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-indigo-400" />
                    <QrCode className="w-16 h-16 text-indigo-400/30" />
                  </div>

                  {/* Status Overlay Pill */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full glass-dock text-[11px] font-mono font-medium text-slate-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Mode: {scanMode.toUpperCase()} · Standby for QR</span>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8">
                  <CameraOff className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-300">Scanner Lens Inactive</p>
                  <p className="text-xs text-slate-500 mt-1">Click "Activate Lens" to resume camera decoding.</p>
                </div>
              )}
            </div>

            {/* MANUAL REGISTRATION CODE INPUT */}
            <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex items-center gap-3">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleProcessCode(manualCode);
                }}
                placeholder="Manual turnstile entry (e.g. APX-1001 or barcode)..."
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={() => handleProcessCode(manualCode)}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-sm"
              >
                Validate
              </button>
            </div>

            {/* PROTOTYPE DEMO SHORTCUTS PANEL */}
            <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-300">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Simulated Optical Scan Shortcuts</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Demo Mode</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Click any attendee badge key below to test instant optical recognition without physical hardware:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {attendees.slice(0, 5).map(att => (
                  <button
                    key={att.id}
                    onClick={() => handleProcessCode(att.qrCodeData)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 transition-colors flex items-center gap-1.5"
                  >
                    <span className="font-mono text-indigo-400 font-bold">{att.registrationNumber}</span>
                    <span>{att.fullName}</span>
                  </button>
                ))}
                <button
                  onClick={() => handleProcessCode('UNKNOWN-CODE-999')}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-xs text-rose-300 transition-colors"
                >
                  Test Invalid QR
                </button>
              </div>
            </div>
          </div>

          {/* ATTENDEE STATUS FEEDBACK & AUDIT STREAM (COL 8-12) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* ACTIVE SCAN RESULT BANNER */}
            <div className={`p-6 rounded-3xl glass-panel border transition-all duration-200 ${
              scanState === 'success'
                ? 'border-emerald-500/50 bg-emerald-950/10'
                : scanState === 'already-processed'
                ? 'border-amber-500/50 bg-amber-950/10'
                : scanState === 'invalid'
                ? 'border-rose-500/50 bg-rose-950/10'
                : 'border-slate-800 bg-slate-900/30'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                {scanState === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {scanState === 'already-processed' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {scanState === 'invalid' && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {scanState === 'scanning' && <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />}
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Turnstile Status
                </span>
              </div>

              <p className="text-sm font-semibold text-white leading-snug">
                {feedbackMessage}
              </p>

              {/* Attendee Details Card if Recognized */}
              {lastScannedAttendee && (
                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Registration #</span>
                    <span className="font-mono font-bold text-indigo-400 text-sm">
                      {lastScannedAttendee.registrationNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Delegate Name</span>
                    <span className="font-semibold text-white">{lastScannedAttendee.fullName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Tier / Category</span>
                    <span className="font-medium text-slate-300">{lastScannedAttendee.category}</span>
                  </div>
                  {lastScannedAttendee.company && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Company</span>
                      <span className="text-slate-300">{lastScannedAttendee.company}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Turnstile Time</span>
                    <span className="font-mono text-emerald-400">{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* RECENT SCAN HISTORY TABLE */}
            <div className="rounded-3xl glass-panel p-5 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Turnstile History
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {recentScans.length} scans
                </span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {recentScans.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70 text-xs flex items-center justify-between"
                  >
                    <div className="space-y-0.5 truncate pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-indigo-300">{log.regNumber}</span>
                        <span className="font-medium text-white truncate">{log.attendeeName}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{log.message}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                        log.status === 'Success' ? 'text-emerald-400 bg-emerald-950/40' : 'text-amber-400 bg-amber-950/40'
                      }`}>
                        {log.type.toUpperCase()}
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{log.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
