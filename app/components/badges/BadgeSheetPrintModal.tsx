'use client';

import React, { useState } from 'react';
import { Printer, X, LayoutGrid, Check, Settings2, Sliders, Maximize2, Sparkles } from 'lucide-react';
import BadgeRenderer, { BadgeLayoutData, AttendeeBadgeData } from '@/app/components/BadgeRenderer';

interface BadgeSheetPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  layout: BadgeLayoutData;
  sampleAttendee: AttendeeBadgeData;
  attendeesList?: AttendeeBadgeData[];
}

export type SheetLayoutPreset =
  | 'a4_full'
  | 'a4_four_borderless'
  | 'a4_four'
  | 'a4_six_a6'
  | 'single_thermal'
  | 'custom';

export default function BadgeSheetPrintModal({
  isOpen,
  onClose,
  layout,
  sampleAttendee,
  attendeesList,
}: BadgeSheetPrintModalProps) {
  const [sheetPreset, setSheetPreset] = useState<SheetLayoutPreset>('a4_four_borderless');
  const [borderless, setBorderless] = useState(true);
  const [showCropMarks, setShowCropMarks] = useState(false);
  const [marginMm, setMarginMm] = useState(0);
  const [gutterMm, setGutterMm] = useState(0);

  // Custom size controls
  const [customWidthIn, setCustomWidthIn] = useState<number>(layout.badgeWidthIn || 4);
  const [customHeightIn, setCustomHeightIn] = useState<number>(layout.badgeHeightIn || 6);

  if (!isOpen) return null;

  // Determine number of badges on preview
  const badgesCount =
    sheetPreset === 'a4_full'
      ? 1
      : sheetPreset === 'a4_four_borderless' || sheetPreset === 'a4_four'
      ? 4
      : sheetPreset === 'a4_six_a6'
      ? 6
      : 1;

  // Compute effective layout to render
  const effectiveLayout: BadgeLayoutData = {
    ...layout,
    badgeWidthIn:
      sheetPreset === 'a4_full'
        ? 8.27
        : sheetPreset === 'custom'
        ? customWidthIn
        : sheetPreset === 'a4_four_borderless'
        ? 4.13
        : layout.badgeWidthIn || 4,
    badgeHeightIn:
      sheetPreset === 'a4_full'
        ? 11.69
        : sheetPreset === 'custom'
        ? customHeightIn
        : sheetPreset === 'a4_four_borderless'
        ? 5.84
        : layout.badgeHeightIn || 6,
  };

  // Generate badges for preview
  const previewAttendees: AttendeeBadgeData[] = [];
  for (let i = 0; i < badgesCount; i++) {
    if (attendeesList && attendeesList[i]) {
      previewAttendees.push(attendeesList[i]);
    } else {
      previewAttendees.push({
        ...sampleAttendee,
        id: `preview-${i}`,
        registrationNumber: `REG-${1001 + i}`,
      });
    }
  }

  const handlePrint = () => {
    window.print();
  };

  const effectiveMargin = borderless ? 0 : marginMm;
  const effectiveGutter = borderless ? 0 : gutterMm;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      {/* Hidden Sheet Print Mount for physical printing */}
      <div className="hidden print:block fixed inset-0 z-50 bg-white">
        <style>{`
          @page {
            ${
              sheetPreset === 'single_thermal'
                ? `size: ${effectiveLayout.badgeWidthIn}in ${effectiveLayout.badgeHeightIn}in; margin: 0;`
                : sheetPreset === 'a4_full'
                ? `size: 8.27in 11.69in; margin: 0;`
                : `size: A4 portrait; margin: ${effectiveMargin}mm;`
            }
          }
          @media print {
            body * {
              visibility: hidden;
            }
            #ms-sheet-print-mount, #ms-sheet-print-mount * {
              visibility: visible;
            }
            #ms-sheet-print-mount {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 0;
            }
            .sheet-page {
              page-break-after: always;
              break-after: page;
              display: grid;
              box-sizing: border-box;
              ${
                sheetPreset === 'a4_full'
                  ? `display: flex; width: 100vw; height: 100vh; justify-content: center; align-items: center;`
                  : sheetPreset === 'a4_four_borderless'
                  ? `grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); width: 100vw; height: 100vh; gap: 0; margin: 0; padding: 0;`
                  : sheetPreset === 'a4_four'
                  ? `grid-template-columns: repeat(2, 1fr); gap: ${effectiveGutter}mm; justify-items: center; align-items: center;`
                  : sheetPreset === 'a4_six_a6'
                  ? `grid-template-columns: repeat(2, 1fr); gap: ${effectiveGutter}mm; justify-items: center; align-items: center;`
                  : `display: flex; justify-content: center; align-items: center; height: 100vh;`
              }
            }
          }
        `}</style>
        <div id="ms-sheet-print-mount">
          <div className="sheet-page">
            {previewAttendees.map((att, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden flex items-center justify-center"
                style={{
                  border: showCropMarks && !borderless ? '1px dashed #cbd5e1' : 'none',
                  margin: 0,
                  padding: 0,
                }}
              >
                <BadgeRenderer attendee={att} layout={effectiveLayout} isPrint={true} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Dialog for Configuration & Preview */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl overflow-hidden print:hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Sheet &amp; Badge Print Setup
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          {/* Controls (5 cols) */}
          <div className="lg:col-span-5 p-6 border-r border-slate-200 dark:border-slate-800 space-y-5 bg-slate-50/50 dark:bg-slate-900/40">
            {/* Sheet Preset Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                Paper &amp; Sheet Layout Preset
              </label>
              <div className="space-y-2">
                {[
                  {
                    id: 'a4_four_borderless',
                    title: 'A4 Sheet — 4 Badges (A6 2×2 Borderless)',
                    desc: 'Exactly 4 A6 badges filling the entire A4 sheet with zero margins and zero borders.',
                    tag: 'Popular',
                  },
                  {
                    id: 'a4_full',
                    title: 'Full A4 Sheet (1 Big Badge / Certificate)',
                    desc: 'Full-size 8.27" × 11.69" placard or VIP certificate filling the entire sheet.',
                    tag: 'Placard / A4',
                  },
                  {
                    id: 'a4_four',
                    title: 'A4 Sheet — 4 Badges (With Margins & Gutters)',
                    desc: 'Four badges with customizable spacing for manual paper trimmers.',
                    tag: 'Cutters',
                  },
                  {
                    id: 'a4_six_a6',
                    title: 'A4 Sheet — 6 Badges (2×3 Grid)',
                    desc: 'Six compact 3" × 4" badges per A4 page to maximize throughput.',
                    tag: 'High Capacity',
                  },
                  {
                    id: 'single_thermal',
                    title: 'Direct Badge Size (Thermal / Continuous Roll)',
                    desc: 'Exact physical badge dimension (e.g. 4" × 6"). No outer A4 sheet padding.',
                    tag: 'Thermal Roll',
                  },
                  {
                    id: 'custom',
                    title: 'Custom Badge Dimensions',
                    desc: 'Manually adjust width & height in inches with live scaling.',
                    tag: 'Custom',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSheetPreset(item.id as SheetLayoutPreset);
                      if (item.id === 'a4_four_borderless' || item.id === 'a4_full') {
                        setBorderless(true);
                      }
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      sheetPreset === item.id
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Dimensions Input */}
            {sheetPreset === 'custom' && (
              <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-xs font-bold text-slate-800 dark:text-white block">
                  Custom Badge Size (Inches)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      Width (in)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="12"
                      value={customWidthIn}
                      onChange={(e) => setCustomWidthIn(parseFloat(e.target.value) || 4)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      Height (in)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="16"
                      value={customHeightIn}
                      onChange={(e) => setCustomHeightIn(parseFloat(e.target.value) || 6)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Borderless and Margins Setup */}
            {sheetPreset !== 'single_thermal' && (
              <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-white">
                    <Sliders className="w-4 h-4 text-blue-500" />
                    Border &amp; Margin Rules
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={borderless}
                      onChange={(e) => setBorderless(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                      Zero Borders (Edge-to-Edge)
                    </span>
                  </label>
                </div>

                {!borderless && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Margin (mm)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={marginMm}
                        onChange={(e) => setMarginMm(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Gutter Spacing (mm)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={gutterMm}
                        onChange={(e) => setGutterMm(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={showCropMarks}
                    onChange={(e) => setShowCropMarks(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    Show subtle dashed cutting lines
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Sheet Live Preview (7 cols) */}
          <div className="lg:col-span-7 p-6 flex flex-col items-center justify-center bg-slate-100/70 dark:bg-slate-950/60 overflow-auto">
            <div className="text-center mb-3">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Visual Sheet Preview ({sheetPreset === 'a4_full' ? 'Full A4 Placard' : 'A4 Multi-Badge Page'})
              </span>
            </div>

            {/* A4 Sheet Representation */}
            <div
              className="bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-300 dark:border-slate-700 p-2 relative overflow-hidden"
              style={{
                width: '320px',
                height: '450px',
                display: 'grid',
                gridTemplateColumns:
                  sheetPreset === 'a4_four_borderless' || sheetPreset === 'a4_four'
                    ? 'repeat(2, 1fr)'
                    : sheetPreset === 'a4_six_a6'
                    ? 'repeat(2, 1fr)'
                    : '1fr',
                gap: borderless ? '0px' : '6px',
                justifyItems: 'center',
                alignItems: 'center',
              }}
            >
              {previewAttendees.map((att, idx) => (
                <div
                  key={idx}
                  className="rounded overflow-hidden flex items-center justify-center"
                  style={{
                    border: showCropMarks && !borderless ? '1px dashed #94a3b8' : 'none',
                    transform:
                      sheetPreset === 'a4_full'
                        ? 'scale(0.38)'
                        : sheetPreset === 'a4_four_borderless'
                        ? 'scale(0.28)'
                        : sheetPreset === 'a4_four'
                        ? 'scale(0.27)'
                        : sheetPreset === 'a4_six_a6'
                        ? 'scale(0.22)'
                        : 'scale(0.48)',
                    transformOrigin: 'center center',
                    margin: sheetPreset === 'a4_full' ? '0' : '-15px -8px',
                  }}
                >
                  <BadgeRenderer attendee={att} layout={effectiveLayout} scale={1} />
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-4 text-center max-w-sm">
              Standard browser print dialog will render at 100% vector scale according to your printer drivers.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-full shadow-md shadow-blue-600/20 transition hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Open Print Dialog
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
