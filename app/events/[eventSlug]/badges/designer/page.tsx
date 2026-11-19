'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useToast } from '@/app/components/ui/Toast';
import BackButton from '@/app/components/ui/BackButton';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';
import BadgeInteractiveCanvas, { EditableBadgeElement } from '@/app/components/badges/BadgeInteractiveCanvas';
import BadgeSheetPrintModal from '@/app/components/badges/BadgeSheetPrintModal';
import {
  BUILT_IN_BADGE_TEMPLATES,
  CATEGORIZED_BADGE_TEMPLATES,
  BADGE_CATEGORIES,
  BadgeTemplateDef,
  BackgroundColorConfig,
  generateSvgBackground,
} from '@/lib/badges/templates';
import {
  Save,
  RotateCcw,
  Printer,
  Loader2,
  CheckCircle2,
  AlertCircle,
  QrCode,
  User,
  Sliders,
  Maximize2,
  Sparkles,
  Layers,
  Type,
  Palette,
  Check,
  Upload,
  Image as ImageIcon,
  Trash2,
  FolderOpen,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { BadgeLayoutData, AttendeeBadgeData } from '@/app/components/BadgeRenderer';

const PRESET_BADGE_DIMENSIONS = [
  { id: '4x6', name: '4" × 6" Standard Badge (A6 Sheet / Thermal)', width: 4, height: 6 },
  { id: 'a4_full', name: 'Full A4 Sheet Size (8.27" × 11.69")', width: 8.27, height: 11.69 },
  { id: 'a4_four', name: 'A4 Sheet 4-Up (4.13" × 5.84" Borderless)', width: 4.13, height: 5.84 },
  { id: '4x3', name: '4" × 3" Conference Badge', width: 4, height: 3 },
  { id: '4x4', name: '4" × 4" Square Badge', width: 4, height: 4 },
  { id: '3x2', name: '3" × 2" Label / Sticker', width: 3, height: 2 },
];

const SAMPLE_ATTENDEES: Record<string, AttendeeBadgeData> = {
  standard: {
    id: 'sample-1',
    name: 'Surya Kumar',
    registrationNumber: 'PMCON-1001',
    category: 'Delegate',
    qrToken: 'e0123456-789a-bcde-f012-3456789abcde',
    medicalCouncilNumber: 'MCI-88912',
  },
  executive: {
    id: 'sample-2',
    name: 'Surya Kumar',
    registrationNumber: 'SUMMIT-2024',
    category: 'Keynote Speaker',
    qrToken: 'f1234567-89ab-cdef-0123-456789abcdef',
    medicalCouncilNumber: 'TMC-94812',
  },
  longName: {
    id: 'sample-3',
    name: 'Surya Kumar MD PhD (Senior Fellow)',
    registrationNumber: 'PMCON-5012',
    category: 'Faculty Member',
    qrToken: 'a1234567-bcde-f012-3456-789abcdef012',
    medicalCouncilNumber: 'MCI-99411',
  },
};

export default function BadgeLayoutDesignerPage() {
  const params = useParams();
  const eventSlug = params.eventSlug as string;
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [eventData, setEventData] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [sampleKey, setSampleKey] = useState<string>('standard');
  const [previewScale, setPreviewScale] = useState<number>(0.75);

  // Template Category Tab Selection
  const [activeCategory, setActiveCategory] = useState<string>('Conference & Summit');

  // Direct Interactive Selection
  const [selectedElement, setSelectedElement] = useState<EditableBadgeElement | null>('name');

  // Sheet Print Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Reset Confirmation State
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Dimension Unit State (Inches vs Millimeters)
  const [dimensionUnit, setDimensionUnit] = useState<'in' | 'mm'>('in');

  // Custom Background Palette State
  const [bgPalette, setBgPalette] = useState<BackgroundColorConfig>({
    headerColor: '#1e3a8a',
    accentColor: '#3b82f6',
    bgColor: '#ffffff',
    footerColor: '#0f172a',
    pattern: 'modern',
  });

  // Active Layout State
  const [layout, setLayout] = useState<BadgeLayoutData>({
    badgeWidthIn: 4,
    badgeHeightIn: 6,
    backgroundImageUrl: '/Empty_Sample.png',
    showBackground: true,
    registration: {
      top: 2.10,
      left: 0.25,
      width: 3.50,
      fontSize: 0.22,
      color: '#cf252b',
      textAlign: 'center',
      visible: true,
    },
    qr: {
      top: 2.42,
      left: 1.35,
      size: 1.30,
    },
    name: {
      top: 3.85,
      left: 0.25,
      width: 3.50,
      fontSize: 0.25,
      color: '#0f172a',
      textAlign: 'center',
      visible: true,
    },
    category: {
      top: 4.55,
      left: 0.25,
      width: 3.50,
      fontSize: 0.20,
      color: '#475569',
      textAlign: 'center',
      visible: true,
    },
    medicalCouncilNumber: {
      top: 4.90,
      left: 0.25,
      width: 3.50,
      fontSize: 0.16,
      color: '#64748b',
      textAlign: 'center',
      visible: false,
    },
    organizationName: {
      top: 0.50,
      left: 0.25,
      width: 3.50,
      fontSize: 0.18,
      color: '#0f172a',
      textAlign: 'center',
      visible: false,
    },
    eventName: {
      top: 5.40,
      left: 0.25,
      width: 3.50,
      fontSize: 0.16,
      color: '#94a3b8',
      textAlign: 'center',
      visible: false,
    },
    pageSize: {
      preset: 'A6',
      name: 'A6 (4 Badges per A4 sheet)',
      width_mm: 210,
      height_mm: 297,
      columns: 2,
      rows: 2,
    },
  });

  // Load Saved Layout & Context
  const loadLayout = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/events/${eventSlug}/badges/layout`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}: Failed to load badge layout`);
      }
      const data = await res.json();
      if (data.layout) {
        setLayout((prev) => ({
          ...prev,
          ...data.layout,
        }));
      }

      const settingsCheck = await fetch(`/api/events/${eventSlug}/settings`);
      if (settingsCheck.ok) {
        const sData = await settingsCheck.json();
        setEventData(sData.event);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load layout configuration';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }, [eventSlug]);

  useEffect(() => {
    loadLayout();
  }, [loadLayout]);

  // Save Layout
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/events/${eventSlug}/badges/layout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(layout),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error || 'Failed to save badge layout configuration';
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }

      setSaveSuccess(true);
      toast.success('Badge layout template saved successfully!');
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving layout configuration';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Center QR helper
  const handleCenterQr = () => {
    const qrSize = layout.qr.size;
    const badgeW = layout.badgeWidthIn;
    const centeredLeft = Math.max(0, Math.round(((badgeW - qrSize) / 2) * 100) / 100);
    setLayout((prev) => ({
      ...prev,
      qr: {
        ...prev.qr,
        left: centeredLeft,
      },
    }));
    toast.info('QR code centered horizontally.');
  };

  // Apply Built-in Template
  const handleApplyTemplate = (tpl: BadgeTemplateDef) => {
    let bgUrl = tpl.layout.backgroundImageUrl;
    if (tpl.bgConfig) {
      bgUrl = generateSvgBackground(tpl.bgConfig);
      setBgPalette(tpl.bgConfig);
    }

    setLayout((prev) => ({
      ...prev,
      ...tpl.layout,
      backgroundImageUrl: bgUrl,
      showBackground: true,
      badgeWidthIn: tpl.badgeWidthIn,
      badgeHeightIn: tpl.badgeHeightIn,
    }));
    toast.success(`Applied template: ${tpl.name}`);
  };

  // Handle User Uploading Background Artwork
  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image size exceeds 8MB limit. Please compress the image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setLayout((prev) => ({
          ...prev,
          backgroundImageUrl: dataUrl,
          showBackground: true,
        }));
        toast.success(`Custom background "${file.name}" uploaded successfully!`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Update Background Palette Element Colors live
  const updateBgPaletteColor = (key: keyof BackgroundColorConfig, value: string) => {
    const updated = { ...bgPalette, [key]: value };
    setBgPalette(updated);
    const newSvg = generateSvgBackground(updated);
    setLayout((prev) => ({
      ...prev,
      backgroundImageUrl: newSvg,
      showBackground: true,
    }));
  };

  // Reset to default
  const handleConfirmReset = () => {
    setLayout({
      badgeWidthIn: 4,
      badgeHeightIn: 6,
      backgroundImageUrl: '/Empty_Sample.png',
      showBackground: true,
      registration: {
        top: 2.10,
        left: 0.25,
        width: 3.50,
        fontSize: 0.22,
        color: '#cf252b',
        textAlign: 'center',
        visible: true,
      },
      qr: {
        top: 2.42,
        left: 1.35,
        size: 1.30,
      },
      name: {
        top: 3.85,
        left: 0.25,
        width: 3.50,
        fontSize: 0.25,
        color: '#0f172a',
        textAlign: 'center',
        visible: true,
      },
      category: {
        top: 4.55,
        left: 0.25,
        width: 3.50,
        fontSize: 0.20,
        color: '#475569',
        textAlign: 'center',
        visible: true,
      },
      medicalCouncilNumber: {
        top: 4.90,
        left: 0.25,
        width: 3.50,
        fontSize: 0.16,
        color: '#64748b',
        textAlign: 'center',
        visible: false,
      },
      organizationName: {
        top: 0.50,
        left: 0.25,
        width: 3.50,
        fontSize: 0.18,
        color: '#0f172a',
        textAlign: 'center',
        visible: false,
      },
      eventName: {
        top: 5.40,
        left: 0.25,
        width: 3.50,
        fontSize: 0.16,
        color: '#94a3b8',
        textAlign: 'center',
        visible: false,
      },
      pageSize: {
        preset: 'A6',
        name: 'A6 (4 Badges per A4 sheet)',
        width_mm: 210,
        height_mm: 297,
        columns: 2,
        rows: 2,
      },
    });
    setShowResetConfirm(false);
    toast.info('Badge layout reset to standard 4" × 6" defaults.');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading Interactive Badge Designer…</p>
        </div>
      </div>
    );
  }

  const activeSampleAttendee = SAMPLE_ATTENDEES[sampleKey] || SAMPLE_ATTENDEES.standard;
  const currentCategoryTemplates = CATEGORIZED_BADGE_TEMPLATES[activeCategory] || BUILT_IN_BADGE_TEMPLATES.slice(0, 5);

  return (
    <div className="pb-20 font-sans">
      {/* Top Action Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <BackButton
              href={`/events/${eventSlug}/badges`}
              label="Back to Badge Desk"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPrintModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full shadow-xs transition hover:scale-[1.02] active:scale-[0.98]"
              title="Configure A4 Sheet, 4-up borderless, or single print"
            >
              <Printer className="w-3.5 h-3.5 text-blue-500" />
              Sheet Print Setup
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 rounded-full shadow-md shadow-blue-600/20 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Saving Layout…' : 'Save Layout'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Designer Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Status / Error Alerts */}
        {saveSuccess && (
          <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">Badge layout successfully saved and active for this event.</span>
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2.5 text-xs text-red-800 dark:text-red-300">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 5 CATEGORIES × 5 TEMPLATES SHOWCASE BAR */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Category Templates (5 Categories • 25 Unique Layouts)
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Select category to load specialized backgrounds &amp; field placements
            </span>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-800/80 mb-3.5">
            {BADGE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 5 Templates under Active Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {currentCategoryTemplates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleApplyTemplate(tpl)}
                className="group p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:border-blue-500 hover:shadow-md text-left transition-all flex flex-col justify-between min-h-[96px]"
              >
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 leading-tight">
                    {tpl.name}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1 line-clamp-2">
                    {tpl.description}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 mt-2">
                  <span className="text-[9px] font-mono text-slate-400">
                    {tpl.badgeWidthIn}&quot; × {tpl.badgeHeightIn}&quot;
                  </span>
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Apply →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Studio Grid: Canvas (Left) + Inspector & Background Controls (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Live Movable Canvas (5 cols) */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
            <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Interactive Movable Canvas
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Click any field to drag, resize, or nudge with keyboard arrows
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400">Zoom:</span>
                  <select
                    value={previewScale}
                    onChange={(e) => setPreviewScale(parseFloat(e.target.value))}
                    className="border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    <option value={0.5}>50%</option>
                    <option value={0.65}>65%</option>
                    <option value={0.75}>75% (Ideal)</option>
                    <option value={0.9}>90%</option>
                    <option value={1.0}>100%</option>
                  </select>
                </div>
              </div>

              {/* Sample Attendee Preview Switcher */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Preview Data:</span>
                <div className="flex gap-1">
                  {(['standard', 'executive', 'longName'] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSampleKey(key)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                        sampleKey === key
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {key === 'standard' ? 'Standard' : key === 'executive' ? 'Keynote' : 'Long Name'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Canvas Render */}
              <div className="flex justify-center p-4 bg-slate-100/70 dark:bg-slate-950/60 rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 min-h-[380px] items-center">
                <BadgeInteractiveCanvas
                  layout={layout}
                  attendee={activeSampleAttendee}
                  scale={previewScale}
                  selectedElement={selectedElement}
                  onSelectElement={setSelectedElement}
                  onChangeLayout={setLayout}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>
                  Physical Size: {layout.badgeWidthIn}&quot; × {layout.badgeHeightIn}&quot;
                </span>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-red-500 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Defaults
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Dimensions, Custom Backgrounds, Color Customizer, Element Inspector (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Badge Sizing, Presets & Custom Dimensions */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Maximize2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Badge Dimensions &amp; Sheet Formats
                </h3>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setDimensionUnit('in')}
                    className={`px-2.5 py-0.5 rounded-md transition ${
                      dimensionUnit === 'in' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Inches
                  </button>
                  <button
                    type="button"
                    onClick={() => setDimensionUnit('mm')}
                    className={`px-2.5 py-0.5 rounded-md transition ${
                      dimensionUnit === 'mm' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    mm
                  </button>
                </div>
              </div>

              {/* Preset buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_BADGE_DIMENSIONS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      setLayout((prev) => ({
                        ...prev,
                        badgeWidthIn: preset.width,
                        badgeHeightIn: preset.height,
                      }))
                    }
                    className={`p-2.5 rounded-xl border text-left transition text-xs ${
                      layout.badgeWidthIn === preset.width && layout.badgeHeightIn === preset.height
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-semibold ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold truncate">{preset.name}</div>
                  </button>
                ))}
              </div>

              {/* Custom Width & Height Inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Custom Width ({dimensionUnit})
                  </label>
                  <input
                    type="number"
                    step={dimensionUnit === 'in' ? '0.05' : '1'}
                    min="1"
                    value={
                      dimensionUnit === 'in'
                        ? layout.badgeWidthIn
                        : Math.round(layout.badgeWidthIn * 25.4)
                    }
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setLayout((prev) => ({
                        ...prev,
                        badgeWidthIn: dimensionUnit === 'in' ? val : Math.round((val / 25.4) * 100) / 100,
                      }));
                    }}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Custom Height ({dimensionUnit})
                  </label>
                  <input
                    type="number"
                    step={dimensionUnit === 'in' ? '0.05' : '1'}
                    min="1"
                    value={
                      dimensionUnit === 'in'
                        ? layout.badgeHeightIn
                        : Math.round(layout.badgeHeightIn * 25.4)
                    }
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setLayout((prev) => ({
                        ...prev,
                        badgeHeightIn: dimensionUnit === 'in' ? val : Math.round((val / 25.4) * 100) / 100,
                      }));
                    }}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="showBackgroundCheck"
                    checked={layout.showBackground}
                    onChange={(e) =>
                      setLayout((prev) => ({ ...prev, showBackground: e.target.checked }))
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="showBackgroundCheck" className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    Show Artwork
                  </label>
                </div>
              </div>
            </div>

            {/* 2. Custom Background Upload & Vector Color Customizer */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Background Artwork &amp; Color Customizer
                </h3>
              </div>

              {/* Upload Own Background */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <ImageIcon className="w-5 h-5 text-blue-500 shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                      Upload Custom Badge Artwork
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Upload PNG, JPG, or SVG banner background (Max 8MB)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload File
                  </button>
                  {layout.backgroundImageUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        setLayout((prev) => ({
                          ...prev,
                          backgroundImageUrl: null,
                          showBackground: false,
                        }))
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      title="Clear Background"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Background Element Color Controls */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-800 dark:text-white block">
                  Change Background Element Colors
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Header Color */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">
                      Header Banner
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={bgPalette.headerColor}
                        onChange={(e) => updateBgPaletteColor('headerColor', e.target.value)}
                        className="w-7 h-7 rounded border border-slate-300 dark:border-slate-600 cursor-pointer p-0"
                      />
                      <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                        {bgPalette.headerColor}
                      </span>
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">
                      Accent Trim
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={bgPalette.accentColor}
                        onChange={(e) => updateBgPaletteColor('accentColor', e.target.value)}
                        className="w-7 h-7 rounded border border-slate-300 dark:border-slate-600 cursor-pointer p-0"
                      />
                      <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                        {bgPalette.accentColor}
                      </span>
                    </div>
                  </div>

                  {/* Card Background */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">
                      Card Base
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={bgPalette.bgColor}
                        onChange={(e) => updateBgPaletteColor('bgColor', e.target.value)}
                        className="w-7 h-7 rounded border border-slate-300 dark:border-slate-600 cursor-pointer p-0"
                      />
                      <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                        {bgPalette.bgColor}
                      </span>
                    </div>
                  </div>

                  {/* Footer Color */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">
                      Footer Accent
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={bgPalette.footerColor}
                        onChange={(e) => updateBgPaletteColor('footerColor', e.target.value)}
                        className="w-7 h-7 rounded border border-slate-300 dark:border-slate-600 cursor-pointer p-0"
                      />
                      <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                        {bgPalette.footerColor}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pattern selector */}
                <div className="flex items-center gap-2 pt-1 text-xs">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Background Pattern Style:
                  </span>
                  <div className="flex gap-1">
                    {(['modern', 'waves', 'geometric', 'tech', 'minimal'] as const).map((pat) => (
                      <button
                        key={pat}
                        type="button"
                        onClick={() => {
                          const updated = { ...bgPalette, pattern: pat };
                          setBgPalette(updated);
                          const newSvg = generateSvgBackground(updated);
                          setLayout((prev) => ({
                            ...prev,
                            backgroundImageUrl: newSvg,
                            showBackground: true,
                          }));
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize transition ${
                          bgPalette.pattern === pat
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {pat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Active Element Property Inspector */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Element Inspector: <span className="text-blue-600 dark:text-blue-400 uppercase">{selectedElement || 'None'}</span>
                  </h3>
                </div>
                {selectedElement === 'qr' && (
                  <button
                    type="button"
                    onClick={handleCenterQr}
                    className="text-xs text-blue-700 dark:text-blue-300 font-semibold bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800"
                  >
                    Center Horizontally
                  </button>
                )}
              </div>

              {/* Element Switcher Pills */}
              <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                {(
                  [
                    { id: 'name', label: 'Attendee Name' },
                    { id: 'registration', label: 'Registration No' },
                    { id: 'qr', label: 'QR Code' },
                    { id: 'category', label: 'Category' },
                    { id: 'organizationName', label: 'Company / Org' },
                    { id: 'eventName', label: 'Event Name' },
                    { id: 'medicalCouncilNumber', label: 'Designation' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedElement(item.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      selectedElement === item.id
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Property Fields for Selected Element */}
              {selectedElement === 'qr' ? (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Top (in)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={layout.qr.top}
                      onChange={(e) =>
                        setLayout((prev) => ({
                          ...prev,
                          qr: { ...prev.qr, top: parseFloat(e.target.value) || 0 },
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Left (in)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={layout.qr.left}
                      onChange={(e) =>
                        setLayout((prev) => ({
                          ...prev,
                          qr: { ...prev.qr, left: parseFloat(e.target.value) || 0 },
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Size (in)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.5"
                      value={layout.qr.size}
                      onChange={(e) =>
                        setLayout((prev) => ({
                          ...prev,
                          qr: { ...prev.qr, size: parseFloat(e.target.value) || 1 },
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              ) : selectedElement ? (
                <div className="space-y-4">
                  {(() => {
                    const elKey = selectedElement;
                    const style =
                      elKey === 'name'
                        ? layout.name
                        : elKey === 'registration'
                        ? layout.registration
                        : elKey === 'category'
                        ? layout.category || { top: 4.55, left: 0.25, width: 3.5, fontSize: 0.2, color: '#475569', textAlign: 'center', visible: true }
                        : elKey === 'organizationName'
                        ? layout.organizationName || { top: 0.5, left: 0.25, width: 3.5, fontSize: 0.18, color: '#0f172a', textAlign: 'center', visible: false }
                        : elKey === 'eventName'
                        ? layout.eventName || { top: 5.4, left: 0.25, width: 3.5, fontSize: 0.16, color: '#94a3b8', textAlign: 'center', visible: false }
                        : layout.medicalCouncilNumber || { top: 4.9, left: 0.25, width: 3.5, fontSize: 0.16, color: '#64748b', textAlign: 'center', visible: false };

                    const updateStyle = (key: string, val: any) => {
                      setLayout((prev) => ({
                        ...prev,
                        [elKey]: {
                          ...((prev as any)[elKey] || {}),
                          [key]: val,
                        },
                      }));
                    };

                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Top (in)
                            </label>
                            <input
                              type="number"
                              step="0.05"
                              value={style.top}
                              onChange={(e) => updateStyle('top', parseFloat(e.target.value) || 0)}
                              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Left (in)
                            </label>
                            <input
                              type="number"
                              step="0.05"
                              value={style.left}
                              onChange={(e) => updateStyle('left', parseFloat(e.target.value) || 0)}
                              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Width (in)
                            </label>
                            <input
                              type="number"
                              step="0.05"
                              value={style.width}
                              onChange={(e) => updateStyle('width', parseFloat(e.target.value) || 0)}
                              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Font Size (in)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={style.fontSize}
                              onChange={(e) => updateStyle('fontSize', parseFloat(e.target.value) || 0.1)}
                              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Color
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={style.color}
                                onChange={(e) => updateStyle('color', e.target.value)}
                                className="w-8 h-8 rounded border border-slate-300 dark:border-slate-700 cursor-pointer p-0"
                              />
                              <input
                                type="text"
                                value={style.color}
                                onChange={(e) => updateStyle('color', e.target.value)}
                                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Alignment
                            </label>
                            <select
                              value={style.textAlign || 'center'}
                              onChange={(e) => updateStyle('textAlign', e.target.value)}
                              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                            >
                              <option value="left">Left</option>
                              <option value="center">Center</option>
                              <option value="right">Right</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            id={`${elKey}-visible`}
                            checked={style.visible !== false}
                            onChange={(e) => updateStyle('visible', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor={`${elKey}-visible`} className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                            Field Visible on Badge
                          </label>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>

      {/* Sheet Print Setup Modal */}
      <BadgeSheetPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        layout={layout}
        sampleAttendee={activeSampleAttendee}
      />

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleConfirmReset}
        title="Reset Badge Layout?"
        description="This will restore all field positions, sizes, and colors back to the standard 4&quot; × 6&quot; defaults. Any unsaved alterations will be replaced."
        confirmLabel="Reset to Defaults"
        variant="destructive"
      />
    </div>
  );
}
