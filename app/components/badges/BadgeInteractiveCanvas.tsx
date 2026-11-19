'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  BadgeLayoutData,
  AttendeeBadgeData,
  DEFAULT_REGISTRATION,
  DEFAULT_QR,
  DEFAULT_NAME,
  DEFAULT_CATEGORY,
} from '@/app/components/BadgeRenderer';

export type EditableBadgeElement =
  | 'name'
  | 'registration'
  | 'qr'
  | 'category'
  | 'organizationName'
  | 'eventName'
  | 'medicalCouncilNumber';

interface BadgeInteractiveCanvasProps {
  layout: BadgeLayoutData;
  attendee: AttendeeBadgeData;
  scale?: number;
  selectedElement: EditableBadgeElement | null;
  onSelectElement: (el: EditableBadgeElement | null) => void;
  onChangeLayout: (updater: (prev: BadgeLayoutData) => BadgeLayoutData) => void;
}

export default function BadgeInteractiveCanvas({
  layout,
  attendee,
  scale = 0.75,
  selectedElement,
  onSelectElement,
  onChangeLayout,
}: BadgeInteractiveCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Dragging / Resizing State
  const [dragState, setDragState] = useState<{
    element: EditableBadgeElement;
    mode: 'move' | 'resize-e' | 'resize-se';
    startX: number;
    startY: number;
    initLeft: number;
    initTop: number;
    initWidth?: number;
    initHeight?: number;
    initSize?: number;
  } | null>(null);

  // Generate QR code for sample preview
  useEffect(() => {
    let active = true;
    if (attendee?.qrToken) {
      QRCode.toDataURL(
        attendee.qrToken,
        {
          width: 320,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' },
          errorCorrectionLevel: 'M',
        },
        (err, url) => {
          if (!err && active && url) {
            setQrDataUrl(url);
          }
        }
      );
    }
    return () => {
      active = false;
    };
  }, [attendee?.qrToken]);

  // Convert pixels to inches based on current scale (96 DPI standard CSS inch)
  const pxToIn = useCallback(
    (px: number) => {
      return px / (96 * scale);
    },
    [scale]
  );

  // Global mouse/touch move and up listeners during active drag
  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const deltaXIn = pxToIn(clientX - dragState.startX);
      const deltaYIn = pxToIn(clientY - dragState.startY);

      const el = dragState.element;

      onChangeLayout((prev) => {
        const next = { ...prev };

        if (dragState.mode === 'move') {
          const newLeft = Math.max(0, Math.round((dragState.initLeft + deltaXIn) * 100) / 100);
          const newTop = Math.max(0, Math.round((dragState.initTop + deltaYIn) * 100) / 100);

          if (el === 'qr') {
            next.qr = { ...next.qr, left: newLeft, top: newTop };
          } else if (el === 'name') {
            next.name = { ...next.name, left: newLeft, top: newTop };
          } else if (el === 'registration') {
            next.registration = { ...next.registration, left: newLeft, top: newTop };
          } else if (el === 'category' && next.category) {
            next.category = { ...next.category, left: newLeft, top: newTop };
          } else if (el === 'organizationName' && next.organizationName) {
            next.organizationName = { ...next.organizationName, left: newLeft, top: newTop };
          } else if (el === 'eventName' && next.eventName) {
            next.eventName = { ...next.eventName, left: newLeft, top: newTop };
          } else if (el === 'medicalCouncilNumber' && next.medicalCouncilNumber) {
            next.medicalCouncilNumber = { ...next.medicalCouncilNumber, left: newLeft, top: newTop };
          }
        } else if (dragState.mode === 'resize-e' || dragState.mode === 'resize-se') {
          if (el === 'qr') {
            const currentSize = dragState.initSize || 1.3;
            const newSize = Math.max(0.5, Math.round((currentSize + deltaXIn) * 100) / 100);
            next.qr = { ...next.qr, size: newSize };
          } else {
            const currentWidth = dragState.initWidth || 3.0;
            const newWidth = Math.max(0.5, Math.round((currentWidth + deltaXIn) * 100) / 100);

            if (el === 'name') next.name = { ...next.name, width: newWidth };
            else if (el === 'registration') next.registration = { ...next.registration, width: newWidth };
            else if (el === 'category' && next.category) next.category = { ...next.category, width: newWidth };
            else if (el === 'organizationName' && next.organizationName) next.organizationName = { ...next.organizationName, width: newWidth };
            else if (el === 'eventName' && next.eventName) next.eventName = { ...next.eventName, width: newWidth };
            else if (el === 'medicalCouncilNumber' && next.medicalCouncilNumber) next.medicalCouncilNumber = { ...next.medicalCouncilNumber, width: newWidth };
          }
        }

        return next;
      });
    };

    const handlePointerUp = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [dragState, pxToIn, onChangeLayout]);

  // Keyboard navigation for selected element
  useEffect(() => {
    if (!selectedElement) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        // Prevent default page scroll
        e.preventDefault();
        const step = e.shiftKey ? 0.1 : 0.02;

        onChangeLayout((prev) => {
          const next = { ...prev };
          const el = selectedElement;

          const move = (target: { top: number; left: number }) => {
            let { top, left } = target;
            if (e.key === 'ArrowUp') top = Math.max(0, Math.round((top - step) * 100) / 100);
            if (e.key === 'ArrowDown') top = Math.round((top + step) * 100) / 100;
            if (e.key === 'ArrowLeft') left = Math.max(0, Math.round((left - step) * 100) / 100);
            if (e.key === 'ArrowRight') left = Math.round((left + step) * 100) / 100;
            return { top, left };
          };

          if (el === 'qr') {
            const { top, left } = move(next.qr);
            next.qr = { ...next.qr, top, left };
          } else if (el === 'name') {
            const { top, left } = move(next.name);
            next.name = { ...next.name, top, left };
          } else if (el === 'registration') {
            const { top, left } = move(next.registration);
            next.registration = { ...next.registration, top, left };
          } else if (el === 'category' && next.category) {
            const { top, left } = move(next.category);
            next.category = { ...next.category, top, left };
          } else if (el === 'organizationName' && next.organizationName) {
            const { top, left } = move(next.organizationName);
            next.organizationName = { ...next.organizationName, top, left };
          } else if (el === 'eventName' && next.eventName) {
            const { top, left } = move(next.eventName);
            next.eventName = { ...next.eventName, top, left };
          } else if (el === 'medicalCouncilNumber' && next.medicalCouncilNumber) {
            const { top, left } = move(next.medicalCouncilNumber);
            next.medicalCouncilNumber = { ...next.medicalCouncilNumber, top, left };
          }

          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, onChangeLayout]);

  const startDrag = (
    e: React.MouseEvent | React.TouchEvent,
    element: EditableBadgeElement,
    mode: 'move' | 'resize-e' | 'resize-se'
  ) => {
    e.stopPropagation();
    onSelectElement(element);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    let initLeft = 0;
    let initTop = 0;
    let initWidth: number | undefined;
    let initSize: number | undefined;

    if (element === 'qr') {
      const qrObj = layout?.qr || DEFAULT_QR;
      initLeft = qrObj.left ?? 1.35;
      initTop = qrObj.top ?? 2.42;
      initSize = qrObj.size ?? 1.3;
    } else {
      const style =
        element === 'name'
          ? (layout?.name || DEFAULT_NAME)
          : element === 'registration'
          ? (layout?.registration || DEFAULT_REGISTRATION)
          : element === 'category'
          ? (layout?.category || DEFAULT_CATEGORY)
          : element === 'organizationName'
          ? layout?.organizationName
          : element === 'eventName'
          ? layout?.eventName
          : layout?.medicalCouncilNumber;

      if (style) {
        initLeft = style.left ?? 0.25;
        initTop = style.top ?? 2.1;
        initWidth = style.width ?? 3.5;
      }
    }

    setDragState({
      element,
      mode,
      startX: clientX,
      startY: clientY,
      initLeft,
      initTop,
      initWidth,
      initSize,
    });
  };

  const safeLayout = layout || ({} as BadgeLayoutData);
  const widthIn = safeLayout.badgeWidthIn || 4;
  const heightIn = safeLayout.badgeHeightIn || 6;
  const bgImg = safeLayout.backgroundImageUrl || '/Empty_Sample.png';
  const regLayout = safeLayout.registration || DEFAULT_REGISTRATION;
  const qrLayout = safeLayout.qr || DEFAULT_QR;
  const nameLayout = safeLayout.name || DEFAULT_NAME;
  const catLayout = safeLayout.category || DEFAULT_CATEGORY;
  const orgLayout = safeLayout.organizationName;
  const evtLayout = safeLayout.eventName;
  const medLayout = safeLayout.medicalCouncilNumber;

  return (
    <div
      ref={containerRef}
      onClick={() => onSelectElement(null)}
      className="relative select-none rounded-xl shadow-xl transition-all duration-150 overflow-hidden"
      style={{
        width: `${widthIn * 96 * scale}px`,
        height: `${heightIn * 96 * scale}px`,
        backgroundColor: '#ffffff',
      }}
    >
      {/* Scaled Container */}
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: `${widthIn}in`,
          height: `${heightIn}in`,
          transform: `scale(${scale})`,
        }}
      >
        {/* Background Artwork */}
        {safeLayout.showBackground && bgImg && (
          <img
            src={bgImg}
            alt="Badge Background Artwork"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        )}

        {/* 1. Registration Number */}
        {regLayout && regLayout.visible !== false && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelectElement('registration');
            }}
            onMouseDown={(e) => startDrag(e, 'registration', 'move')}
            onTouchStart={(e) => startDrag(e, 'registration', 'move')}
            className={`absolute font-bold tracking-wider font-mono cursor-move transition-shadow rounded-sm ${
              selectedElement === 'registration'
                ? 'ring-2 ring-blue-500 bg-blue-500/10'
                : 'hover:ring-1 hover:ring-blue-300'
            }`}
            style={{
              top: `${regLayout.top ?? 2.1}in`,
              left: `${regLayout.left ?? 0.25}in`,
              width: `${regLayout.width ?? 3.5}in`,
              fontSize: `${regLayout.fontSize ?? 0.22}in`,
              color: regLayout.color || '#cf252b',
              textAlign: regLayout.textAlign || 'center',
              lineHeight: 1.15,
            }}
          >
            {attendee.registrationNumber || 'REG-1001'}

            {/* Resize Handle */}
            {selectedElement === 'registration' && (
              <div
                onMouseDown={(e) => startDrag(e, 'registration', 'resize-e')}
                onTouchStart={(e) => startDrag(e, 'registration', 'resize-e')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-blue-600 border border-white rounded-full shadow-sm cursor-ew-resize hover:scale-125 transition-transform"
                title="Drag to resize width"
              />
            )}
          </div>
        )}

        {/* 2. QR Code Element */}
        {qrLayout && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelectElement('qr');
            }}
            onMouseDown={(e) => startDrag(e, 'qr', 'move')}
            onTouchStart={(e) => startDrag(e, 'qr', 'move')}
            className={`absolute flex items-center justify-center bg-white p-1 rounded-sm cursor-move shadow-xs transition-shadow ${
              selectedElement === 'qr'
                ? 'ring-2 ring-blue-500 ring-offset-2'
                : 'hover:ring-1 hover:ring-blue-300'
            }`}
            style={{
              top: `${qrLayout.top ?? 2.42}in`,
              left: `${qrLayout.left ?? 1.35}in`,
              width: `${qrLayout.size ?? 1.3}in`,
              height: `${qrLayout.size ?? 1.3}in`,
              boxSizing: 'border-box',
            }}
          >
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code Preview"
                className="w-full h-full object-contain pointer-events-none"
              />
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[9px] text-slate-400 font-mono">
                QR
              </div>
            )}

            {/* Resize Handle for QR Size */}
            {selectedElement === 'qr' && (
              <div
                onMouseDown={(e) => startDrag(e, 'qr', 'resize-se')}
                onTouchStart={(e) => startDrag(e, 'qr', 'resize-se')}
                className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-sm cursor-se-resize hover:scale-125 transition-transform"
                title="Drag to resize QR"
              />
            )}
          </div>
        )}

        {/* 3. Attendee Name */}
        {nameLayout && nameLayout.visible !== false && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelectElement('name');
            }}
            onMouseDown={(e) => startDrag(e, 'name', 'move')}
            onTouchStart={(e) => startDrag(e, 'name', 'move')}
            className={`absolute font-bold tracking-tight cursor-move transition-shadow rounded-sm ${
              selectedElement === 'name'
                ? 'ring-2 ring-blue-500 bg-blue-500/10'
                : 'hover:ring-1 hover:ring-blue-300'
            }`}
            style={{
              top: `${nameLayout.top ?? 3.85}in`,
              left: `${nameLayout.left ?? 0.25}in`,
              width: `${nameLayout.width ?? 3.5}in`,
              fontSize: `${nameLayout.fontSize ?? 0.25}in`,
              color: nameLayout.color || '#0f172a',
              textAlign: nameLayout.textAlign || 'center',
              lineHeight: 1.15,
            }}
          >
            <div>{attendee.name || 'Surya Kumar'}</div>

            {/* Resize Handle */}
            {selectedElement === 'name' && (
              <div
                onMouseDown={(e) => startDrag(e, 'name', 'resize-e')}
                onTouchStart={(e) => startDrag(e, 'name', 'resize-e')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-blue-600 border border-white rounded-full shadow-sm cursor-ew-resize hover:scale-125 transition-transform"
                title="Drag to resize width"
              />
            )}
          </div>
        )}

        {/* 4. Attendee Category */}
        {catLayout && catLayout.visible !== false && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelectElement('category');
            }}
            onMouseDown={(e) => startDrag(e, 'category', 'move')}
            onTouchStart={(e) => startDrag(e, 'category', 'move')}
            className={`absolute font-semibold uppercase tracking-wider cursor-move transition-shadow rounded-sm ${
              selectedElement === 'category'
                ? 'ring-2 ring-blue-500 bg-blue-500/10'
                : 'hover:ring-1 hover:ring-blue-300'
            }`}
            style={{
              top: `${catLayout.top ?? 4.55}in`,
              left: `${catLayout.left ?? 0.25}in`,
              width: `${catLayout.width ?? 3.5}in`,
              fontSize: `${catLayout.fontSize ?? 0.2}in`,
              color: catLayout.color ?? '#475569',
              textAlign: catLayout.textAlign || 'center',
              lineHeight: 1.15,
            }}
          >
            <div>{attendee.category || 'DELEGATE'}</div>

            {selectedElement === 'category' && (
              <div
                onMouseDown={(e) => startDrag(e, 'category', 'resize-e')}
                onTouchStart={(e) => startDrag(e, 'category', 'resize-e')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-blue-600 border border-white rounded-full shadow-sm cursor-ew-resize hover:scale-125 transition-transform"
              />
            )}
          </div>
        )}

        {/* 5. Organization / Company Name */}
        {orgLayout && orgLayout.visible && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelectElement('organizationName');
            }}
            onMouseDown={(e) => startDrag(e, 'organizationName', 'move')}
            onTouchStart={(e) => startDrag(e, 'organizationName', 'move')}
            className={`absolute font-medium cursor-move transition-shadow rounded-sm ${
              selectedElement === 'organizationName'
                ? 'ring-2 ring-blue-500 bg-blue-500/10'
                : 'hover:ring-1 hover:ring-blue-300'
            }`}
            style={{
              top: `${orgLayout.top ?? 5.0}in`,
              left: `${orgLayout.left ?? 0.25}in`,
              width: `${orgLayout.width ?? 3.5}in`,
              fontSize: `${orgLayout.fontSize ?? 0.2}in`,
              color: orgLayout.color || '#475569',
              textAlign: orgLayout.textAlign || 'center',
              lineHeight: 1.15,
            }}
          >
            <div>Acme Healthcare Innovations</div>

            {selectedElement === 'organizationName' && (
              <div
                onMouseDown={(e) => startDrag(e, 'organizationName', 'resize-e')}
                onTouchStart={(e) => startDrag(e, 'organizationName', 'resize-e')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-blue-600 border border-white rounded-full shadow-sm cursor-ew-resize hover:scale-125 transition-transform"
              />
            )}
          </div>
        )}

        {/* 6. Event Name */}
        {evtLayout && evtLayout.visible && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelectElement('eventName');
            }}
            onMouseDown={(e) => startDrag(e, 'eventName', 'move')}
            onTouchStart={(e) => startDrag(e, 'eventName', 'move')}
            className={`absolute font-semibold cursor-move transition-shadow rounded-sm ${
              selectedElement === 'eventName'
                ? 'ring-2 ring-blue-500 bg-blue-500/10'
                : 'hover:ring-1 hover:ring-blue-300'
            }`}
            style={{
              top: `${evtLayout.top ?? 1.0}in`,
              left: `${evtLayout.left ?? 0.25}in`,
              width: `${evtLayout.width ?? 3.5}in`,
              fontSize: `${evtLayout.fontSize ?? 0.2}in`,
              color: evtLayout.color || '#0f172a',
              textAlign: evtLayout.textAlign || 'center',
              lineHeight: 1.15,
            }}
          >
            <div>Global Tech & Medical Summit</div>

            {selectedElement === 'eventName' && (
              <div
                onMouseDown={(e) => startDrag(e, 'eventName', 'resize-e')}
                onTouchStart={(e) => startDrag(e, 'eventName', 'resize-e')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-blue-600 border border-white rounded-full shadow-sm cursor-ew-resize hover:scale-125 transition-transform"
              />
            )}
          </div>
        )}

        {/* 7. Medical Council / Designation */}
        {medLayout && medLayout.visible && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelectElement('medicalCouncilNumber');
            }}
            onMouseDown={(e) => startDrag(e, 'medicalCouncilNumber', 'move')}
            onTouchStart={(e) => startDrag(e, 'medicalCouncilNumber', 'move')}
            className={`absolute font-medium text-slate-600 cursor-move transition-shadow rounded-sm ${
              selectedElement === 'medicalCouncilNumber'
                ? 'ring-2 ring-blue-500 bg-blue-500/10'
                : 'hover:ring-1 hover:ring-blue-300'
            }`}
            style={{
              top: `${medLayout.top ?? 5.2}in`,
              left: `${medLayout.left ?? 0.25}in`,
              width: `${medLayout.width ?? 3.5}in`,
              fontSize: `${medLayout.fontSize ?? 0.16}in`,
              color: medLayout.color || '#475569',
              textAlign: medLayout.textAlign || 'center',
              lineHeight: 1.15,
            }}
          >
            <div>MCI-88912 • Senior Consultant</div>

            {selectedElement === 'medicalCouncilNumber' && (
              <div
                onMouseDown={(e) => startDrag(e, 'medicalCouncilNumber', 'resize-e')}
                onTouchStart={(e) => startDrag(e, 'medicalCouncilNumber', 'resize-e')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-blue-600 border border-white rounded-full shadow-sm cursor-ew-resize hover:scale-125 transition-transform"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
