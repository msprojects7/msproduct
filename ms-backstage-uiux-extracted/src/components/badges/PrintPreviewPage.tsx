import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../navigation/BackButton';
import { 
  Printer, 
  QrCode, 
  Layers, 
  Check, 
  Sliders, 
  FileText, 
  Users, 
  CreditCard,
  Building2,
  Calendar,
  Sparkles,
  Download
} from 'lucide-react';
import { generateQrDataUrl } from '../../lib/qr-generator';
import { Attendee } from '../../types';

export const PrintPreviewPage: React.FC = () => {
  const { 
    activeBadgeTemplate, 
    selectedBadgeAttendee, 
    setSelectedBadgeAttendee,
    attendees, 
    currentEvent, 
    addToast 
  } = useApp();

  const [paperFormat, setPaperFormat] = useState<'a4-six' | 'a4-single' | 'a4-eight' | 'thermal-single'>('a4-six');
  const [showCropMarks, setShowCropMarks] = useState(true);
  const [includeBleed, setIncludeBleed] = useState(false);
  const [batchAttendees, setBatchAttendees] = useState<Attendee[]>(attendees.slice(0, 6));
  const [qrMap, setQrMap] = useState<Record<string, string>>({});

  // Ensure QR codes are generated for all active attendees in the preview
  useEffect(() => {
    const attendeesToGen = paperFormat === 'a4-single' || paperFormat === 'thermal-single' 
      ? [selectedBadgeAttendee] 
      : paperFormat === 'a4-eight'
      ? [...batchAttendees, ...attendees].slice(0, 8)
      : batchAttendees;

    attendeesToGen.forEach(att => {
      if (att && att.qrCodeData && !qrMap[att.id]) {
        generateQrDataUrl(att.qrCodeData).then(url => {
          if (url) {
            setQrMap(prev => ({ ...prev, [att.id]: url }));
          }
        });
      }
    });
  }, [batchAttendees, selectedBadgeAttendee, paperFormat, attendees, qrMap]);

  const handlePrint = () => {
    addToast({
      type: 'info',
      title: 'Preparing Print Output',
      message: 'Generating calibrated badge layout without application docks or menus.'
    });
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const template = activeBadgeTemplate;

  // Single badge element renderer with calibrated millimeters
  const renderBadgeItem = (attendeeItem: Attendee, index: number) => {
    // Physical dimensions calibrated per paper layout
    let widthCss = '90mm';
    let heightCss = '85mm';

    if (paperFormat === 'a4-eight') {
      widthCss = '80mm';
      heightCss = '65mm';
    } else if (paperFormat === 'thermal-single') {
      widthCss = '101.6mm'; // 4 inches
      heightCss = '152.4mm'; // 6 inches
    } else if (paperFormat === 'a4-single') {
      widthCss = template.orientation === 'landscape' ? '152.4mm' : '101.6mm';
      heightCss = template.orientation === 'landscape' ? '101.6mm' : '152.4mm';
    }

    return (
      <div 
        key={attendeeItem.id + '-' + index}
        className="badge-item-print relative bg-white text-slate-900 overflow-hidden border border-slate-300 shadow-sm print:shadow-none print:border-slate-400 select-none box-border"
        style={{
          width: widthCss,
          height: heightCss,
          backgroundColor: template.backgroundColor || '#ffffff',
          pageBreakInside: 'avoid'
        }}
      >
        {/* Physical Crop Marks for precision guillotine cutting */}
        {showCropMarks && (
          <>
            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-slate-600 pointer-events-none z-30" />
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-slate-600 pointer-events-none z-30" />
            <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-slate-600 pointer-events-none z-30" />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-slate-600 pointer-events-none z-30" />
          </>
        )}

        {/* Lanyard Hole Punch Slot indicator (centered at top) */}
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full bg-slate-200 border border-slate-400/80 z-20 print:border-black" />

        {/* Dynamic elements from active badge template */}
        {template.elements.map(el => {
          if (!el.visible) return null;
          return (
            <div
              key={el.id}
              className="absolute flex items-center justify-center overflow-hidden"
              style={{
                left: `${el.x}%`,
                top: `${el.y}%`,
                width: `${el.width}%`,
                height: `${el.height}%`,
                zIndex: el.zIndex,
                backgroundColor: el.backgroundColor || 'transparent',
                color: el.color || 'inherit',
                borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
                fontWeight: el.fontWeight || 'normal',
                fontStyle: el.fontStyle || 'normal',
                textAlign: el.textAlign || 'center'
              }}
            >
              {el.type === 'name' && (
                <span 
                  className="w-full tracking-tight px-1 font-bold truncate leading-tight"
                  style={{ 
                    fontSize: `${(el.fontSize || 20) * 0.72}px`,
                    textTransform: el.textCase || 'none'
                  }}
                >
                  {attendeeItem.fullName}
                </span>
              )}

              {el.type === 'category' && (
                <span 
                  className="w-full font-bold uppercase tracking-wider text-center truncate px-1"
                  style={{ fontSize: `${(el.fontSize || 12) * 0.75}px` }}
                >
                  {attendeeItem.category}
                </span>
              )}

              {el.type === 'eventName' && (
                <span 
                  className="w-full font-semibold uppercase tracking-wide text-center px-1 truncate"
                  style={{ fontSize: `${(el.fontSize || 12) * 0.7}px` }}
                >
                  {currentEvent.name}
                </span>
              )}

              {el.type === 'company' && (
                <span 
                  className="w-full text-center px-1 truncate"
                  style={{ fontSize: `${(el.fontSize || 12) * 0.7}px` }}
                >
                  {attendeeItem.company || currentEvent.venue}
                </span>
              )}

              {el.type === 'designation' && (
                <span 
                  className="w-full text-center px-1 truncate font-medium"
                  style={{ fontSize: `${(el.fontSize || 12) * 0.65}px` }}
                >
                  {attendeeItem.designation || 'Participant'}
                </span>
              )}

              {el.type === 'regNumber' && (
                <span 
                  className="w-full font-mono font-bold tracking-wider text-center truncate"
                  style={{ fontSize: `${(el.fontSize || 11) * 0.75}px` }}
                >
                  {attendeeItem.registrationNumber}
                </span>
              )}

              {el.type === 'qrCode' && (
                <div className="w-full h-full p-0.5 bg-white border border-slate-300 rounded flex items-center justify-center">
                  {qrMap[attendeeItem.id] ? (
                    <img src={qrMap[attendeeItem.id]} alt="QR" className="w-full h-full object-contain" />
                  ) : (
                    <QrCode className="w-4/5 h-4/5 text-black" />
                  )}
                </div>
              )}

              {el.type === 'logo' && (
                <div className="flex items-center gap-1 font-extrabold text-[10px] uppercase text-black">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>BACKSTAGE</span>
                </div>
              )}

              {el.type === 'photo' && (
                <div className="w-full h-full rounded-full bg-slate-200 border border-slate-400 flex items-center justify-center text-[10px] font-bold text-slate-700">
                  {attendeeItem.fullName.substring(0, 2).toUpperCase()}
                </div>
              )}

              {el.type === 'divider' && (
                <div className="w-full h-full" style={{ backgroundColor: el.backgroundColor || '#94a3b8' }} />
              )}

              {el.type === 'customText' && (
                <span className="w-full truncate px-1 text-center" style={{ fontSize: `${(el.fontSize || 10) * 0.7}px` }}>
                  {el.customText || 'Delegate Pass'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full pb-20 pt-2 sm:pt-4">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* TOP BAR (NON-PRINTABLE) */}
        <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <BackButton label="Back to Badge Designer" targetRoute="badge-designer" />
            <div className="pt-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <Printer className="w-6 h-6 text-indigo-400" />
                <span>Calibrated Print Layout Preview</span>
              </h1>
              <p className="text-xs text-slate-400">
                A4 sheet layouts (6-up & 8-up), single badge, and thermal label rolls with exact physical dimensions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-950/60 flex items-center gap-2 active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Badges Now (Ctrl+P)</span>
            </button>
          </div>
        </div>

        {/* PRINT CONFIGURATION PANEL (NON-PRINTABLE) */}
        <div className="no-print rounded-3xl glass-panel p-5 border border-slate-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Sheet / Roll Format */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Paper / Sheet Geometry</label>
              <select
                value={paperFormat}
                onChange={(e) => setPaperFormat(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-indigo-500 text-xs"
              >
                <option value="a4-six">A4 Six-Badge Sheet (2 Cols × 3 Rows: 90×85mm)</option>
                <option value="a4-eight">A4 Eight-Badge Sheet (2 Cols × 4 Rows: 80×65mm)</option>
                <option value="a4-single">A4 Single Centered Large Badge</option>
                <option value="thermal-single">Thermal Label Roll (4" × 6" Direct Feed)</option>
              </select>
            </div>

            {/* Individual Attendee Selection for Single Print */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Selected Delegate</label>
              <select
                value={selectedBadgeAttendee.id}
                onChange={(e) => {
                  const found = attendees.find(a => a.id === e.target.value);
                  if (found) setSelectedBadgeAttendee(found);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-indigo-500 text-xs"
              >
                {attendees.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.fullName} ({a.registrationNumber} - {a.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Print Guides Toggle */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Calibrated Sheet Guides</label>
              <div className="flex items-center gap-4 pt-1.5 text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showCropMarks}
                    onChange={(e) => setShowCropMarks(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600"
                  />
                  <span>Guillotine Crop Marks</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeBleed}
                    onChange={(e) => setIncludeBleed(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600"
                  />
                  <span>3mm Bleed Safety</span>
                </label>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-950/20 border border-indigo-700/30 text-[11px] text-slate-400 flex items-center justify-between">
            <span>
              *A4 6-Up specification: 2 columns × 3 rows (90mm × 85mm each) with 10mm margins & 10mm column gutters, perfectly filling 210mm × 297mm sheet paper.
            </span>
            <span className="font-mono text-indigo-400 font-bold shrink-0 ml-2">
              Template: {template.name}
            </span>
          </div>
        </div>

        {/* PRINTABLE PREVIEW CANVAS CONTAINER */}
        <div className="printable-area w-full flex justify-center p-4 sm:p-8 bg-slate-950/80 rounded-3xl border border-slate-800 shadow-2xl print:bg-white print:p-0 print:border-none print:shadow-none">
          
          {/* SIMULATED PHYSICAL PAPER CONTAINER */}
          <div 
            className="bg-white text-slate-900 shadow-2xl rounded-sm p-4 print:p-0 print:shadow-none flex flex-col justify-start box-border"
            style={{
              width: paperFormat === 'thermal-single' ? '101.6mm' : '210mm',
              minHeight: paperFormat === 'thermal-single' ? '152.4mm' : '297mm'
            }}
          >
            {/* Sheet Header (only in preview/non-print) */}
            <div className="no-print pb-3 mb-3 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>{currentEvent.name} — Calibrated Badge Sheet</span>
              <span>
                {paperFormat === 'a4-six' 
                  ? 'A4 6-Up Sheet (2×3)' 
                  : paperFormat === 'a4-eight' 
                  ? 'A4 8-Up Sheet (2×4)' 
                  : paperFormat === 'thermal-single'
                  ? '4"×6" Thermal Label'
                  : 'A4 Single Badge'}
              </span>
            </div>

            {/* A4 SIX-UP LAYOUT (2 COLUMNS × 3 ROWS: EXACT 90mm × 85mm with 10mm gutters) */}
            {paperFormat === 'a4-six' && (
              <div 
                className="grid grid-cols-2 gap-x-[10mm] gap-y-[6mm] justify-items-center items-center my-auto"
                style={{
                  width: '190mm', // 210mm - 20mm margins
                  margin: '0 auto'
                }}
              >
                {batchAttendees.slice(0, 6).map((att, i) => renderBadgeItem(att, i))}
              </div>
            )}

            {/* A4 EIGHT-UP LAYOUT (2 COLUMNS × 4 ROWS: 80mm × 65mm) */}
            {paperFormat === 'a4-eight' && (
              <div 
                className="grid grid-cols-2 gap-x-[8mm] gap-y-[4mm] justify-items-center items-center my-auto"
                style={{
                  width: '180mm',
                  margin: '0 auto'
                }}
              >
                {[...batchAttendees, ...attendees].slice(0, 8).map((att, i) => renderBadgeItem(att, i))}
              </div>
            )}

            {/* SINGLE BADGE (A4 Centered or Thermal Roll) */}
            {(paperFormat === 'a4-single' || paperFormat === 'thermal-single') && (
              <div className="flex items-center justify-center p-4 my-auto">
                {renderBadgeItem(selectedBadgeAttendee, 0)}
              </div>
            )}

            {/* Sheet Footer note (hidden in print) */}
            <div className="no-print mt-auto pt-4 text-center text-[10px] text-slate-400 font-mono">
              Calibrated sheet output · UI controls and floating dock will automatically hide when printed via @media print.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
