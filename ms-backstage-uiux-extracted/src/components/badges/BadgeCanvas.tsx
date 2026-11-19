import React, { useRef, useState, useEffect } from 'react';
import { BadgeTemplate, BadgeElement, Attendee } from '../../types';
import { QrCode, Layers, User } from 'lucide-react';
import { generateQrDataUrl } from '../../lib/qr-generator';

interface BadgeCanvasProps {
  template: BadgeTemplate;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<BadgeElement>) => void;
  sampleAttendee: Attendee;
}

export const BadgeCanvas: React.FC<BadgeCanvasProps> = ({
  template,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  sampleAttendee
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState<'se' | 'sw' | 'ne' | 'nw' | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Generate genuine QR data url for the sample attendee
  useEffect(() => {
    generateQrDataUrl(sampleAttendee.qrCodeData).then(url => {
      if (url) setQrDataUrl(url);
    });
  }, [sampleAttendee.qrCodeData]);

  // Compute physical pixel scale for canvas (e.g. 1 inch = 96px display scale)
  const isLandscape = template.orientation === 'landscape';
  const widthPx = Math.round(template.widthInches * 90);
  const heightPx = Math.round(template.heightInches * 90);

  // Handle Drag Start
  const handleMouseDown = (e: React.MouseEvent, element: BadgeElement) => {
    e.stopPropagation();
    onSelectElement(element.id);
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const elXPx = (element.x / 100) * rect.width;
    const elYPx = (element.y / 100) * rect.height;

    setDragOffset({
      x: mouseX - elXPx,
      y: mouseY - elYPx
    });
    setIsDragging(true);
  };

  // Handle Resize Start
  const handleResizeStart = (e: React.MouseEvent, handle: 'se' | 'sw' | 'ne' | 'nw') => {
    e.stopPropagation();
    setIsResizing(true);
    setActiveHandle(handle);
  };

  // Global mousemove for drag & resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current || !selectedElementId) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const currentElement = template.elements.find(el => el.id === selectedElementId);
      if (!currentElement) return;

      if (isDragging) {
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newXPx = mouseX - dragOffset.x;
        const newYPx = mouseY - dragOffset.y;

        const newX = Math.max(0, Math.min(100 - currentElement.width, (newXPx / rect.width) * 100));
        const newY = Math.max(0, Math.min(100 - currentElement.height, (newYPx / rect.height) * 100));

        onUpdateElement(selectedElementId, {
          x: Math.round(newX),
          y: Math.round(newY)
        });
      } else if (isResizing && activeHandle === 'se') {
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const elXPx = (currentElement.x / 100) * rect.width;
        const elYPx = (currentElement.y / 100) * rect.height;

        const newWidthPx = mouseX - elXPx;
        const newHeightPx = mouseY - elYPx;

        const newWidth = Math.max(5, Math.min(100 - currentElement.x, (newWidthPx / rect.width) * 100));
        const newHeight = Math.max(2, Math.min(100 - currentElement.y, (newHeightPx / rect.height) * 100));

        onUpdateElement(selectedElementId, {
          width: Math.round(newWidth),
          height: Math.round(newHeight)
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setActiveHandle(null);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, selectedElementId, dragOffset, template.elements, onUpdateElement, activeHandle]);

  // Keyboard Nudge Support (Arrow Keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElementId) return;
      const target = e.target as HTMLElement;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return;

      const el = template.elements.find(i => i.id === selectedElementId);
      if (!el) return;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const delta = e.shiftKey ? 5 : 1;
        let newX = el.x;
        let newY = el.y;

        if (e.key === 'ArrowUp') newY = Math.max(0, el.y - delta);
        if (e.key === 'ArrowDown') newY = Math.min(100 - el.height, el.y + delta);
        if (e.key === 'ArrowLeft') newX = Math.max(0, el.x - delta);
        if (e.key === 'ArrowRight') newX = Math.min(100 - el.width, el.x + delta);

        onUpdateElement(selectedElementId, { x: newX, y: newY });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, template.elements, onUpdateElement]);

  return (
    <div 
      className="flex-1 min-h-[580px] flex items-center justify-center p-6 bg-slate-950/90 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden select-none"
      onClick={() => onSelectElement(null)}
    >
      {/* Background Architectural Canvas Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      {/* Canvas Dimensions Label */}
      <div className="absolute top-4 left-6 px-3 py-1 rounded-full glass-dock text-[11px] font-mono text-slate-300 flex items-center gap-2 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
        <span>Canvas: {template.widthInches}" × {template.heightInches}" ({widthPx} × {heightPx} px)</span>
      </div>

      {/* Physical Badge Render Container */}
      <div
        ref={canvasRef}
        className="relative shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden border border-slate-400/40 text-slate-900 transition-shadow duration-150"
        style={{
          width: `${widthPx}px`,
          height: `${heightPx}px`,
          backgroundColor: template.backgroundColor || '#ffffff'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Lanyard Hole Punch Slot Representation */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-2.5 rounded-full bg-slate-300/80 border border-slate-400/60 z-30 shadow-inner flex items-center justify-center pointer-events-none">
          <div className="w-8 h-1 rounded-full bg-slate-400/80" />
        </div>

        {/* Badge Elements Rendering */}
        {template.elements.map(el => {
          if (!el.visible) return null;
          const isSelected = selectedElementId === el.id;

          return (
            <div
              key={el.id}
              onMouseDown={(e) => handleMouseDown(e, el)}
              className={`absolute flex items-center justify-center cursor-move transition-all ${
                isSelected
                  ? 'ring-2 ring-indigo-500 shadow-md ring-offset-1 z-40'
                  : 'hover:ring-1 hover:ring-indigo-400/60'
              }`}
              style={{
                left: `${el.x}%`,
                top: `${el.y}%`,
                width: `${el.width}%`,
                height: `${el.height}%`,
                zIndex: isSelected ? 50 : el.zIndex,
                backgroundColor: el.backgroundColor || 'transparent',
                color: el.color || 'inherit',
                borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
                fontWeight: el.fontWeight || 'normal',
                fontStyle: el.fontStyle || 'normal',
                textAlign: el.textAlign || 'center'
              }}
            >
              {/* ELEMENT CONTENT TYPES */}
              {el.type === 'name' && (
                <span 
                  className="w-full tracking-tight px-1 select-none font-bold truncate leading-tight"
                  style={{ 
                    fontSize: `${el.fontSize || 22}px`,
                    textTransform: el.textCase || 'none'
                  }}
                >
                  {sampleAttendee.fullName}
                </span>
              )}

              {el.type === 'category' && (
                <span 
                  className="w-full font-bold uppercase tracking-wider text-center select-none truncate px-1"
                  style={{ 
                    fontSize: `${el.fontSize || 14}px`
                  }}
                >
                  {sampleAttendee.category}
                </span>
              )}

              {el.type === 'eventName' && (
                <span 
                  className="w-full font-semibold uppercase tracking-wide text-center px-1 select-none truncate"
                  style={{ 
                    fontSize: `${el.fontSize || 12}px`
                  }}
                >
                  Apex Global Summit 2026
                </span>
              )}

              {el.type === 'company' && (
                <span 
                  className="w-full text-center px-1 select-none truncate"
                  style={{ 
                    fontSize: `${el.fontSize || 12}px`
                  }}
                >
                  {sampleAttendee.company || 'Apex Technologies Inc.'}
                </span>
              )}

              {el.type === 'designation' && (
                <span 
                  className="w-full text-center px-1 select-none font-medium truncate"
                  style={{ 
                    fontSize: `${el.fontSize || 12}px`
                  }}
                >
                  {sampleAttendee.designation || 'Managing Director & Founder'}
                </span>
              )}

              {el.type === 'regNumber' && (
                <span 
                  className="w-full font-mono font-bold tracking-wider text-center select-none truncate"
                  style={{ 
                    fontSize: `${el.fontSize || 11}px`
                  }}
                >
                  {sampleAttendee.registrationNumber}
                </span>
              )}

              {el.type === 'qrCode' && (
                <div className="w-full h-full p-1 bg-white border border-slate-300 rounded flex items-center justify-center overflow-hidden">
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt="Attendee QR Code" 
                      className="w-full h-full object-contain pointer-events-none" 
                    />
                  ) : (
                    <QrCode className="w-full h-full text-slate-900 pointer-events-none" />
                  )}
                </div>
              )}

              {el.type === 'logo' && (
                <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-xs uppercase tracking-wider select-none">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>APEX SUMMIT</span>
                </div>
              )}

              {el.type === 'photo' && (
                <div className="w-full h-full rounded-full bg-slate-200 border-2 border-indigo-500/40 flex items-center justify-center text-slate-600 font-bold select-none shadow-sm">
                  <User className="w-8 h-8 text-slate-400" />
                </div>
              )}

              {el.type === 'divider' && (
                <div className="w-full h-full" style={{ backgroundColor: el.backgroundColor || '#cbd5e1' }} />
              )}

              {el.type === 'customText' && (
                <span 
                  className="w-full select-none truncate px-1"
                  style={{ 
                    fontSize: `${el.fontSize || 11}px`
                  }}
                >
                  {el.customText || 'Custom Badge Field'}
                </span>
              )}

              {/* Resize Handle (Bottom-Right) */}
              {isSelected && (
                <div
                  onMouseDown={(e) => handleResizeStart(e, 'se')}
                  className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-indigo-600 border-2 border-white rounded-full cursor-se-resize shadow-md"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
