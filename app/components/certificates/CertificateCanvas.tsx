'use client';

import React from 'react';
import { Award, ShieldCheck, Star, QrCode } from 'lucide-react';
import { CertificateTemplatePreset } from '@/lib/certificates/templates';

export interface CertificateDesignConfig {
  title: string;
  bodyText: string;
  signatoryName: string;
  signatoryTitle: string;
  recipientNameSample?: string;
  organizationName?: string;
  eventName?: string;
  theme: CertificateTemplatePreset['theme'];
  logoUrl?: string | null;
  signatureUrl?: string | null;
  referenceId?: string;
}

interface CertificateCanvasProps {
  config: CertificateDesignConfig;
  className?: string;
}

export default function CertificateCanvas({ config, className = '' }: CertificateCanvasProps) {
  const {
    title,
    bodyText,
    signatoryName,
    signatoryTitle,
    recipientNameSample = 'Dr. Sarah Jenkins',
    organizationName = 'MS Backstage Organization',
    eventName = 'Global Annual Conference 2026',
    theme,
    logoUrl,
    signatureUrl,
    referenceId = 'CERT-VERIFIED-98421',
  } = config;

  // Resolve font style
  const fontClass =
    theme.fontFamily === 'serif'
      ? 'font-serif'
      : theme.fontFamily === 'mono'
      ? 'font-mono'
      : theme.fontFamily === 'display'
      ? 'font-serif tracking-wider'
      : 'font-sans';

  // Render Seal Emblem
  const renderSeal = () => {
    switch (theme.sealType) {
      case 'gold_crest':
        return (
          <div
            className="w-16 h-16 rounded-full border-2 border-dashed flex flex-col items-center justify-center p-2 shadow-md shrink-0"
            style={{ borderColor: theme.sealColor, color: theme.sealColor }}
          >
            <Award className="w-8 h-8" />
            <span className="text-[7px] font-black uppercase tracking-tighter">OFFICIAL</span>
          </div>
        );
      case 'shield_check':
        return (
          <div
            className="w-16 h-16 rounded-xl border flex flex-col items-center justify-center p-2 shadow-md shrink-0"
            style={{
              borderColor: theme.sealColor,
              color: theme.sealColor,
              backgroundColor: `${theme.sealColor}10`,
            }}
          >
            <ShieldCheck className="w-8 h-8" />
            <span className="text-[7px] font-mono font-bold uppercase">VERIFIED</span>
          </div>
        );
      case 'laurel_wreath':
        return (
          <div
            className="w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center p-2 shadow-lg shrink-0"
            style={{
              borderColor: theme.sealColor,
              color: theme.sealColor,
            }}
          >
            <Award className="w-7 h-7" />
            <span className="text-[7px] font-serif font-bold uppercase tracking-widest">HONOR</span>
          </div>
        );
      case 'star_ribbon':
        return (
          <div
            className="w-16 h-16 rounded-full flex flex-col items-center justify-center p-2 shadow-md shrink-0"
            style={{
              background: `radial-gradient(circle, ${theme.sealColor}25 0%, ${theme.sealColor}05 70%)`,
              border: `2px solid ${theme.sealColor}`,
              color: theme.sealColor,
            }}
          >
            <Star className="w-7 h-7 fill-current" />
            <span className="text-[7px] font-bold uppercase tracking-wider">DISTINCTION</span>
          </div>
        );
      case 'wax_seal':
        return (
          <div
            className="w-16 h-16 rounded-full flex flex-col items-center justify-center p-2 shadow-xl shrink-0"
            style={{
              backgroundColor: theme.sealColor,
              color: '#ffffff',
              boxShadow: `0 4px 12px ${theme.sealColor}66`,
            }}
          >
            <Award className="w-8 h-8" />
            <span className="text-[6px] font-serif font-extrabold uppercase tracking-widest">SEAL</span>
          </div>
        );
      case 'none':
      default:
        return null;
    }
  };

  // Render QR Block
  const renderQr = () => (
    <div
      className="flex items-center gap-2 p-1.5 rounded-lg border shrink-0"
      style={{
        borderColor: `${theme.accentColor}33`,
        backgroundColor: theme.bgType === 'dark' ? '#0f172a88' : '#ffffffcc',
      }}
    >
      <QrCode className="w-9 h-9" style={{ color: theme.accentColor }} />
      <div className="text-left">
        <p className="text-[7px] uppercase font-bold tracking-tight" style={{ color: theme.textColor }}>
          Verify Online
        </p>
        <p className="text-[8px] font-mono font-bold" style={{ color: theme.titleColor }}>
          {referenceId}
        </p>
      </div>
    </div>
  );

  return (
    <div
      className={`relative w-full aspect-[16/10] sm:aspect-[16/10] overflow-hidden rounded-2xl shadow-2xl flex flex-col justify-between p-6 sm:p-10 select-none ${fontClass} ${className}`}
      style={{
        backgroundColor: theme.bgColor,
        backgroundImage: theme.bgGradient,
        color: theme.textColor,
      }}
    >
      {/* Outer Decorative Border */}
      <div
        className="absolute inset-3 sm:inset-4 rounded-xl pointer-events-none transition-all duration-300"
        style={{
          border:
            theme.borderStyle === 'double_gold'
              ? `4px double ${theme.borderColor}`
              : theme.borderStyle === 'geometric'
              ? `2px solid ${theme.borderColor}`
              : theme.borderStyle === 'dark_foil'
              ? `2px solid ${theme.borderColor}`
              : theme.borderStyle === 'minimal'
              ? `1px solid ${theme.borderColor}`
              : `2px dashed ${theme.borderColor}88`,
        }}
      />

      {/* Inner Inset Border for Formal/Luxury Styles */}
      {(theme.borderStyle === 'double_gold' || theme.borderStyle === 'dark_foil' || theme.borderStyle === 'ornate') && (
        <div
          className="absolute inset-5 sm:inset-6 rounded-lg pointer-events-none"
          style={{ border: `1px solid ${theme.borderColor}44` }}
        />
      )}

      {/* Header Row: Org & Event branding */}
      <div className="relative z-10 flex items-center justify-between text-left">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-9 w-auto object-contain rounded" />
          ) : (
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs"
              style={{
                backgroundColor: `${theme.accentColor}20`,
                color: theme.accentColor,
                border: `1px solid ${theme.accentColor}40`,
              }}
            >
              MS
            </div>
          )}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80" style={{ color: theme.textColor }}>
              {organizationName}
            </p>
            <p className="text-xs font-semibold" style={{ color: theme.accentColor }}>
              {eventName}
            </p>
          </div>
        </div>

        {/* Top-right corner tag */}
        <span
          className="text-[9px] font-mono uppercase px-2 py-0.5 rounded border tracking-wider"
          style={{
            borderColor: `${theme.accentColor}44`,
            color: theme.accentColor,
            backgroundColor: `${theme.accentColor}10`,
          }}
        >
          Official Credential
        </span>
      </div>

      {/* Main Certificate Centerpiece */}
      <div className="relative z-10 text-center my-auto py-2 space-y-2 sm:space-y-3">
        {/* Title */}
        <div>
          <h2
            className="text-xl sm:text-3xl font-black uppercase tracking-wide transition-all"
            style={{ color: theme.titleColor }}
          >
            {title || 'Certificate of Attendance'}
          </h2>
          <div
            className="w-20 h-0.5 mx-auto mt-1 sm:mt-2 transition-all"
            style={{ backgroundColor: theme.accentColor }}
          />
        </div>

        {/* Recipient Introduction */}
        <p className="text-[11px] sm:text-xs italic opacity-85">This certifies that</p>

        {/* Recipient Full Name */}
        <div className="py-1">
          <h3
            className="text-2xl sm:text-4xl font-extrabold tracking-tight"
            style={{
              color: theme.bgType === 'dark' ? '#f8fafc' : '#0f172a',
              textShadow: theme.bgType === 'dark' ? '0 2px 10px rgba(0,0,0,0.5)' : 'none',
            }}
          >
            {recipientNameSample}
          </h3>
        </div>

        {/* Body Statement with Interpolation */}
        <p
          className="text-[11px] sm:text-xs max-w-xl mx-auto leading-relaxed px-4 opacity-90 font-normal"
          style={{ color: theme.textColor }}
        >
          {bodyText.replace(/{{name}}/gi, recipientNameSample).replace(/{{event}}/gi, eventName)}
        </p>
      </div>

      {/* Footer Area: Signatures, Seal & QR Code */}
      <div className="relative z-10 pt-3 pb-1 border-t flex items-end justify-between gap-4 min-h-[70px]" style={{ borderColor: `${theme.borderColor}33` }}>
        {/* Left: Signatory */}
        <div className="text-left space-y-1 max-w-[200px]">
          {signatureUrl ? (
            <img src={signatureUrl} alt="Signature" className="h-7 w-auto object-contain mb-1" />
          ) : (
            <div className="h-6 flex items-end">
              <span
                className="text-xs sm:text-sm font-serif italic tracking-wider select-none opacity-90 block truncate"
                style={{ color: theme.accentColor, fontFamily: 'Georgia, "Brush Script MT", cursive, serif' }}
              >
                {signatoryName}
              </span>
            </div>
          )}
          <div className="w-32 sm:w-40 h-[1px] my-1" style={{ backgroundColor: theme.textColor, opacity: 0.35 }} />
          <div className="space-y-0.5">
            <p className="text-[10px] sm:text-[11px] font-bold leading-tight uppercase tracking-wider" style={{ color: theme.titleColor }}>
              {signatoryName}
            </p>
            <p className="text-[8px] sm:text-[9px] opacity-75 leading-tight line-clamp-1" style={{ color: theme.textColor }}>
              {signatoryTitle}
            </p>
          </div>
        </div>

        {/* Center: Seal Emblem */}
        <div className="hidden sm:flex items-center justify-center shrink-0">
          {renderSeal()}
        </div>

        {/* Right: QR Code / Reference */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {renderQr()}
          <span className="text-[7px] opacity-50 uppercase tracking-widest font-mono">
            Tamper-proof Digital Hash
          </span>
        </div>
      </div>
    </div>
  );
}
