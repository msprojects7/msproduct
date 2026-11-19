'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Type,
  Image as ImageIcon,
  Award,
  QrCode,
  ShieldCheck,
  Star,
  Layers,
  Palette,
  Undo2,
  Redo2,
  Trash2,
  Copy,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Move,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Sliders,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkles,
  Upload,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  RotateCw,
  Download,
  Minus,
  Square,
  FileDown,
} from 'lucide-react';
import {
  CanvasElement,
  CertificateCanvasModel,
  FORMAT_SPECS,
  createDefaultCanvasModel,
} from '@/lib/certificates/canvasModel';
import { CERTIFICATE_PRESETS, CertificateTemplatePreset } from '@/lib/certificates/templates';
import {
  downloadCertificateAsPng,
  downloadCertificateAsPdf,
} from '@/lib/certificates/exportCertificate';

interface CanvaCertificateDesignerProps {
  initialModel?: CertificateCanvasModel;
  sampleRecipientName?: string;
  eventName?: string;
  organizationName?: string;
  onSave: (model: CertificateCanvasModel, title: string, signatoryName: string, signatoryTitle: string) => Promise<void>;
  onClose: () => void;
  saving?: boolean;
}

export default function CanvaCertificateDesigner({
  initialModel,
  sampleRecipientName = 'Dr. Sarah Jenkins',
  eventName = 'Global Summit 2026',
  organizationName = 'MS Backstage Organization',
  onSave,
  onClose,
  saving = false,
}: CanvaCertificateDesignerProps) {
  // Model & History State
  const [model, setModel] = useState<CertificateCanvasModel>(
    initialModel || createDefaultCanvasModel('classic_gold')
  );
  const [history, setHistory] = useState<CertificateCanvasModel[]>([
    initialModel || createDefaultCanvasModel('classic_gold'),
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Active Tool / Panel Tab: 'templates' | 'elements' | 'background' | 'layers'
  const [activeTool, setActiveTool] = useState<'templates' | 'elements' | 'background' | 'layers'>('elements');

  // Selected element ID
  const [selectedId, setSelectedId] = useState<string | null>('recipient');

  // Zoom level: 0.75 | 1 | 1.25
  const [zoom, setZoom] = useState<number>(1);

  // Dragging / Resizing interaction state
  const workspaceRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState<number>(0.85);

  const baseWidth = model.format === 'a4_portrait' ? 707 : 1000;
  const baseHeight = model.format === 'a4_portrait' ? 1000 : 707;

  useEffect(() => {
    const updateFit = () => {
      if (!workspaceRef.current) return;
      const rect = workspaceRef.current.getBoundingClientRect();
      const availW = Math.max(300, rect.width - 48);
      const availH = Math.max(300, rect.height - 48);
      const sW = availW / baseWidth;
      const sH = availH / baseHeight;
      setFitScale(Math.min(sW, sH, 1.25));
    };
    updateFit();
    window.addEventListener('resize', updateFit);
    return () => window.removeEventListener('resize', updateFit);
  }, [baseWidth, baseHeight]);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null); // 'nw' | 'ne' | 'se' | 'sw' | 'e' | 's'
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; elemX: number; elemY: number; elemW: number; elemH: number }>({
    mouseX: 0,
    mouseY: 0,
    elemX: 0,
    elemY: 0,
    elemW: 0,
    elemH: 0,
  });

  const selectedElement = model.elements.find((el) => el.id === selectedId) || null;

  // Record undo/redo history
  const pushState = useCallback((newModel: CertificateCanvasModel) => {
    setModel(newModel);
    setHistory((prev) => {
      const slice = prev.slice(0, historyIndex + 1);
      return [...slice, newModel];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setModel(history[prevIdx]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setModel(history[nextIdx]);
    }
  };

  const [downloadingPng, setDownloadingPng] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPng = async () => {
    try {
      setDownloadingPng(true);
      await downloadCertificateAsPng(
        model,
        {
          name: sampleRecipientName,
          event: eventName,
          organization: organizationName,
        },
        `${eventName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-certificate.png`
      );
    } catch (err) {
      console.error('PNG download error:', err);
    } finally {
      setDownloadingPng(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      await downloadCertificateAsPdf(
        model,
        {
          name: sampleRecipientName,
          event: eventName,
          organization: organizationName,
        },
        `${eventName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-certificate.pdf`
      );
    } catch (err) {
      console.error('PDF download error:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) return;
      addElement({
        type: 'logo',
        src,
        alt: file.name,
        width: 16,
        height: 12,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) return;
      addElement({
        type: 'signatory',
        signatoryName: 'Authorized Convener',
        signatoryTitle: 'Program Director',
        showSignatureLine: true,
        signatureUrl: src,
        fontFamily: 'serif',
        color: '#78350f',
        width: 32,
        height: 15,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleBgImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) return;
      pushState({
        ...model,
        background: {
          ...model.background,
          type: 'image',
          imageUrl: src,
        },
      });
    };
    reader.readAsDataURL(file);
  };

  const getFontFamilyCss = (fontFamily?: string) => {
    switch (fontFamily) {
      case 'playfair':
      case 'serif':
        return '"Playfair Display", Georgia, serif';
      case 'cinzel':
      case 'display':
        return '"Cinzel", "Times New Roman", serif';
      case 'cormorant':
        return '"Cormorant Garamond", Georgia, serif';
      case 'montserrat':
        return '"Montserrat", sans-serif';
      case 'poppins':
        return '"Poppins", sans-serif';
      case 'outfit':
        return '"Outfit", sans-serif';
      case 'space_grotesk':
        return '"Space Grotesk", sans-serif';
      case 'plus_jakarta':
        return '"Plus Jakarta Sans", sans-serif';
      case 'jetbrains_mono':
      case 'mono':
        return '"JetBrains Mono", monospace';
      case 'inter':
      case 'sans':
      default:
        return '"Inter", sans-serif';
    }
  };

  // Keyboard navigation & deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          e.preventDefault();
          deleteElement(selectedId);
        }
      } else if (e.key === 'Escape') {
        setSelectedId(null);
      } else if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (selectedElement && !selectedElement.locked) {
        const step = e.shiftKey ? 2 : 0.5;
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          updateSelected({ x: Math.max(0, selectedElement.x - step) });
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          updateSelected({ x: Math.min(100 - selectedElement.width, selectedElement.x + step) });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          updateSelected({ y: Math.max(0, selectedElement.y - step) });
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          updateSelected({ y: Math.min(100 - selectedElement.height, selectedElement.y + step) });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, selectedElement, historyIndex, history]);

  // Update selected element property
  const updateSelected = (props: Partial<CanvasElement>) => {
    if (!selectedId) return;
    const updatedElements = model.elements.map((el) => {
      if (el.id === selectedId) {
        return { ...el, ...props };
      }
      return el;
    });
    pushState({ ...model, elements: updatedElements });
  };

  // Add new element
  const addElement = (elementPartial: Partial<CanvasElement>) => {
    const newId = `elem_${Date.now()}`;
    const newEl: CanvasElement = {
      id: newId,
      type: elementPartial.type || 'text',
      x: elementPartial.x ?? 30,
      y: elementPartial.y ?? 40,
      width: elementPartial.width ?? 40,
      height: elementPartial.height ?? 8,
      rotation: 0,
      opacity: 1,
      zIndex: model.elements.length + 1,
      ...elementPartial,
    };
    pushState({
      ...model,
      elements: [...model.elements, newEl],
    });
    setSelectedId(newId);
  };

  // Delete element
  const deleteElement = (id: string) => {
    const updated = model.elements.filter((el) => el.id !== id);
    pushState({ ...model, elements: updated });
    if (selectedId === id) setSelectedId(null);
  };

  // Duplicate element
  const duplicateElement = (id: string) => {
    const target = model.elements.find((el) => el.id === id);
    if (!target) return;
    const dupId = `elem_${Date.now()}`;
    const dup: CanvasElement = {
      ...target,
      id: dupId,
      x: Math.min(80, target.x + 3),
      y: Math.min(80, target.y + 3),
      zIndex: model.elements.length + 1,
    };
    pushState({ ...model, elements: [...model.elements, dup] });
    setSelectedId(dupId);
  };

  // Layer ordering
  const bringForward = (id: string) => {
    const index = model.elements.findIndex((el) => el.id === id);
    if (index >= model.elements.length - 1) return;
    const newElements = [...model.elements];
    const [item] = newElements.splice(index, 1);
    newElements.splice(index + 1, 0, item);
    pushState({ ...model, elements: newElements });
  };

  const sendBackward = (id: string) => {
    const index = model.elements.findIndex((el) => el.id === id);
    if (index <= 0) return;
    const newElements = [...model.elements];
    const [item] = newElements.splice(index, 1);
    newElements.splice(index - 1, 0, item);
    pushState({ ...model, elements: newElements });
  };

  // Switch to Preset
  const handleApplyPreset = (preset: CertificateTemplatePreset) => {
    const newModel = createDefaultCanvasModel(preset.id);
    pushState(newModel);
  };

  // Change Output Format
  const handleFormatChange = (fmt: CertificateCanvasModel['format']) => {
    const spec = FORMAT_SPECS[fmt];
    pushState({
      ...model,
      format: fmt,
      aspectRatio: spec.aspectRatio,
    });
  };

  // Pointer drag start on an element
  const handleMouseDownElement = (e: React.MouseEvent, el: CanvasElement) => {
    e.stopPropagation();
    if (el.locked || el.hidden) return;
    setSelectedId(el.id);
    setIsDragging(true);

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elemX: el.x,
      elemY: el.y,
      elemW: el.width,
      elemH: el.height,
    };
  };

  // Pointer drag resize handle start
  const handleMouseDownResize = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    if (!selectedElement || selectedElement.locked) return;
    setIsResizing(handle);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elemX: selectedElement.x,
      elemY: selectedElement.y,
      elemW: selectedElement.width,
      elemH: selectedElement.height,
    };
  };

  // Pointer move handler (drag or resize)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging && !isResizing) return;
      if (!canvasRef.current || !selectedElement) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const deltaXPercent = ((e.clientX - dragStartRef.current.mouseX) / rect.width) * 100;
      const deltaYPercent = ((e.clientY - dragStartRef.current.mouseY) / rect.height) * 100;

      if (isDragging) {
        const newX = Math.max(0, Math.min(100 - selectedElement.width, dragStartRef.current.elemX + deltaXPercent));
        const newY = Math.max(0, Math.min(100 - selectedElement.height, dragStartRef.current.elemY + deltaYPercent));
        setModel((prev) => ({
          ...prev,
          elements: prev.elements.map((el) => (el.id === selectedElement.id ? { ...el, x: newX, y: newY } : el)),
        }));
      } else if (isResizing) {
        let newX = selectedElement.x;
        let newY = selectedElement.y;
        let newW = selectedElement.width;
        let newH = selectedElement.height;

        if (isResizing.includes('e')) {
          newW = Math.max(5, Math.min(100 - newX, dragStartRef.current.elemW + deltaXPercent));
        }
        if (isResizing.includes('s')) {
          newH = Math.max(3, Math.min(100 - newY, dragStartRef.current.elemH + deltaYPercent));
        }
        if (isResizing.includes('w')) {
          const possibleW = dragStartRef.current.elemW - deltaXPercent;
          if (possibleW > 5) {
            newX = dragStartRef.current.elemX + deltaXPercent;
            newW = possibleW;
          }
        }
        if (isResizing.includes('n')) {
          const possibleH = dragStartRef.current.elemH - deltaYPercent;
          if (possibleH > 3) {
            newY = dragStartRef.current.elemY + deltaYPercent;
            newH = possibleH;
          }
        }

        setModel((prev) => ({
          ...prev,
          elements: prev.elements.map((el) =>
            el.id === selectedElement.id ? { ...el, x: newX, y: newY, width: newW, height: newH } : el
          ),
        }));
      }
    };

    const handleMouseUp = () => {
      if (isDragging || isResizing) {
        setIsDragging(false);
        setIsResizing(null);
        pushState(model);
      }
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, selectedElement, model, pushState]);

  // Extract primary title and signatory for metadata
  const handleFinalSave = () => {
    const titleEl = model.elements.find((el) => el.type === 'title');
    const sigEl = model.elements.find((el) => el.type === 'signatory');
    const titleText = titleEl?.content || 'Certificate of Excellence';
    const sigName = sigEl?.signatoryName || 'Dr. Arthur Pendelton';
    const sigTitle = sigEl?.signatoryTitle || 'Executive Chairperson';
    onSave(model, titleText, sigName, sigTitle);
  };

  // Interpolate dynamic variable strings for canvas render
  const interpolateText = (raw: string = '') => {
    return raw
      .replace(/{{name}}/gi, sampleRecipientName)
      .replace(/{{event}}/gi, eventName)
      .replace(/{{organization}}/gi, organizationName)
      .replace(/{{issue_date}}/gi, new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))
      .replace(/{{certificate_id}}/gi, 'CERT-VERIFIED-98421');
  };

  // Render Seal Graphic
  const renderSealGraphic = (type: CanvasElement['sealType'], color: string = '#d97706') => {
    switch (type) {
      case 'gold_crest':
        return (
          <div
            className="w-full h-full rounded-full border-2 border-dashed flex flex-col items-center justify-center p-1 shadow-md"
            style={{ borderColor: color, color }}
          >
            <Award className="w-1/2 h-1/2" />
            <span className="text-[7px] font-black uppercase tracking-tighter">OFFICIAL</span>
          </div>
        );
      case 'shield_check':
        return (
          <div
            className="w-full h-full rounded-xl border flex flex-col items-center justify-center p-1 shadow-md"
            style={{ borderColor: color, color, backgroundColor: `${color}15` }}
          >
            <ShieldCheck className="w-1/2 h-1/2" />
            <span className="text-[6px] font-mono font-bold uppercase">VERIFIED</span>
          </div>
        );
      case 'laurel_wreath':
        return (
          <div
            className="w-full h-full rounded-full border-2 flex flex-col items-center justify-center p-1 shadow-lg"
            style={{ borderColor: color, color }}
          >
            <Award className="w-1/2 h-1/2" />
            <span className="text-[6px] font-serif font-bold uppercase tracking-widest">HONOR</span>
          </div>
        );
      case 'star_ribbon':
        return (
          <div
            className="w-full h-full rounded-full flex flex-col items-center justify-center p-1 shadow-md border-2"
            style={{ borderColor: color, color, background: `radial-gradient(circle, ${color}20 0%, transparent 70%)` }}
          >
            <Star className="w-1/2 h-1/2 fill-current" />
            <span className="text-[6px] font-bold uppercase tracking-wider">DISTINCTION</span>
          </div>
        );
      case 'wax_seal':
        return (
          <div
            className="w-full h-full rounded-full flex flex-col items-center justify-center p-1 shadow-xl"
            style={{ backgroundColor: color, color: '#ffffff' }}
          >
            <Award className="w-1/2 h-1/2" />
            <span className="text-[6px] font-serif font-extrabold uppercase tracking-widest">SEAL</span>
          </div>
        );
      case 'none':
      default:
        return null;
    }
  };

  // ── Minimal QR Code Preview (SVG pattern, not Lucide icon) ──────────────────
  const QrCodePreview = ({ size = 60 }: { size?: number }) => {
    // A static compact QR-like pattern for visual preview — the real QR is generated during export
    const cells = [
      [1,1,1,1,1,1,1,0,1,0,0,0,1,0,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,1,0,1,1,0,1,0,0,1,0,0,0,0,0,1],
      [1,0,1,1,1,0,1,0,0,1,1,0,1,0,1,0,1,1,1,0,1],
      [1,0,1,1,1,0,1,0,1,0,1,1,0,0,1,0,1,1,1,0,1],
      [1,0,1,1,1,0,1,0,0,1,0,0,1,0,1,0,1,1,1,0,1],
      [1,0,0,0,0,0,1,0,1,0,1,0,1,0,1,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
      [0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0],
      [1,1,0,1,1,0,1,1,0,1,1,0,1,1,1,0,1,1,0,1,0],
      [0,1,1,0,0,1,0,1,0,0,1,0,0,1,0,1,0,0,1,0,1],
      [1,0,1,0,1,0,1,0,1,1,0,1,1,0,1,0,1,0,1,0,1],
      [0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
      [0,0,0,0,0,0,0,0,0,1,1,0,0,1,0,0,0,0,0,1,0],
      [1,1,1,1,1,1,1,0,1,0,0,0,1,0,1,0,0,1,1,0,1],
      [1,0,0,0,0,0,1,0,0,1,0,1,0,0,1,1,0,0,0,1,0],
      [1,0,1,1,1,0,1,0,1,0,1,0,1,0,0,0,1,1,0,0,1],
      [1,0,1,1,1,0,1,0,1,1,0,0,0,1,0,1,0,0,1,0,1],
      [1,0,1,1,1,0,1,0,0,1,1,0,1,0,1,0,1,0,0,1,0],
      [1,0,0,0,0,0,1,0,1,0,0,1,0,1,0,0,0,1,0,0,1],
      [1,1,1,1,1,1,1,0,0,1,1,0,1,0,1,1,0,0,1,1,0],
    ];
    const n = cells.length;
    const cell = size / n;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: 'pixelated' }}>
        {cells.map((row, r) =>
          row.map((v, c) =>
            v ? <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#0f172a" /> : null
          )
        )}
      </svg>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 select-none overflow-hidden font-sans">
      {/* Top Application Bar */}
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Canva-Style Certificate Studio</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-mono">
                {FORMAT_SPECS[model.format].name}
              </span>
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Drag, resize, rotate, and style certificate elements with real-time vector canvas rendering.
            </p>
          </div>
        </div>

        {/* Toolbar: Undo/Redo & Zoom & Format */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-300 dark:border-slate-800">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 transition"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 transition"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-800 mx-1" />

          {/* Format Selector */}
          <select
            value={model.format}
            onChange={(e) => handleFormatChange(e.target.value as CertificateCanvasModel['format'])}
            className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] text-slate-800 dark:text-slate-300 focus:outline-none shadow-xs"
          >
            <option value="a4_landscape">A4 Landscape</option>
            <option value="a4_portrait">A4 Portrait</option>
            <option value="letter_landscape">US Letter Landscape</option>
            <option value="letter_portrait">US Letter Portrait</option>
          </select>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-800 mx-1" />

          <button
            onClick={() => setZoom((z) => Math.max(0.75, z - 0.15))}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-slate-700 dark:text-slate-400 px-1">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(1.5, z + 0.15))}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPng}
            disabled={downloadingPng}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
            title="Download high-resolution 2400px PNG"
          >
            {downloadingPng ? (
              <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-amber-600 rounded-full animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>PNG</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
            title="Download or Print Vector PDF"
          >
            {downloadingPdf ? (
              <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-amber-600 rounded-full animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>PDF</span>
          </button>

          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold transition shadow-xs"
          >
            Cancel
          </button>

          <button
            onClick={handleFinalSave}
            disabled={saving}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-600/25 transition disabled:opacity-50"
          >
            {saving ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Award className="w-3.5 h-3.5" />}
            <span>Save Template</span>
          </button>
        </div>
      </header>

      {/* Main Designer Workspace (Left Panel, Center Canvas, Right Panel) */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Elements & Asset Drawer (288px) */}
        <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 overflow-hidden shadow-xs">
          {/* Tool Tab Switcher */}
          <div className="grid grid-cols-4 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-center bg-slate-50 dark:bg-slate-950">
            <button
              onClick={() => setActiveTool('elements')}
              className={`py-2.5 transition flex flex-col items-center gap-1 ${activeTool === 'elements' ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-500 bg-white dark:bg-slate-900' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Elements</span>
            </button>
            <button
              onClick={() => setActiveTool('templates')}
              className={`py-2.5 transition flex flex-col items-center gap-1 ${activeTool === 'templates' ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-500 bg-white dark:bg-slate-900' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Presets</span>
            </button>
            <button
              onClick={() => setActiveTool('background')}
              className={`py-2.5 transition flex flex-col items-center gap-1 ${activeTool === 'background' ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-500 bg-white dark:bg-slate-900' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Theme</span>
            </button>
            <button
              onClick={() => setActiveTool('layers')}
              className={`py-2.5 transition flex flex-col items-center gap-1 ${activeTool === 'layers' ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-500 bg-white dark:bg-slate-900' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Layers</span>
            </button>
          </div>

          {/* Left Panel Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* TAB: Elements */}
            {activeTool === 'elements' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Add Text Blocks</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        addElement({
                          type: 'title',
                          content: 'CERTIFICATE OF ATTENDANCE',
                          fontFamily: 'serif',
                          fontSize: 26,
                          fontWeight: 'extrabold',
                          color: '#b45309',
                          textAlign: 'center',
                          width: 80,
                          height: 10,
                        })
                      }
                      className="p-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 border border-amber-300 dark:border-amber-800/60 rounded-xl text-left text-xs font-bold text-amber-950 dark:text-amber-100 transition flex items-center gap-2 shadow-xs"
                    >
                      <Type className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                      <span>Heading Title</span>
                    </button>

                    <button
                      onClick={() =>
                        addElement({
                          type: 'recipient',
                          content: '{{name}}',
                          fontFamily: 'serif',
                          fontSize: 32,
                          fontWeight: 'extrabold',
                          color: '#0f172a',
                          textAlign: 'center',
                          width: 80,
                          height: 10,
                        })
                      }
                      className="p-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-800/60 rounded-xl text-left text-xs font-bold text-emerald-950 dark:text-emerald-100 transition flex items-center gap-2 shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                      <span>Recipient Name</span>
                    </button>

                    <button
                      onClick={() =>
                        addElement({
                          type: 'body',
                          content:
                            'has actively participated in, completed, and demonstrated excellence throughout {{event}}.',
                          fontFamily: 'sans',
                          fontSize: 12,
                          color: '#334155',
                          textAlign: 'center',
                          width: 76,
                          height: 12,
                        })
                      }
                      className="p-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 border border-blue-300 dark:border-blue-800/60 rounded-xl text-left text-xs font-bold text-blue-950 dark:text-blue-100 transition flex items-center gap-2 col-span-2 shadow-xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                      <span>Body Statement with Variables</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Credentials & Badges</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        addElement({
                          type: 'signatory',
                          signatoryName: 'Dr. Jane Vance',
                          signatoryTitle: 'Program Director',
                          showSignatureLine: true,
                          fontFamily: 'serif',
                          color: '#78350f',
                          width: 32,
                          height: 15,
                        })
                      }
                      className="p-2.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800/60 rounded-xl text-left text-xs font-semibold text-purple-950 dark:text-purple-100 transition flex items-center gap-2 shadow-xs"
                    >
                      <Award className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Signatory Block</span>
                    </button>

                    <button
                      onClick={() =>
                        addElement({
                          type: 'seal',
                          sealType: 'gold_crest',
                          sealColor: '#d97706',
                          width: 12,
                          height: 16,
                        })
                      }
                      className="p-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-left text-xs font-semibold text-amber-950 dark:text-amber-100 transition flex items-center gap-2 shadow-xs"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Official Seal</span>
                    </button>

                    <button
                      onClick={() =>
                        addElement({
                          type: 'qr',
                          width: 18,
                          height: 15,
                        })
                      }
                      className="p-2.5 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:hover:bg-cyan-900/40 border border-cyan-200 dark:border-cyan-800/60 rounded-xl text-left text-xs font-semibold text-cyan-950 dark:text-cyan-100 transition flex items-center gap-2 shadow-xs"
                    >
                      <QrCode className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span>Verification QR</span>
                    </button>

                    <button
                      onClick={() =>
                        addElement({
                          type: 'logo',
                          src: '',
                          alt: 'Brand Logo',
                          width: 14,
                          height: 10,
                        })
                      }
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700/80 rounded-xl text-left text-xs font-semibold text-slate-900 dark:text-slate-100 transition flex items-center gap-2 shadow-xs"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Event Logo</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Decorative Shapes</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        addElement({
                          type: 'line',
                          fillColor: '#d97706',
                          width: 40,
                          height: 0.5,
                        })
                      }
                      style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                      className="p-2.5 !bg-white hover:!bg-slate-50 dark:!bg-slate-800 dark:hover:!bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-left text-xs font-semibold !text-slate-800 dark:!text-slate-100 shadow-xs transition flex items-center gap-2"
                    >
                      <Minus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Divider Line</span>
                    </button>

                    <button
                      onClick={() =>
                        addElement({
                          type: 'shape',
                          fillColor: '#d9770615',
                          borderColor: '#d97706',
                          borderWidth: 1,
                          borderRadius: 8,
                          width: 30,
                          height: 12,
                        })
                      }
                      className="p-2.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-left text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-xs transition flex items-center gap-2"
                    >
                      <Square className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Border Box</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Upload Brand Assets</span>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="p-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs transition text-center">
                      <Upload className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Upload Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoUpload(file);
                        }}
                      />
                    </label>

                    <label className="p-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs transition text-center">
                      <Upload className="w-3.5 h-3.5 text-purple-600" />
                      <span>Signature</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleSignatureUpload(file);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Presets */}
            {activeTool === 'templates' && (
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  10 Ready-Made Presets
                </span>
                <div className="space-y-2">
                  {CERTIFICATE_PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset)}
                      className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500/60 rounded-xl cursor-pointer transition space-y-1 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{preset.name}</span>
                        <span className="text-[9px] font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/50">{preset.category}</span>
                      </div>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 line-clamp-1">{preset.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Theme & Background */}
            {activeTool === 'background' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Background Tone Preset</label>
                  <select
                    value={model.background.type}
                    onChange={(e) => {
                      const t = e.target.value as CertificateCanvasModel['background']['type'];
                      let bgCol = model.background.color || '#ffffff';
                      let grad: string | undefined = undefined;
                      if (t === 'dark') {
                        bgCol = '#090d16';
                        grad = 'linear-gradient(135deg, #090d16 0%, #0f172a 100%)';
                      } else if (t === 'parchment') {
                        bgCol = '#fdfbf7';
                        grad = undefined;
                      } else if (t === 'gradient') {
                        bgCol = '#f8fafc';
                        grad = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
                      } else if (t === 'mesh') {
                        bgCol = '#ffffff';
                        grad = 'radial-gradient(at 0% 0%, #fef3c7 0px, transparent 50%), radial-gradient(at 100% 100%, #e0e7ff 0px, transparent 50%), #ffffff';
                      } else if (t === 'solid') {
                        bgCol = '#ffffff';
                        grad = undefined;
                      }
                      pushState({
                        ...model,
                        background: {
                          ...model.background,
                          type: t,
                          color: bgCol,
                          gradient: grad,
                        },
                      });
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white shadow-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="solid">Crisp White (Solid)</option>
                    <option value="parchment">Antique Parchment Scroll</option>
                    <option value="dark">Midnight Dark Velvet</option>
                    <option value="gradient">Linear Gradient</option>
                    <option value="mesh">Aura Mesh Halo</option>
                    <option value="image">Custom Uploaded Image</option>
                  </select>
                </div>

                {/* Background Color Picker & Swatches */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Canvas Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={model.background.color || '#ffffff'}
                      onChange={(e) =>
                        pushState({
                          ...model,
                          background: { ...model.background, color: e.target.value },
                        })
                      }
                      className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={model.background.color || '#ffffff'}
                      onChange={(e) =>
                        pushState({
                          ...model,
                          background: { ...model.background, color: e.target.value },
                        })
                      }
                      className="w-24 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  {/* Quick Color Swatches */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {[
                      { name: 'White', color: '#ffffff' },
                      { name: 'Parchment', color: '#fcfbf7' },
                      { name: 'Cream', color: '#fefce8' },
                      { name: 'Navy', color: '#090d16' },
                      { name: 'Emerald', color: '#064e3b' },
                      { name: 'Slate', color: '#1e293b' },
                    ].map((swatch) => (
                      <button
                        key={swatch.color}
                        title={swatch.name}
                        onClick={() =>
                          pushState({
                            ...model,
                            background: { ...model.background, color: swatch.color },
                          })
                        }
                        className="w-6 h-6 rounded-md border border-slate-300 dark:border-slate-600 shadow-2xs hover:scale-110 transition"
                        style={{ backgroundColor: swatch.color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Background Image Upload / URL */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Background Image</span>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 p-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs transition text-center">
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>Upload BG Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleBgImageUpload(file);
                        }}
                      />
                    </label>
                    {model.background.imageUrl && (
                      <button
                        onClick={() =>
                          pushState({
                            ...model,
                            background: { ...model.background, imageUrl: undefined },
                          })
                        }
                        className="p-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/40"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* 10 Border Styles */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Canvas Border Style (10 Styles)</label>
                    <select
                      value={model.border.style}
                      onChange={(e) =>
                        pushState({
                          ...model,
                          border: {
                            ...model.border,
                            style: e.target.value as CertificateCanvasModel['border']['style'],
                            enabled: e.target.value !== 'none',
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white shadow-xs focus:outline-none focus:border-amber-500"
                    >
                      <option value="double_gold">1. Double Gold Prestige</option>
                      <option value="geometric">2. Geometric Corner Guides</option>
                      <option value="ornate">3. Ornate Regal Flourishes</option>
                      <option value="minimal">4. Minimal Sharp 1px Line</option>
                      <option value="dark_foil">5. Dark Metallic Foil</option>
                      <option value="clean_boxed">6. Clean Corporate Box</option>
                      <option value="modern_line">7. Modern Accent Line</option>
                      <option value="vintage">8. Vintage Certificate Scroll</option>
                      <option value="curvy_rounded">9. Curvy Rounded Soft Frame</option>
                      <option value="dashed_frame">10. Dashed Diplomatic Frame</option>
                      <option value="none">Frameless / No Border</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-400 block mb-1">Border Color</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={model.border.color}
                          onChange={(e) =>
                            pushState({
                              ...model,
                              border: { ...model.border, color: e.target.value },
                            })
                          }
                          className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 bg-transparent cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase">{model.border.color}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-400 block mb-1">
                        Width ({model.border.width || 3}px)
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={model.border.width || 3}
                        onChange={(e) =>
                          pushState({
                            ...model,
                            border: { ...model.border, width: Number(e.target.value) },
                          })
                        }
                        className="w-full accent-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-400 block mb-1">
                        Border Inset ({model.border.inset}%)
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={8}
                        value={model.border.inset}
                        onChange={(e) =>
                          pushState({
                            ...model,
                            border: { ...model.border, inset: Number(e.target.value) },
                          })
                        }
                        className="w-full accent-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-400 block mb-1">
                        Curvature ({model.border.borderRadius || 8}px)
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={36}
                        value={model.border.borderRadius || 8}
                        onChange={(e) =>
                          pushState({
                            ...model,
                            border: { ...model.border, borderRadius: Number(e.target.value) },
                          })
                        }
                        className="w-full accent-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Layers Manager */}
            {activeTool === 'layers' && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Layer Hierarchy ({model.elements.length})
                </span>
                <div className="space-y-1">
                  {[...model.elements].reverse().map((el) => {
                    const isSel = el.id === selectedId;
                    return (
                      <div
                        key={el.id}
                        onClick={() => setSelectedId(el.id)}
                        className={`p-2 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition ${isSel
                          ? 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-500/20 dark:border-amber-500/40 dark:text-amber-300'
                          : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
                          }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-[9px] uppercase text-slate-500 dark:text-slate-400">{el.type}</span>
                          <span className="truncate font-medium">{el.content || el.signatoryName || el.id}</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateSelected({ locked: !el.locked });
                            }}
                            className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          >
                            {el.locked ? <Lock className="w-3 h-3 text-amber-500" /> : <Unlock className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteElement(el.id);
                            }}
                            className="p-1 text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* CENTER PANEL: Interactive Canvas Area */}
        <main
          ref={workspaceRef}
          className="flex-1 bg-slate-200/70 dark:bg-slate-950 p-6 flex items-center justify-center overflow-auto relative"
          onClick={() => setSelectedId(null)}
        >
          {/* Canvas Wrapper scaled uniformly to fit viewport with zoom */}
          <div
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              transform: `scale(${fitScale * zoom})`,
              transformOrigin: 'center center',
              transition: isDragging || isResizing ? 'none' : 'transform 0.15s ease',
            }}
            className="shrink-0 flex items-center justify-center relative p-0"
          >
            {/* Real Canvas Sheet (Exact 1000 x 707 virtual units) */}
            <div
              ref={canvasRef}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full h-full overflow-hidden rounded-2xl shadow-2xl select-none transition-colors duration-200 border border-slate-800"
              style={{
                backgroundColor: model.background.color || '#ffffff',
                backgroundImage: model.background.imageUrl
                  ? `url(${model.background.imageUrl})`
                  : model.background.gradient || undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Outer Certificate Border */}
              {model.border.enabled && model.border.style !== 'none' && (
                <div
                  className="absolute pointer-events-none transition-all duration-150"
                  style={{
                    inset: `${model.border.inset}%`,
                    borderRadius:
                      model.border.style === 'curvy_rounded'
                        ? '28px'
                        : `${model.border.borderRadius !== undefined ? model.border.borderRadius : 8}px`,
                    borderWidth: `${model.border.width || 3}px`,
                    borderColor: model.border.color || '#d97706',
                    borderStyle:
                      model.border.style === 'dashed_frame'
                        ? 'dashed'
                        : model.border.style === 'double_gold'
                          ? 'double'
                          : model.border.style === 'vintage'
                            ? 'groove'
                            : 'solid',
                  }}
                />
              )}

              {/* Inner Decorative Accent for Double Gold / Ornate / Clean Boxed */}
              {(model.border.style === 'double_gold' ||
                model.border.style === 'ornate' ||
                model.border.style === 'clean_boxed') && (
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      inset: `${model.border.inset + 1.5}%`,
                      borderRadius: `${Math.max(0, (model.border.borderRadius || 8) - 4)}px`,
                      border: `1px solid ${model.border.color}55`,
                    }}
                  />
                )}

              {/* Elements Rendered on Canvas */}
              {model.elements.map((el) => {
                if (el.hidden) return null;
                const isSel = el.id === selectedId;

                return (
                  <div
                    key={el.id}
                    onMouseDown={(e) => handleMouseDownElement(e, el)}
                    className={`absolute cursor-move select-none group ${isSel ? 'ring-2 ring-amber-500 rounded-sm' : 'hover:ring-1 hover:ring-amber-400/50'
                      }`}
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      width: `${el.width}%`,
                      height: `${el.height}%`,
                      transform: `rotate(${el.rotation}deg)`,
                      opacity: el.opacity,
                      zIndex: el.zIndex,
                    }}
                  >
                    {/* Render Content Based on Element Type */}
                    {el.type === 'title' || el.type === 'recipient' || el.type === 'body' || el.type === 'text' || el.type === 'org_name' ? (
                      <div
                        className={`w-full h-full flex items-center leading-tight overflow-hidden ${el.textAlign === 'center'
                          ? 'justify-center text-center'
                          : el.textAlign === 'right'
                            ? 'justify-end text-right'
                            : 'justify-start text-left'
                          }`}
                        style={{
                          fontFamily: getFontFamilyCss(el.fontFamily),
                          color: el.color || '#0f172a',
                          fontSize: `${el.fontSize || 14}px`,
                          fontWeight:
                            el.fontWeight === 'extrabold'
                              ? 800
                              : el.fontWeight === 'bold'
                                ? 700
                                : el.fontWeight === 'semibold'
                                  ? 600
                                  : el.fontWeight === 'medium'
                                    ? 500
                                    : 400,
                          fontStyle: el.fontStyle || 'normal',
                          letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                        }}
                      >
                        {interpolateText(el.content)}
                      </div>
                    ) : el.type === 'signatory' ? (
                      <div className="w-full h-full flex flex-col justify-end text-left space-y-1 overflow-hidden p-1">
                        <div className="h-6 flex items-end">
                          {el.signatureUrl ? (
                            <img src={el.signatureUrl} alt="Signature" className="h-6 max-w-full object-contain" />
                          ) : (
                            <span
                              className="text-xs font-serif italic tracking-wide select-none opacity-85 block truncate"
                              style={{ color: el.color || '#b45309', fontFamily: 'Georgia, "Brush Script MT", cursive, serif' }}
                            >
                              {el.signatoryName}
                            </span>
                          )}
                        </div>
                        {el.showSignatureLine && (
                          <div className="w-full h-[1px] bg-slate-400/40 my-0.5" />
                        )}
                        <div>
                          <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-tight truncate">
                            {el.signatoryName}
                          </p>
                          <p className="text-[8px] text-slate-500 dark:text-slate-400 leading-tight truncate">{el.signatoryTitle}</p>
                        </div>
                      </div>
                    ) : el.type === 'seal' ? (
                      <div className="w-full h-full flex items-center justify-center">
                        {renderSealGraphic(el.sealType, el.sealColor)}
                      </div>
                    ) : el.type === 'qr' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-0.5 p-1 bg-white/90 rounded border border-slate-200">
                        <QrCodePreview size={Math.min(60, 60)} />
                        <span className="text-[6px] text-slate-400 font-mono tracking-tight">VERIFY ONLINE</span>
                      </div>
                    ) : el.type === 'logo' ? (
                      <div className="w-full h-full flex items-center justify-center p-1">
                        {el.src ? (
                          <img src={el.src} alt={el.alt || 'Logo'} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <div className="w-full h-full border border-dashed border-slate-400 rounded flex items-center justify-center text-[8px] font-bold text-slate-500">
                            LOGO
                          </div>
                        )}
                      </div>
                    ) : el.type === 'line' ? (
                      <div className="w-full h-full rounded" style={{ backgroundColor: el.fillColor || '#d97706' }} />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundColor: el.fillColor || 'transparent',
                          borderColor: el.borderColor || 'transparent',
                          borderWidth: el.borderWidth ? `${el.borderWidth}px` : 0,
                          borderStyle: el.borderWidth ? 'solid' : 'none',
                          borderRadius: el.borderRadius ? `${el.borderRadius}px` : 0,
                        }}
                      />
                    )}

                    {/* Resize Handles (8 points on Selected Object) */}
                    {isSel && !el.locked && (
                      <>
                        <div
                          onMouseDown={(e) => handleMouseDownResize(e, 'nw')}
                          className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-amber-500 rounded-full cursor-nwse-resize border-2 border-white"
                        />
                        <div
                          onMouseDown={(e) => handleMouseDownResize(e, 'ne')}
                          className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-amber-500 rounded-full cursor-nesw-resize border-2 border-white"
                        />
                        <div
                          onMouseDown={(e) => handleMouseDownResize(e, 'se')}
                          className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-amber-500 rounded-full cursor-nwse-resize border-2 border-white"
                        />
                        <div
                          onMouseDown={(e) => handleMouseDownResize(e, 'sw')}
                          className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-amber-500 rounded-full cursor-nesw-resize border-2 border-white"
                        />
                        <div
                          onMouseDown={(e) => handleMouseDownResize(e, 'e')}
                          className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-2.5 bg-amber-500 rounded-full cursor-ew-resize border border-white"
                        />
                        <div
                          onMouseDown={(e) => handleMouseDownResize(e, 's')}
                          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-amber-500 rounded-full cursor-ns-resize border border-white"
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* RIGHT PANEL: Selected Element Properties Inspector (288px) */}
        <aside className="w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-4 flex flex-col shrink-0 overflow-y-auto space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-500" />
              <span>{selectedElement ? `${selectedElement.type.toUpperCase()} Properties` : 'Canvas Settings'}</span>
            </h3>
            {selectedElement && (
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">ID: {selectedElement.id.slice(-4)}</span>
            )}
          </div>

          {selectedElement ? (
            <div className="space-y-4 text-xs">
              {/* Text Content Editor */}
              {(selectedElement.type === 'title' ||
                selectedElement.type === 'recipient' ||
                selectedElement.type === 'body' ||
                selectedElement.type === 'text' ||
                selectedElement.type === 'org_name') && (
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">Text Content</label>
                    <textarea
                      rows={3}
                      value={selectedElement.content || ''}
                      onChange={(e) => updateSelected({ content: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:border-amber-500 shadow-xs"
                    />

                    {/* Variables quick chips */}
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => updateSelected({ content: `${selectedElement.content || ''} {{name}}` })}
                        className="text-[9px] px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-slate-700 font-semibold"
                      >
                        + {'{{name}}'}
                      </button>
                      <button
                        onClick={() => updateSelected({ content: `${selectedElement.content || ''} {{event}}` })}
                        className="text-[9px] px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-slate-700 font-semibold"
                      >
                        + {'{{event}}'}
                      </button>
                      <button
                        onClick={() => updateSelected({ content: `${selectedElement.content || ''} {{organization}}` })}
                        className="text-[9px] px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-slate-700 font-semibold"
                      >
                        + {'{{organization}}'}
                      </button>
                    </div>
                  </div>
                )}

              {/* Signatory Settings */}
              {selectedElement.type === 'signatory' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-400 mb-0.5">Signatory Name</label>
                    <input
                      type="text"
                      value={selectedElement.signatoryName || ''}
                      onChange={(e) => updateSelected({ signatoryName: e.target.value })}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-400 mb-0.5">Signatory Title</label>
                    <input
                      type="text"
                      value={selectedElement.signatoryTitle || ''}
                      onChange={(e) => updateSelected({ signatoryTitle: e.target.value })}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white shadow-xs"
                    />
                  </div>
                </div>
              )}

              {/* Seal Settings */}
              {selectedElement.type === 'seal' && (
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">Seal Emblem</label>
                  <select
                    value={selectedElement.sealType || 'gold_crest'}
                    onChange={(e) =>
                      updateSelected({ sealType: e.target.value as CanvasElement['sealType'] })
                    }
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white shadow-xs"
                  >
                    <option value="gold_crest">Gold Crest of Excellence</option>
                    <option value="laurel_wreath">Laurel Wreath of Honor</option>
                    <option value="shield_check">Verified Security Shield</option>
                    <option value="star_ribbon">Distinction Star Ribbon</option>
                    <option value="wax_seal">Wax Seal Medallion</option>
                  </select>
                </div>
              )}

              {/* Shape / Border Box Properties */}
              {selectedElement.type === 'shape' && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Border Box & Shape Styling
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-400 block mb-0.5">Fill Color</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={selectedElement.fillColor?.slice(0, 7) || '#d97706'}
                          onChange={(e) => updateSelected({ fillColor: `${e.target.value}25` })}
                          className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 bg-transparent cursor-pointer"
                        />
                        <button
                          onClick={() => updateSelected({ fillColor: 'transparent' })}
                          className="text-[9px] px-1.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-300 dark:border-slate-700 font-medium"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-400 block mb-0.5">Border Color</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={selectedElement.borderColor || '#d97706'}
                          onChange={(e) => updateSelected({ borderColor: e.target.value })}
                          className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 bg-transparent cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-400 block mb-0.5">
                        Border Width ({selectedElement.borderWidth || 1}px)
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={12}
                        value={selectedElement.borderWidth || 1}
                        onChange={(e) => updateSelected({ borderWidth: Number(e.target.value) })}
                        className="w-full accent-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-400 block mb-0.5">
                        Corner Radius ({selectedElement.borderRadius || 8}px)
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={36}
                        value={selectedElement.borderRadius || 8}
                        onChange={(e) => updateSelected({ borderRadius: Number(e.target.value) })}
                        className="w-full accent-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Logo / Image Properties */}
              {selectedElement.type === 'logo' && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Logo & Graphic Image
                  </span>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-400 block mb-0.5">Logo URL</label>
                    <input
                      type="text"
                      value={selectedElement.src || ''}
                      placeholder="https://... or upload below"
                      onChange={(e) => updateSelected({ src: e.target.value })}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <label className="p-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs transition text-center">
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Upload Image from Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => updateSelected({ src: ev.target?.result as string });
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              )}

              {/* Typography & Styling for Text Elements */}
              {(selectedElement.type === 'title' ||
                selectedElement.type === 'recipient' ||
                selectedElement.type === 'body' ||
                selectedElement.type === 'text' ||
                selectedElement.type === 'org_name') && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Typography (10 Google Fonts)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-400 block mb-0.5">Font Family</label>
                        <select
                          value={selectedElement.fontFamily || 'serif'}
                          onChange={(e) =>
                            updateSelected({ fontFamily: e.target.value as CanvasElement['fontFamily'] })
                          }
                          className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white shadow-xs"
                        >
                          <option value="playfair">Playfair Display (Serif)</option>
                          <option value="cinzel">Cinzel (Display)</option>
                          <option value="cormorant">Cormorant Garamond (Fine)</option>
                          <option value="inter">Inter (Modern Sans)</option>
                          <option value="montserrat">Montserrat (Clean)</option>
                          <option value="poppins">Poppins (Friendly)</option>
                          <option value="outfit">Outfit (Tech Bold)</option>
                          <option value="space_grotesk">Space Grotesk (Neo)</option>
                          <option value="plus_jakarta">Plus Jakarta Sans</option>
                          <option value="jetbrains_mono">JetBrains Mono</option>
                          <option value="serif">Standard Serif</option>
                          <option value="sans">Standard Sans</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-400 block mb-0.5">Size ({selectedElement.fontSize || 14}px)</label>
                        <input
                          type="range"
                          min={10}
                          max={64}
                          value={selectedElement.fontSize || 14}
                          onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })}
                          className="w-full accent-amber-500"
                        />
                      </div>
                    </div>

                    {/* Alignment buttons */}
                    <div className="flex items-center gap-1 pt-1">
                      <button
                        onClick={() => updateSelected({ textAlign: 'left' })}
                        className={`flex-1 py-1 rounded-md border flex items-center justify-center transition ${selectedElement.textAlign === 'left'
                          ? 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-500/20 dark:border-amber-500 dark:text-amber-300 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        title="Align Left"
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => updateSelected({ textAlign: 'center' })}
                        className={`flex-1 py-1 rounded-md border flex items-center justify-center transition ${selectedElement.textAlign === 'center'
                          ? 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-500/20 dark:border-amber-500 dark:text-amber-300 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        title="Align Center"
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => updateSelected({ textAlign: 'right' })}
                        className={`flex-1 py-1 rounded-md border flex items-center justify-center transition ${selectedElement.textAlign === 'right'
                          ? 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-500/20 dark:border-amber-500 dark:text-amber-300 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        title="Align Right"
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

              {/* Color & Rotation */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Color & Rotation</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-400 block mb-0.5">Color</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={selectedElement.color || selectedElement.sealColor || '#b45309'}
                        onChange={(e) => updateSelected({ color: e.target.value, sealColor: e.target.value })}
                        className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 bg-transparent cursor-pointer"
                      />
                      <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase">
                        {selectedElement.color || selectedElement.sealColor || '#b45309'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-400 block mb-0.5">Rotate ({selectedElement.rotation}°)</label>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={selectedElement.rotation || 0}
                      onChange={(e) => updateSelected({ rotation: Number(e.target.value) })}
                      className="w-full accent-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Element Action Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => duplicateElement(selectedElement.id)}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
                  >
                    <Copy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Duplicate</span>
                  </button>

                  <button
                    onClick={() => deleteElement(selectedElement.id)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition shadow-xs"
                    title="Delete Element"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => bringForward(selectedElement.id)}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] font-medium text-slate-800 dark:text-slate-200 shadow-xs"
                  >
                    Bring Forward
                  </button>
                  <button
                    onClick={() => sendBackward(selectedElement.id)}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] font-medium text-slate-800 dark:text-slate-200 shadow-xs"
                  >
                    Send Backward
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs italic space-y-2">
              <p>Click any element on the certificate canvas to inspect and edit its positioning, fonts, colors, and properties.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
