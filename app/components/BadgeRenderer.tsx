'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export interface BadgeElementStyle {
  top: number;
  left: number;
  width: number;
  fontSize: number;
  color: string;
  textAlign?: 'left' | 'center' | 'right';
  visible?: boolean;
}

export interface BadgeQrStyle {
  top: number;
  left: number;
  size: number;
}

export interface BadgeLayoutData {
  badgeWidthIn: number;
  badgeHeightIn: number;
  backgroundImageUrl?: string | null;
  showBackground: boolean;
  registration: BadgeElementStyle;
  qr: BadgeQrStyle;
  name: BadgeElementStyle;
  category?: BadgeElementStyle;
  organizationName?: BadgeElementStyle;
  eventName?: BadgeElementStyle;
  medicalCouncilNumber?: BadgeElementStyle;
  pageSize?: {
    preset: string;
    name: string;
    width_mm: number;
    height_mm: number;
    columns: number;
    rows: number;
    badge_width_mm?: number;
    badge_height_mm?: number;
  };
}

export interface AttendeeBadgeData {
  id: string;
  name: string;
  registrationNumber: string;
  qrToken: string;
  category?: string | null;
  medicalCouncilNumber?: string | null;
  foodPreference?: string | null;
  eventName?: string | null;
}

function splitAttendeeName(name: string, maxLen = 28): string[] {
  const trimmed = (name || '').trim();
  if (trimmed.length <= maxLen) return [trimmed];
  const words = trimmed.split(/\s+/);
  if (words.length === 1) return [trimmed.slice(0, maxLen - 1) + '…'];

  let line1 = '';
  let line2 = '';
  for (const w of words) {
    if ((line1 + ' ' + w).trim().length <= maxLen) {
      line1 = (line1 + ' ' + w).trim();
    } else {
      line2 = (line2 + ' ' + w).trim();
    }
  }
  if (line2.length > maxLen) {
    line2 = line2.slice(0, maxLen - 1) + '…';
  }
  return [line1, line2].filter((l) => l.length > 0);
}

interface BadgeRendererProps {
  attendee: AttendeeBadgeData;
  layout: BadgeLayoutData;
  scale?: number;
  isPrint?: boolean;
}

export const DEFAULT_REGISTRATION: BadgeElementStyle = {
  top: 2.1,
  left: 0.25,
  width: 3.5,
  fontSize: 0.22,
  color: '#cf252b',
  textAlign: 'center',
  visible: true,
};

export const DEFAULT_QR: BadgeQrStyle = {
  top: 2.42,
  left: 1.35,
  size: 1.3,
};

export const DEFAULT_NAME: BadgeElementStyle = {
  top: 3.85,
  left: 0.25,
  width: 3.5,
  fontSize: 0.25,
  color: '#0f172a',
  textAlign: 'center',
  visible: true,
};

export const DEFAULT_CATEGORY: BadgeElementStyle = {
  top: 4.55,
  left: 0.25,
  width: 3.5,
  fontSize: 0.2,
  color: '#475569',
  textAlign: 'center',
  visible: true,
};

