'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  WebsiteElement,
  getFontFamilyCss,
  resolveElementProperty,
} from '@/lib/website/config';
import {
  Trash2,
  Copy,
  Lock,
  Unlock,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Ticket,
  ChevronRight,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface VisualElementCanvasProps {
  element: WebsiteElement;
  previewDevice?: 'desktop' | 'tablet' | 'mobile';
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<WebsiteElement>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  snapGrid?: boolean;
}

export default function VisualElementCanvas({
  element,
  previewDevice = 'desktop',
  isSelected,
  onSelect,
  onUpdate,
  onDuplicate,
  onDelete,
  onBringForward,
  onSendBackward,
  snapGrid = true,
}: VisualElementCanvasProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ mouseX: number; mouseY: number; elemX: number; elemY: number } | null>(null);

  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ mouseX: number; mouseY: number; startW: number; startH: number; startX: number; startY: number } | null>(null);

  const [isEditingInline, setIsEditingInline] = useState(false);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // Resolved responsive properties (cascades from desktop -> tablet -> mobile)
  const effectiveX = resolveElementProperty(element, 'x', previewDevice);
  const effectiveY = resolveElementProperty(element, 'y', previewDevice);
  const effectiveWidth = resolveElementProperty(element, 'width', previewDevice);
  const effectiveHeight = resolveElementProperty(element, 'height', previewDevice);
  const effectiveFontSize = resolveElementProperty(element, 'fontSize', previewDevice) || element.fontSize || 16;
  const effectiveTextAlign = resolveElementProperty(element, 'textAlign', previewDevice) || element.textAlign || 'left';
  const effectiveHidden = Boolean(resolveElementProperty(element, 'hidden', previewDevice));

  // Drag interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    if (element.locked) return;
    if (isEditingInline) return;
    e.stopPropagation();
    onSelect();

    setIsDragging(true);
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      elemX: effectiveX,
      elemY: effectiveY,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragStart && !element.locked) {
        const deltaX = ((e.clientX - dragStart.mouseX) / 800) * 100;
        const deltaY = ((e.clientY - dragStart.mouseY) / 400) * 100;

        let newX = Math.max(0, Math.min(100 - effectiveWidth, dragStart.elemX + deltaX));
        let newY = Math.max(0, Math.min(95, dragStart.elemY + deltaY));

        if (snapGrid) {
          // Snap to 2% intervals
          newX = Math.round(newX / 2) * 2;
          newY = Math.round(newY / 2) * 2;
        }

        onUpdate({ x: newX, y: newY });
      }

      if (isResizing && resizeStart && !element.locked) {
        const deltaXPx = e.clientX - resizeStart.mouseX;
        const deltaYPx = e.clientY - resizeStart.mouseY;

        let newWidth = resizeStart.startW;
        let newHeight = resizeStart.startH;

        if (resizeDirection?.includes('e')) {
          newWidth = Math.max(10, Math.min(100 - effectiveX, resizeStart.startW + (deltaXPx / 800) * 100));
        }
        if (resizeDirection?.includes('w')) {
          const addedW = -(deltaXPx / 800) * 100;
          newWidth = Math.max(10, resizeStart.startW + addedW);
        }
        if (resizeDirection?.includes('s')) {
          newHeight = Math.max(30, resizeStart.startH + deltaYPx);
        }
        if (resizeDirection?.includes('n')) {
          newHeight = Math.max(30, resizeStart.startH - deltaYPx);
        }

        if (snapGrid) {
          newWidth = Math.round(newWidth / 2) * 2;
          newHeight = Math.round(newHeight / 8) * 8;
        }

        onUpdate({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragStart(null);
      setIsResizing(false);
      setResizeStart(null);
      setResizeDirection(null);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, isResizing, resizeStart, resizeDirection, element.locked, effectiveX, effectiveWidth, snapGrid, onUpdate]);

  const handleResizeHandleMouseDown = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    if (element.locked) return;
    onSelect();
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      startW: effectiveWidth,
      startH: effectiveHeight,
      startX: effectiveX,
      startY: effectiveY,
    });
  };

  return (
    <div
      data-element-id={element.id}
      data-element-type={element.type}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`absolute select-none transition-shadow ${
        element.locked ? 'cursor-default' : 'cursor-move'
      } ${
        isSelected
          ? 'ring-2 ring-blue-600 ring-offset-1 rounded-lg z-30 shadow-lg'
          : 'hover:ring-1 hover:ring-blue-400/60 rounded-lg'
      }`}
      style={{
        left: `${effectiveX}%`,
        top: `${effectiveY}%`,
        width: `${effectiveWidth}%`,
        minHeight: `${effectiveHeight || 40}px`,
        zIndex: element.zIndex || 10,
        opacity: effectiveHidden ? 0.35 : (element.opacity ?? 1),
      }}
    >
      {/* FLOATING ACTION TOOLBAR ON SELECTION */}
      {isSelected && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute -top-11 left-0 flex items-center gap-1 bg-slate-900 text-white px-2 py-1 rounded-xl shadow-xl z-50 text-[11px] whitespace-nowrap animate-in fade-in zoom-in-95 duration-100"
        >
          <span className="font-mono text-[9px] uppercase font-bold text-blue-400 px-1 border-r border-slate-700">
            {element.type}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
            title="Duplicate Element"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ locked: !element.locked });
            }}
            className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
            title={element.locked ? 'Unlock Element' : 'Lock Element'}
          >
            {element.locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>

          {element.type === 'text' && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate({ textAlign: 'left' });
                }}
                className={`p-1 hover:bg-slate-800 rounded ${element.textAlign === 'left' ? 'text-blue-400' : 'text-slate-300'}`}
                title="Align Left"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate({ textAlign: 'center' });
                }}
                className={`p-1 hover:bg-slate-800 rounded ${element.textAlign === 'center' ? 'text-blue-400' : 'text-slate-300'}`}
                title="Align Center"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate({ textAlign: 'right' });
                }}
                className={`p-1 hover:bg-slate-800 rounded ${element.textAlign === 'right' ? 'text-blue-400' : 'text-slate-300'}`}
                title="Align Right"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {onBringForward && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onBringForward();
              }}
              className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
              title="Bring Forward"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          )}

          {onSendBackward && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSendBackward();
              }}
              className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
              title="Send Backward"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="w-[1px] h-3 bg-slate-700 mx-0.5" />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 hover:bg-red-900/50 rounded text-red-400 hover:text-red-300"
            title="Delete Element"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* RENDER ELEMENT BASED ON TYPE */}
      {element.type === 'text' && (
        <div
          onDoubleClick={() => setIsEditingInline(true)}
          className="w-full h-full p-1"
          style={{
            fontFamily: getFontFamilyCss(element.fontFamily),
            fontSize: `${effectiveFontSize}px`,
            fontWeight:
              element.fontWeight === 'extrabold'
                ? 800
                : element.fontWeight === 'bold'
                ? 700
                : element.fontWeight === 'semibold'
                ? 600
                : element.fontWeight === 'medium'
                ? 500
                : 400,
            fontStyle: element.fontStyle || 'normal',
            color: element.color || '#0f172a',
            textAlign: effectiveTextAlign,
            lineHeight: element.lineHeight || 1.5,
            letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : undefined,
            textTransform: element.textTransform || 'none',
          }}
        >
          {isEditingInline ? (
            <textarea
              ref={textInputRef}
              autoFocus
              value={element.content || ''}
              onChange={(e) => onUpdate({ content: e.target.value })}
              onBlur={() => setIsEditingInline(false)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsEditingInline(false);
              }}
              className="w-full h-full bg-blue-50/40 border border-blue-500 rounded p-1 text-inherit font-inherit outline-none resize-none"
              style={{
                fontFamily: 'inherit',
                fontSize: 'inherit',
                fontWeight: 'inherit',
                color: 'inherit',
              }}
            />
          ) : (
            <div className="whitespace-pre-line leading-relaxed">
              {element.content || 'Click or double click to type heading or paragraph text...'}
            </div>
          )}
        </div>
      )}

      {element.type === 'button' && (
        <div className="w-full h-full flex items-center justify-center p-1">
          <div
            className={`w-full h-full py-2.5 px-4 font-bold flex items-center justify-center gap-2 shadow-sm transition ${
              element.buttonVariant === 'outline'
                ? 'border-2 bg-transparent'
                : element.buttonVariant === 'ghost'
                ? 'bg-transparent hover:bg-slate-100'
                : 'shadow-md'
            }`}
            style={{
              backgroundColor: element.buttonVariant === 'outline' ? 'transparent' : element.buttonBg || '#2563eb',
              color: element.buttonTextColor || '#ffffff',
              borderRadius: `${element.buttonRadius !== undefined ? element.buttonRadius : 10}px`,
              borderColor: element.buttonVariant === 'outline' ? element.buttonBg || '#2563eb' : undefined,
            }}
          >
            {element.buttonIcon === 'ticket' && <Ticket className="w-4 h-4" />}
            {element.buttonIcon === 'calendar' && <Calendar className="w-4 h-4" />}
            {element.buttonIcon === 'sparkles' && <Sparkles className="w-4 h-4" />}
            <span>{element.buttonText || 'Click Here'}</span>
            {element.buttonIcon === 'arrow' && <ChevronRight className="w-4 h-4" />}
          </div>
        </div>
      )}

      {element.type === 'image' && (
        <div
          className="w-full h-full overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800"
          style={{
            borderRadius: `${element.imageRadius !== undefined ? element.imageRadius : 12}px`,
            border: element.imageBorder || undefined,
          }}
        >
          {element.imageUrl ? (
            <img
              src={element.imageUrl}
              alt={element.altText || 'Website Media'}
              className="w-full h-full pointer-events-none"
              style={{ objectFit: element.objectFit || 'cover' }}
            />
          ) : (
            <div className="p-4 text-center text-xs text-slate-400 font-semibold">
              Image Placeholder (Upload or drag asset)
            </div>
          )}
        </div>
      )}

      {element.type === 'card' && (
        <div
          className="w-full h-full p-4 border transition"
          style={{
            backgroundColor: element.cardBg || '#ffffff',
            borderColor: element.cardBorder || '#e2e8f0',
            borderRadius: `${element.cardRadius !== undefined ? element.cardRadius : 16}px`,
            padding: element.cardPadding ? `${element.cardPadding}px` : undefined,
          }}
        >
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Card Container
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {element.content || 'Use this container card to group features, pass options, or testimonials.'}
          </p>
        </div>
      )}

      {element.type === 'badge' && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{element.content || 'Official Credential'}</span>
        </div>
      )}

      {element.type === 'divider' && (
        <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full my-auto" />
      )}

      {/* 8 RESIZE HANDLES ON SELECTION */}
      {isSelected && !element.locked && (
        <>
          {/* NW */}
          <div
            onMouseDown={(e) => handleResizeHandleMouseDown(e, 'nw')}
            className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-full cursor-nwse-resize z-40 shadow-xs"
          />
          {/* N */}
          <div
            onMouseDown={(e) => handleResizeHandleMouseDown(e, 'n')}
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-blue-600 rounded-full cursor-ns-resize z-40 shadow-xs"
          />
          {/* NE */}
          <div
            onMouseDown={(e) => handleResizeHandleMouseDown(e, 'ne')}
            className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-full cursor-nesw-resize z-40 shadow-xs"
          />
          {/* E */}
          <div
            onMouseDown={(e) => handleResizeHandleMouseDown(e, 'e')}
            className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-600 rounded-full cursor-ew-resize z-40 shadow-xs"
          />
          {/* SE */}
          <div
            onMouseDown={(e) => handleResizeHandleMouseDown(e, 'se')}
            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-full cursor-nwse-resize z-40 shadow-xs"
          />
          {/* S */}
          <div
            onMouseDown={(e) => handleResizeHandleMouseDown(e, 's')}
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-blue-600 rounded-full cursor-ns-resize z-40 shadow-xs"
          />
          {/* SW */}
          <div
            onMouseDown={(e) => handleResizeHandleMouseDown(e, 'sw')}
            className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-full cursor-nesw-resize z-40 shadow-xs"
          />
          {/* W */}
          <div
            onMouseDown={(e) => handleResizeHandleMouseDown(e, 'w')}
            className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-600 rounded-full cursor-ew-resize z-40 shadow-xs"
          />
        </>
      )}
    </div>
  );
}