export default function BadgeRenderer({
  attendee,
  layout,
  scale = 1,
  isPrint = false,
}: BadgeRendererProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

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

  const nameLines = splitAttendeeName(attendee?.name || '');
  const regNo = (attendee?.registrationNumber || '').length > 24
    ? attendee.registrationNumber.slice(0, 23) + '…'
    : attendee?.registrationNumber || '';

  const safeLayout = layout || ({} as BadgeLayoutData);
  const widthIn = safeLayout.badgeWidthIn || 4;
  const heightIn = safeLayout.badgeHeightIn || 6;
  const bgImg = safeLayout.backgroundImageUrl || '/Empty_Sample.png';
  const showBg = safeLayout.showBackground !== false;

  const registration = safeLayout.registration || DEFAULT_REGISTRATION;
  const qr = safeLayout.qr || DEFAULT_QR;
  const nameStyle = safeLayout.name || DEFAULT_NAME;
  const categoryStyle = safeLayout.category || DEFAULT_CATEGORY;
  const medicalCouncilNumberStyle = safeLayout.medicalCouncilNumber;

  const badgeContent = (
    <div
      className="relative select-none overflow-hidden bg-white shadow-xs badge-canvas-container"
      style={{
        width: `${widthIn}in`,
        height: `${heightIn}in`,
        boxSizing: 'border-box',
      }}
    >
      {/* Background artwork */}
      {showBg && bgImg && (
        <img
          src={bgImg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
      )}

      {/* Registration Number Field */}
      {registration && registration.visible !== false && (
        <div
          className="absolute font-bold tracking-wider font-mono truncate"
          style={{
            top: `${registration.top ?? 2.1}in`,
            left: `${registration.left ?? 0.25}in`,
            width: `${registration.width ?? 3.5}in`,
            fontSize: `${registration.fontSize ?? 0.22}in`,
            color: registration.color || '#cf252b',
            textAlign: registration.textAlign || 'center',
            lineHeight: 1.15,
          }}
        >
          {regNo}
        </div>
      )}

      {/* QR Code Container */}
      {qr && (
        <div
          className="absolute flex items-center justify-center bg-white p-1 rounded-sm shadow-xs"
          style={{
            top: `${qr.top ?? 2.42}in`,
            left: `${qr.left ?? 1.35}in`,
            width: `${qr.size ?? 1.3}in`,
            height: `${qr.size ?? 1.3}in`,
            boxSizing: 'border-box',
          }}
        >
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR for ${regNo}`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[8px] text-slate-400">
              Generating…
            </div>
          )}
        </div>
      )}

      {/* Attendee Name Field */}
      {nameStyle && nameStyle.visible !== false && (
        <div
          className="absolute font-bold tracking-tight"
          style={{
            top: `${nameStyle.top ?? 3.85}in`,
            left: `${nameStyle.left ?? 0.25}in`,
            width: `${nameStyle.width ?? 3.5}in`,
            fontSize: `${nameStyle.fontSize ?? 0.25}in`,
            color: nameStyle.color || '#0f172a',
            textAlign: nameStyle.textAlign || 'center',
            lineHeight: 1.15,
          }}
        >
          {nameLines.map((line, idx) => (
            <div key={idx} className="truncate">
              {line}
            </div>
          ))}
        </div>
      )}

      {/* Category Field */}
      {categoryStyle && categoryStyle.visible !== false && attendee?.category && (
        <div
          className="absolute font-semibold uppercase tracking-wider truncate"
          style={{
            top: `${categoryStyle.top ?? 4.55}in`,
            left: `${categoryStyle.left ?? 0.25}in`,
            width: `${categoryStyle.width ?? 3.5}in`,
            fontSize: `${categoryStyle.fontSize ?? 0.2}in`,
            color: categoryStyle.color || '#475569',
            textAlign: categoryStyle.textAlign || 'center',
            lineHeight: 1.15,
          }}
        >
          {attendee.category}
        </div>
      )}

      {/* Medical Council Number Field (Optional) */}
      {medicalCouncilNumberStyle &&
        medicalCouncilNumberStyle.visible !== false &&
        attendee?.medicalCouncilNumber && (
          <div
            className="absolute font-medium text-slate-600 truncate"
            style={{
              top: `${medicalCouncilNumberStyle.top ?? 5.0}in`,
              left: `${medicalCouncilNumberStyle.left ?? 0.25}in`,
              width: `${medicalCouncilNumberStyle.width ?? 3.5}in`,
              fontSize: `${medicalCouncilNumberStyle.fontSize ?? 0.16}in`,
              color: medicalCouncilNumberStyle.color || '#475569',
              textAlign: medicalCouncilNumberStyle.textAlign || 'center',
              lineHeight: 1.15,
            }}
          >
            Reg: {attendee.medicalCouncilNumber}
          </div>
        )}
    </div>
  );

  if (isPrint || scale === 1) {
    return badgeContent;
  }

  // Scaled screen preview
  return (
    <div
      style={{
        width: `${widthIn * 96 * scale}px`,
        height: `${heightIn * 96 * scale}px`,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        backgroundColor: '#fff',
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {badgeContent}
      </div>
    </div>
  );
}
