/**
 * MS Backstage — Comprehensive Badge Templates & Dynamic Background Generator
 * 
 * Includes 5 major categories with 5 dedicated templates each (25 total templates),
 * plus dynamic SVG background generator allowing custom colors for all background elements.
 */

import { BadgeLayoutData } from '@/app/components/BadgeRenderer';

export interface BackgroundColorConfig {
  headerColor: string;
  accentColor: string;
  bgColor: string;
  footerColor: string;
  pattern: 'geometric' | 'waves' | 'minimal' | 'modern' | 'tech';
}

export interface BadgeTemplateDef {
  id: string;
  name: string;
  category: string;
  description: string;
  badgeWidthIn: number;
  badgeHeightIn: number;
  bgConfig?: BackgroundColorConfig;
  layout: BadgeLayoutData;
}

/**
 * Generates an SVG Data URI for empty badge backgrounds with customizable element colors
 */
export function generateSvgBackground(config: BackgroundColorConfig, width = 400, height = 600): string {
  const { headerColor, accentColor, bgColor, footerColor, pattern } = config;

  let patternSvg = '';
  if (pattern === 'waves') {
    patternSvg = `
      <path d="M0,120 C150,160 250,80 400,120 L400,0 L0,0 Z" fill="${headerColor}" opacity="0.95" />
      <path d="M0,130 C180,180 220,100 400,140 L400,120 C250,80 150,160 0,120 Z" fill="${accentColor}" opacity="0.6" />
      <path d="M0,520 C120,490 280,550 400,520 L400,600 L0,600 Z" fill="${footerColor}" opacity="0.9" />
    `;
  } else if (pattern === 'geometric') {
    patternSvg = `
      <polygon points="0,0 400,0 400,110 200,130 0,90" fill="${headerColor}" />
      <polygon points="0,90 200,130 400,110 400,125 200,145 0,105" fill="${accentColor}" opacity="0.7" />
      <polygon points="0,530 200,510 400,540 400,600 0,600" fill="${footerColor}" />
      <circle cx="360" cy="40" r="70" fill="#ffffff" opacity="0.08" />
      <circle cx="30" cy="560" r="50" fill="#ffffff" opacity="0.08" />
    `;
  } else if (pattern === 'tech') {
    patternSvg = `
      <rect x="0" y="0" width="400" height="90" fill="${headerColor}" />
      <rect x="0" y="90" width="400" height="6" fill="${accentColor}" />
      <line x1="20" y1="20" x2="380" y2="20" stroke="#ffffff" stroke-width="1" opacity="0.2" />
      <line x1="20" y1="70" x2="380" y2="70" stroke="#ffffff" stroke-width="1" opacity="0.2" />
      <rect x="0" y="550" width="400" height="50" fill="${footerColor}" />
      <rect x="0" y="544" width="400" height="6" fill="${accentColor}" />
      <circle cx="200" cy="300" r="140" fill="none" stroke="${accentColor}" stroke-width="1" stroke-dasharray="4,8" opacity="0.15" />
    `;
  } else if (pattern === 'modern') {
    patternSvg = `
      <defs>
        <linearGradient id="grad-header" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${headerColor}" />
          <stop offset="100%" stop-color="${accentColor}" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="400" height="110" fill="url(#grad-header)" rx="0" />
      <path d="M0,100 L400,70 L400,110 L0,110 Z" fill="${accentColor}" opacity="0.3" />
      <rect x="0" y="540" width="400" height="60" fill="${footerColor}" />
      <rect x="20" y="525" width="360" height="4" fill="${accentColor}" rx="2" />
    `;
  } else {
    // Minimal
    patternSvg = `
      <rect x="0" y="0" width="400" height="70" fill="${headerColor}" />
      <rect x="0" y="70" width="400" height="4" fill="${accentColor}" />
      <rect x="0" y="565" width="400" height="35" fill="${footerColor}" />
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 400 600">
    <rect width="400" height="600" fill="${bgColor}" />
    ${patternSvg}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const BADGE_CATEGORIES = [
  'Conference & Summit',
  'College & University',
  'Medical & Healthcare',
  'Workshops & Training',
  'Exhibitions & Galas',
] as const;

// 5 Categories × 5 Distinct Templates Each = 25 Templates
export const CATEGORIZED_BADGE_TEMPLATES: Record<string, BadgeTemplateDef[]> = {
  'Conference & Summit': [
    {
      id: 'conf_1_tech_summit',
      name: 'Tech Summit Modern',
      category: 'Conference & Summit',
      description: 'Dynamic gradient header with centered attendee hierarchy and high-density QR verification.',
      badgeWidthIn: 4,
      badgeHeightIn: 6,
      bgConfig: { headerColor: '#1e3a8a', accentColor: '#3b82f6', bgColor: '#ffffff', footerColor: '#0f172a', pattern: 'modern' },
      layout: {
        badgeWidthIn: 4,
        badgeHeightIn: 6,
        showBackground: true,
        eventName: { top: 0.35, left: 0.3, width: 3.4, fontSize: 0.20, color: '#ffffff', textAlign: 'center', visible: true },
        registration: { top: 1.5, left: 0.4, width: 3.2, fontSize: 0.18, color: '#3b82f6', textAlign: 'center', visible: true },
        qr: { top: 1.9, left: 1.35, size: 1.3 },
        name: { top: 3.5, left: 0.2, width: 3.6, fontSize: 0.28, color: '#0f172a', textAlign: 'center', visible: true },
        category: { top: 4.25, left: 0.4, width: 3.2, fontSize: 0.22, color: '#1d4ed8', textAlign: 'center', visible: true },
        organizationName: { top: 4.8, left: 0.4, width: 3.2, fontSize: 0.16, color: '#64748b', textAlign: 'center', visible: true },
      },
    },
    {
      id: 'conf_2_corporate_minimal',
      name: 'Corporate Executive',
      category: 'Conference & Summit',
      description: 'Sophisticated monochrome framing with top branding and bottom QR placement.',
      badgeWidthIn: 4,
      badgeHeightIn: 6,
      bgConfig: { headerColor: '#0f172a', accentColor: '#64748b', bgColor: '#ffffff', footerColor: '#1e293b', pattern: 'minimal' },
      layout: {
        badgeWidthIn: 4,
        badgeHeightIn: 6,
        showBackground: true,
        eventName: { top: 0.25, left: 0.3, width: 3.4, fontSize: 0.18, color: '#ffffff', textAlign: 'center', visible: true },
        organizationName: { top: 0.9, left: 0.4, width: 3.2, fontSize: 0.16, color: '#475569', textAlign: 'center', visible: true },
        name: { top: 1.5, left: 0.2, width: 3.6, fontSize: 0.28, color: '#0f172a', textAlign: 'center', visible: true },
        category: { top: 2.2, left: 0.4, width: 3.2, fontSize: 0.20, color: '#0284c7', textAlign: 'center', visible: true },
        registration: { top: 2.7, left: 0.4, width: 3.2, fontSize: 0.16, color: '#64748b', textAlign: 'center', visible: true },
        qr: { top: 3.4, left: 1.35, size: 1.3 },
      },
    },
    {
      id: 'conf_3_global_forum',
      name: 'Global Forum Waves',
      category: 'Conference & Summit',
      description: 'Flowing wave background with crisp prominent title and category emphasis.',
      badgeWidthIn: 4,
      badgeHeightIn: 6,
      bgConfig: { headerColor: '#0369a1', accentColor: '#38bdf8', bgColor: '#f8fafc', footerColor: '#0c4a6e', pattern: 'waves' },
      layout: {
        badgeWidthIn: 4,
        badgeHeightIn: 6,
        showBackground: true,
        eventName: { top: 0.4, left: 0.3, width: 3.4, fontSize: 0.20, color: '#ffffff', textAlign: 'center', visible: true },
        registration: { top: 1.8, left: 0.4, width: 3.2, fontSize: 0.18, color: '#0369a1', textAlign: 'center', visible: true },
        qr: { top: 2.2, left: 1.35, size: 1.3 },
        name: { top: 3.75, left: 0.2, width: 3.6, fontSize: 0.28, color: '#0f172a', textAlign: 'center', visible: true },
        category: { top: 4.45, left: 0.4, width: 3.2, fontSize: 0.22, color: '#0284c7', textAlign: 'center', visible: true },
      },
    },
    {
      id: 'conf_4_keynote_indigo',
      name: 'Keynote Indigo Geometric',
      category: 'Conference & Summit',
      description: 'Angular geometric badges designed for multi-track symposiums.',
      badgeWidthIn: 4,
      badgeHeightIn: 6,
      bgConfig: { headerColor: '#4338ca', accentColor: '#818cf8', bgColor: '#ffffff', footerColor: '#312e81', pattern: 'geometric' },
      layout: {
        badgeWidthIn: 4,
        badgeHeightIn: 6,
        showBackground: true,
        eventName: { top: 0.35, left: 0.3, width: 3.4, fontSize: 0.20, color: '#ffffff', textAlign: 'center', visible: true },
        name: { top: 1.6, left: 0.2, width: 3.6, fontSize: 0.28, color: '#1e1b4b', textAlign: 'center', visible: true },
        category: { top: 2.25, left: 0.4, width: 3.2, fontSize: 0.20, color: '#4f46e5', textAlign: 'center', visible: true },
        qr: { top: 2.85, left: 1.35, size: 1.3 },
        registration: { top: 4.4, left: 0.4, width: 3.2, fontSize: 0.18, color: '#4338ca', textAlign: 'center', visible: true },
      },
    },
    {
      id: 'conf_5_emerald_conclave',
      name: 'Emerald Conclave Tech',
      category: 'Conference & Summit',
      description: 'Precision tech lines with emerald accents, ideal for energy & sustainability summits.',
      badgeWidthIn: 4,
      badgeHeightIn: 6,
      bgConfig: { headerColor: '#065f46', accentColor: '#10b981', bgColor: '#ffffff', footerColor: '#064e3b', pattern: 'tech' },
      layout: {
        badgeWidthIn: 4,
        badgeHeightIn: 6,
        showBackground: true,
        eventName: { top: 0.3, left: 0.3, width: 3.4, fontSize: 0.18, color: '#ffffff', textAlign: 'center', visible: true },
        registration: { top: 1.4, left: 0.4, width: 3.2, fontSize: 0.18, color: '#059669', textAlign: 'center', visible: true },
        qr: { top: 1.8, left: 1.35, size: 1.3 },
        name: { top: 3.4, left: 0.2, width: 3.6, fontSize: 0.28, color: '#064e3b', textAlign: 'center', visible: true },
        category: { top: 4.1, left: 0.4, width: 3.2, fontSize: 0.20, color: '#047857', textAlign: 'center', visible: true },
        organizationName: { top: 4.7, left: 0.4, width: 3.2, fontSize: 0.16, color: '#64748b', textAlign: 'center', visible: true },
      },
    },
  ],

  'College & University': [
    {
      id: 'college_1_campus_fest',
      name: 'Campus Fest Vibrant',
      category: 'College & University',
      description: 'Energetic vibrant badge for annual college fests and cultural galas.',
      badgeWidthIn: 4,
      badgeHeightIn: 6,
      bgConfig: { headerColor: '#7c3aed', accentColor: '#f43f5e', bgColor: '#ffffff', footerColor: '#4c1d95', pattern: 'waves' },
      layout: {
        badgeWidthIn: 4,
        badgeHeightIn: 6,
        showBackground: true,
        eventName: { top: 0.4, left: 0.25, width: 3.5, fontSize: 0.22, color: '#ffffff', textAlign: 'center', visible: true },
        name: { top: 1.8, left: 0.2, width: 3.6, fontSize: 0.28, color: '#4c1d95', textAlign: 'center', visible: true },
        category: { top: 2.5, left: 0.4, width: 3.2, fontSize: 0.20, color: '#e11d48', textAlign: 'center', visible: true },
        registration: { top: 3.0, left: 0.4, width: 3.2, fontSize: 0.18, color: '#6b21a8', textAlign: 'center', visible: true },
        qr: { top: 3.6, left: 1.35, size: 1.3 },
      },
    },
    {
      id: 'college_2_symposium',
      name: 'Academic Tech Symposium',
      category: 'College & University',
      description: 'Structured layout for departmental symposiums and national paper presentations.',
      badgeWidthIn: 4,
      badgeHeightIn: 6,
      bgConfig: { headerColor: '#1e40af', accentColor: '#60a5fa', bgColor: '#ffffff', footerColor: '#1e3a8a', pattern: 'tech' },
      layout: {
        badgeWidthIn: 4,
        badgeHeightIn: 6,
        showBackground: true,
        eventName: { top: 0.3, left: 0.3, width: 3.4, fontSize: 0.18, color: '#ffffff', textAlign: 'center', visible: true },
        organizationName: { top: 1.2, left: 0.4, width: 3.2, fontSize: 0.16, color: '#1e40af', textAlign: 'center', visible: true },
        name: { top: 1.8, left: 0.2, width: 3.6, fontSize: 0.28, color: '#0f172a', textAlign: 'center', visible: true },
        category: { top: 2.5, left: 0.4, width: 3.2, fontSize: 0.20, color: '#2563eb', textAlign: 'center', visible: true },
        qr: { top: 3.1, left: 1.35, size: 1.3 },
        registration: { top: 4.6, left: 0.4, width: 3.2, fontSize: 0.18, color: '#1d4ed8', textAlign: 'center', visible: true },
      },
    },
    {
      id: 'college_3_hackathon',
      name: 'Hackathon 24/48hr',
      category: 'College & University',
      description: 'High-contrast neon tech layout for hacker badges and judging access.',
      badgeWidthIn: 4,
      badgeHeightIn: 6,
      bgConfig: { headerColor: '#090d16', accentColor: '#22c55e', bgColor: '#ffffff', footerColor: '#090d16', pattern: 'tech' },
      layout: {
        badgeWidthIn: 4,
        badgeHeightIn: 6,
        showBackground: true,
        eventName: { top: 0.3, left: 0.3, width: 3.4, fontSize: 0.20, color: '#22c55e', textAlign: 'center', visible: true },
        name: { top: 1.5, left: 0.2, width: 3.6, fontSize: 0.30, color: '#090d16', textAlign: 'center', visible: true },
        category: { top: 2.2, left: 0.4, width: 3.2, fontSize: 0.22, color: '#16a34a', textAlign: 'center', visible: true },
        registration: { top: 2.7, left: 0.4, width: 3.2, fontSize: 0.18, color: '#4b5563', textAlign: 'center', visible: true },
        qr: { top: 3.3, left: 1.35, size: 1.3 },
      },
    },
    {
      id: 'college_4_convocation',
      name: 'Convocation & Alumni',
      category: 'College & University',
      description: 'Formal ceremonial layout with gold accents for graduation ceremonies.',
      badgeWidthIn: 4,
      badgeHeightIn: 6,
      bgConfig: { headerColor: '#78350f', accentColor: '#f59e0b', bgColor: '#fffbeb', footerColor: '#451a03', pattern: 'geometric' },
      layout: {
        badgeWidthIn: 4,
        badgeHeightIn: 6,
        showBackground: true,
        eventName: { top: 0.4, left: 0.3, width: 3.4, fontSize: 0.18, color: '#ffffff', textAlign: 'center', visible: true },
        organizationName: { top: 1.3, left: 0.4, width: 3.2, fontSize: 0.16, color: '#78350f', textAlign: 'center', visible: true },
        name: { top: 1.9, left: 0.2, width: 3.6, fontSize: 0.28, color: '#451a03', textAlign: 'center', visible: true },
        category: { top: 2.6, left: 0.4, width: 3.2, fontSize: 0.20, color: '#b45309', textAlign: 'center', visible: true },
        qr: { top: 3.2, left: 1.35, size: 1.3 },
        registration: { top: 4.7, left: 0.4, width: 3.2, fontSize: 0.16, color: '#78350f', textAlign: 'center', visible: true },
      },
    },
    {
      id: 'college_5_sports_meet',
      name: 'Inter-College Sports Meet',
      category: 'College & University',
      description: 'Bold sports athletics design with high visibility participant numbers.',
      badgeWidthIn: 4,
      badgeHeightIn: 6,
      bgConfig: { headerColor: '#dc2626', accentColor: '#ea580c', bgColor: '#ffffff', footerColor: '#991b1b', pattern: 'geometric' },
      layout: {
        badgeWidthIn: 4,
        badgeHeightIn: 6,
        showBackground: true,
        eventName: { top: 0.35, left: 0.3, width: 3.4, fontSize: 0.20, color: '#ffffff', textAlign: 'center', visible: true },
        registration: { top: 1.4, left: 0.4, width: 3.2, fontSize: 0.24, color: '#dc2626', textAlign: 'center', visible: true },
        name: { top: 2.0, left: 0.2, width: 3.6, fontSize: 0.30, color: '#0f172a', textAlign: 'center', visible: true },
        category: { top: 2.8, left: 0.4, width: 3.2, fontSize: 0.22, color: '#ea580c', textAlign: 'center', visible: true },
        qr: { top: 3.4, left: 1.35, size: 1.3 },
      },
    },
  ],

  'Medical & Healthcare': [
    {
      id: 'med_1_clinical_summit',
      name: 'Clinical Conclave (PMCON)',
      category: 'Medical & Healthcare',
      description: 'Standard medical congress badge featuring council number and verification QR.',
      badgeWidthIn: 4,
      badgeHeightIn: 6,
      bgConfig: { headerColor: '#0f766e', accentColor: '#14b8a6', bgColor: '#ffffff', footerColor: '#115e59', pattern: 'minimal' },
      layout: {
        badgeWidthIn: 4,
        badgeHeightIn: 6,
        showBackground: true,
        eventName: { top: 0.25, left: 0.3, width: 3.4, fontSize: 0.18, color: '#ffffff', textAlign: 'center', visible: true },
        registration: { top: 1.2, left: 0.4, width: 3.2, fontSize: 0.20, color: '#0f766e', textAlign: 'center', visible: true },
        qr: { top: 1.6, left: 1.35, size: 1.3 },
        name: { top: 3.2, left: 0.2, width: 3.6, fontSize: 0.28, color: '#0f172a', textAlign: 'center', visible: true },
        category: { top: 3.9, left: 0.4, width: 3.2, fontSize: 0.22, color: '#0d9488', textAlign: 'center', visible: true },
        medicalCouncilNumber: { top: 4.6, left: 0.4, width: 3.2, fontSize: 0.17, color: '#475569', textAlign: 'center', visible: true },
      },
    },
    {
      id: 'med_2_hospital_symposium',
      name: 'Hospital Doctors Conclave',
      category: 'Medical & Healthcare',
      description: 'Refined healthcare blues with hospital logo clearance and delegate title.',
      badgeWidthIn: 4,
      badgeHeightIn: 6,
      bgConfig: { headerColor: '#0284c7', accentColor: '#38bdf8', bgColor: '#ffffff', footerColor: '#0369a1', pattern: 'modern' },
      layout: {
        badgeWidthIn: 4,
        badgeHeightIn: 6,
        showBackground: true,
        eventName: { top: 0.35, left: 0.3, width: 3.4, fontSize: 0.20, color: '#ffffff', textAlign: 'center', visible: true },
        name: { top: 1.7, left: 0.2, width: 3.6, fontSize: 0.28, color: '#0f172a', textAlign: 'center', visible: true },
        category: { top: 2.4, left: 0.4, width: 3.2, fontSize: 0.20, color: '#0284c7', textAlign: 'center', visible: true },
        medicalCouncilNumber: { top: 3.0, left: 0.4, width: 3.2, fontSize: 0.16, color: '#64748b', textAlign: 'center', visible: true },
        qr: { top: 3.6, left: 1.35, size: 1.3 },
        registration: { top: 5.1, left: 0.4, width: 3.2, fontSize: 0.16, color: '#0284c7', textAlign: 'center', visible: true },
      },
    },
    {
      id: 'med_3_medtech_expo',
      name: 'MedTech Innovation Expo',
      category: 'Medical & Healthcare',
      description: 'Sleek bio-tech aesthetic for medical equipment expos and biotech leaders.',
      badgeWidthIn: 4,
      badgeHeightIn: 6,
      bgConfig: { headerColor: '#059669', accentColor: '#34d399', bgColor: '#ffffff', footerColor: '#047857', pattern: 'waves' },
      layout: {
        badgeWidthIn: 4,
        badgeHeightIn: 6,
        showBackground: true,
        eventName: { top: 0.4, left: 0.3, width: 3.4, fontSize: 0.18, color: '#ffffff', textAlign: 'center', visible: true },
        registration: { top: 1.7, left: 0.4, width: 3.2, fontSize: 0.18, color: '#059669', textAlign: 'center', visible: true },
        qr: { top: 2.1, left: 1.35, size: 1.3 },
        name: { top: 3.6, left: 0.2, width: 3.6, fontSize: 0.28, color: '#064e3b', textAlign: 'center', visible: true },
        category: { top: 4.3, left: 0.4, width: 3.2, fontSize: 0.20, color: '#047857', textAlign: 'center', visible: true },
        organizationName: { top: 4.85, left: 0.4, width: 3.2, fontSize: 0.16, color: '#64748b', textAlign: 'center', visible: true },
      },
    },
    {
      id: 'med_4_cme_workshop',
      name: 'CME Medical Workshop',
      category: 'Medical & Healthcare',
      description: 'Credit-hours accredited badge layout with clear clinician accreditation tags.',
      badgeWidthIn: 4,
      badgeHeightIn: 6,
      bgConfig: { headerColor: '#4f46e5', accentColor: '#818cf8', bgColor: '#ffffff', footerColor: '#3730a3', pattern: 'geometric' },
      layout: {
        badgeWidthIn: 4,
        badgeHeightIn: 6,
        showBackground: true,
        eventName: { top: 0.35, left: 0.3, width: 3.4, fontSize: 0.18, color: '#ffffff', textAlign: 'center', visible: true },
        name: { top: 1.6, left: 0.2, width: 3.6, fontSize: 0.28, color: '#1e1b4b', textAlign: 'center', visible: true },
        category: { top: 2.3, left: 0.4, width: 3.2, fontSize: 0.20, color: '#4f46e5', textAlign: 'center', visible: true },
        medicalCouncilNumber: { top: 2.9, left: 0.4, width: 3.2, fontSize: 0.16, color: '#475569', textAlign: 'center', visible: true },
        qr: { top: 3.4, left: 1.35, size: 1.3 },
        registration: { top: 4.9, left: 0.4, width: 3.2, fontSize: 0.16, color: '#4338ca', textAlign: 'center', visible: true },
      },
    },
    {
      id: 'med_5_pharma_research',
      name: 'Pharmaceutical Research',
      category: 'Medical & Healthcare',
      description: 'Precision laboratory & clinical trial badge with participant security validation.',
      badgeWidthIn: 4,
      badgeHeightIn: 6,
      bgConfig: { headerColor: '#0e7490', accentColor: '#22d3ee', bgColor: '#ecfeff', footerColor: '#155e75', pattern: 'tech' },
      layout: {
        badgeWidthIn: 4,
        badgeHeightIn: 6,
        showBackground: true,
        eventName: { top: 0.3, left: 0.3, width: 3.4, fontSize: 0.18, color: '#ffffff', textAlign: 'center', visible: true },
        registration: { top: 1.3, left: 0.4, width: 3.2, fontSize: 0.18, color: '#0e7490', textAlign: 'center', visible: true },
        qr: { top: 1.7, left: 1.35, size: 1.3 },
        name: { top: 3.3, left: 0.2, width: 3.6, fontSize: 0.28, color: '#155e75', textAlign: 'center', visible: true },
        category: { top: 4.0, left: 0.4, width: 3.2, fontSize: 0.20, color: '#0891b2', textAlign: 'center', visible: true },
        organizationName: { top: 4.6, left: 0.4, width: 3.2, fontSize: 0.16, color: '#475569', textAlign: 'center', visible: true },
      },
    },
  ],

  'Workshops & Training': [
    {
      id: 'ws_1_developer_lab',
      name: 'Developer Bootcamp Lab',
      category: 'Workshops & Training',
      description: 'Dark terminal-inspired banner with monospace registration numbers.',
      badgeWidthIn: 4,
      badgeHeightIn: 6,
      bgConfig: { headerColor: '#18181b', accentColor: '#a1a1aa', bgColor: '#ffffff', footerColor: '#27272a', pattern: 'tech' },
      layout: {
        badgeWidthIn: 4,
        badgeHeightIn: 6,
        showBackground: true,
        eventName: { top: 0.3, left: 0.3, width: 3.4, fontSize: 0.18, color: '#f4f4f5', textAlign: 'center', visible: true },
        name: { top: 1.6, left: 0.2, width: 3.6, fontSize: 0.28, color: '#18181b', textAlign: 'center', visible: true },
        category: { top: 2.3, left: 0.4, width: 3.2, fontSize: 0.20, color: '#52525b', textAlign: 'center', visible: true },
        qr: { top: 2.9, left: 1.35, size: 1.3 },
        registration: { top: 4.4, left: 0.4, width: 3.2, fontSize: 0.18, color: '#27272a', textAlign: 'center', visible: true },
      },
    },
    {
      id: 'ws_2_design_sprint',
      name: 'UI/UX Design Sprint',
      category: 'Workshops & Training',
      description: 'Creative design workshop pass with bold playful layout and bright accents.',
      badgeWidthIn: 4,
      badgeHeightIn: 6,
      bgConfig: { headerColor: '#ea580c', accentColor: '#f97316', bgColor: '#fff7ed', footerColor: '#c2410c', pattern: 'waves' },
      layout: {
        badgeWidthIn: 4,
        badgeHeightIn: 6,
        showBackground: true,
        eventName: { top: 0.4, left: 0.3, width: 3.4, fontSize: 0.18, color: '#ffffff', textAlign: 'center', visible: true },
        registration: { top: 1.6, left: 0.4, width: 3.2, fontSize: 0.18, color: '#ea580c', textAlign: 'center', visible: true },
        qr: { top: 2.0, left: 1.35, size: 1.3 },
        name: { top: 3.5, left: 0.2, width: 3.6, fontSize: 0.28, color: '#7c2d12', textAlign: 'center', visible: true },
        category: { top: 4.2, left: 0.4, width: 3.2, fontSize: 0.20, color: '#c2410c', textAlign: 'center', visible: true },
      },
    },
    {
      id: 'ws_3_ai_masterclass',
      name: 'AI & Data Masterclass',
      category: 'Workshops & Training',
      description: 'Futuristic purple mesh design tailored for frontier machine learning summits.',
      badgeWidthIn: 4,
      badgeHeightIn: 6,
      bgConfig: { headerColor: '#6b21a8', accentColor: '#c084fc', bgColor: '#faf5ff', footerColor: '#581c87', pattern: 'geometric' },
      layout: {
        badgeWidthIn: 4,
        badgeHeightIn: 6,
        showBackground: true,
        eventName: { top: 0.35, left: 0.3, width: 3.4, fontSize: 0.20, color: '#ffffff', textAlign: 'center', visible: true },
        name: { top: 1.6, left: 0.2, width: 3.6, fontSize: 0.28, color: '#3b0764', textAlign: 'center', visible: true },
        category: { top: 2.3, left: 0.4, width: 3.2, fontSize: 0.20, color: '#7e22ce', textAlign: 'center', visible: true },
        qr: { top: 2.9, left: 1.35, size: 1.3 },
        registration: { top: 4.4, left: 0.4, width: 3.2, fontSize: 0.18, color: '#6b21a8', textAlign: 'center', visible: true },
      },
    },
    {
      id: 'ws_4_compact_thermal',
      name: 'Thermal Spot Sticker (3" × 2")',
      category: 'Workshops & Training',
      description: 'Compact 3x2 inch format for immediate label printing at check-in desks.',
      badgeWidthIn: 3,
      badgeHeightIn: 2,
      bgConfig: { headerColor: '#2563eb', accentColor: '#60a5fa', bgColor: '#ffffff', footerColor: '#1e40af', pattern: 'minimal' },
      layout: {
        badgeWidthIn: 3,
        badgeHeightIn: 2,
        showBackground: false,
        name: { top: 0.25, left: 0.2, width: 1.7, fontSize: 0.20, color: '#0f172a', textAlign: 'left', visible: true },
        category: { top: 0.8, left: 0.2, width: 1.7, fontSize: 0.15, color: '#2563eb', textAlign: 'left', visible: true },
        registration: { top: 1.3, left: 0.2, width: 1.7, fontSize: 0.14, color: '#64748b', textAlign: 'left', visible: true },
        qr: { top: 0.25, left: 1.85, size: 0.95 },
      },
    },
    {
      id: 'ws_5_hands_on_lab',
      name: 'Hands-On Certification',
      category: 'Workshops & Training',
      description: 'Accreditation layout with verified pass holder barcode/QR signature.',
      badgeWidthIn: 4,
      badgeHeightIn: 6,
      bgConfig: { headerColor: '#047857', accentColor: '#10b981', bgColor: '#ffffff', footerColor: '#064e3b', pattern: 'modern' },
      layout: {
        badgeWidthIn: 4,
        badgeHeightIn: 6,
        showBackground: true,
        eventName: { top: 0.35, left: 0.3, width: 3.4, fontSize: 0.18, color: '#ffffff', textAlign: 'center', visible: true },
        name: { top: 1.6, left: 0.2, width: 3.6, fontSize: 0.28, color: '#064e3b', textAlign: 'center', visible: true },
        category: { top: 2.3, left: 0.4, width: 3.2, fontSize: 0.20, color: '#059669', textAlign: 'center', visible: true },
        qr: { top: 2.9, left: 1.35, size: 1.3 },
        registration: { top: 4.4, left: 0.4, width: 3.2, fontSize: 0.18, color: '#047857', textAlign: 'center', visible: true },
      },
    },
  ],

  'Exhibitions & Galas': [
    {
      id: 'expo_1_vip_access',
      name: 'VIP All-Access Pass',
      category: 'Exhibitions & Galas',
      description: 'Gold-embossed luxury styling for VIP delegations, speakers, and sponsors.',
      badgeWidthIn: 4,
      badgeHeightIn: 6,
      bgConfig: { headerColor: '#18181b', accentColor: '#eab308', bgColor: '#09090b', footerColor: '#27272a', pattern: 'geometric' },
      layout: {
        badgeWidthIn: 4,
        badgeHeightIn: 6,
        showBackground: true,
        eventName: { top: 0.35, left: 0.3, width: 3.4, fontSize: 0.20, color: '#eab308', textAlign: 'center', visible: true },
        name: { top: 1.6, left: 0.2, width: 3.6, fontSize: 0.28, color: '#ffffff', textAlign: 'center', visible: true },
        category: { top: 2.3, left: 0.4, width: 3.2, fontSize: 0.24, color: '#facc15', textAlign: 'center', visible: true },
        registration: { top: 2.8, left: 0.4, width: 3.2, fontSize: 0.16, color: '#a1a1aa', textAlign: 'center', visible: true },
        qr: { top: 3.4, left: 1.35, size: 1.3 },
      },
    },
    {
      id: 'expo_2_exhibitor_staff',
      name: 'Exhibitor & Booth Staff',
      category: 'Exhibitions & Galas',
      description: 'Bold high-visibility badge for trade show floor booth managers and sales staff.',
      badgeWidthIn: 4,
      badgeHeightIn: 6,
      bgConfig: { headerColor: '#be123c', accentColor: '#fb7185', bgColor: '#ffffff', footerColor: '#881337', pattern: 'modern' },
      layout: {
        badgeWidthIn: 4,
        badgeHeightIn: 6,
        showBackground: true,
        eventName: { top: 0.35, left: 0.3, width: 3.4, fontSize: 0.18, color: '#ffffff', textAlign: 'center', visible: true },
        organizationName: { top: 1.4, left: 0.3, width: 3.4, fontSize: 0.22, color: '#be123c', textAlign: 'center', visible: true },
        name: { top: 2.1, left: 0.2, width: 3.6, fontSize: 0.28, color: '#0f172a', textAlign: 'center', visible: true },
        category: { top: 2.8, left: 0.4, width: 3.2, fontSize: 0.22, color: '#e11d48', textAlign: 'center', visible: true },
        registration: { top: 4.8, left: 0.4, width: 3.2, fontSize: 0.16, color: '#be123c', textAlign: 'center', visible: true },
        qr: { top: 3.4, left: 1.35, size: 1.3 },
      },
    },
    {
      id: 'expo_3_visitor_pass',
      name: 'Trade Show Visitor Pass',
      category: 'Exhibitions & Galas',
      description: 'Fast turnstile access badge for multi-day convention attendees.',
      badgeWidthIn: 4,
      badgeHeightIn: 6,
      bgConfig: { headerColor: '#0284c7', accentColor: '#38bdf8', bgColor: '#ffffff', footerColor: '#0369a1', pattern: 'waves' },
      layout: {
        badgeWidthIn: 4,
        badgeHeightIn: 6,
        showBackground: true,
        eventName: { top: 0.4, left: 0.3, width: 3.4, fontSize: 0.18, color: '#ffffff', textAlign: 'center', visible: true },
        registration: { top: 1.6, left: 0.4, width: 3.2, fontSize: 0.18, color: '#0284c7', textAlign: 'center', visible: true },
        qr: { top: 2.0, left: 1.35, size: 1.3 },
        name: { top: 3.5, left: 0.2, width: 3.6, fontSize: 0.28, color: '#0f172a', textAlign: 'center', visible: true },
        category: { top: 4.2, left: 0.4, width: 3.2, fontSize: 0.20, color: '#0369a1', textAlign: 'center', visible: true },
      },
    },
    {
      id: 'expo_4_media_press',
      name: 'Media & Press Pass',
      category: 'Exhibitions & Galas',
      description: 'Authorized press badge with prominent media credentialing banner.',
      badgeWidthIn: 4,
      badgeHeightIn: 6,
      bgConfig: { headerColor: '#b91c1c', accentColor: '#ef4444', bgColor: '#ffffff', footerColor: '#7f1d1d', pattern: 'minimal' },
      layout: {
        badgeWidthIn: 4,
        badgeHeightIn: 6,
        showBackground: true,
        eventName: { top: 0.25, left: 0.3, width: 3.4, fontSize: 0.18, color: '#ffffff', textAlign: 'center', visible: true },
        category: { top: 1.1, left: 0.4, width: 3.2, fontSize: 0.24, color: '#dc2626', textAlign: 'center', visible: true },
        name: { top: 1.8, left: 0.2, width: 3.6, fontSize: 0.28, color: '#0f172a', textAlign: 'center', visible: true },
        organizationName: { top: 2.5, left: 0.4, width: 3.2, fontSize: 0.18, color: '#475569', textAlign: 'center', visible: true },
        qr: { top: 3.1, left: 1.35, size: 1.3 },
        registration: { top: 4.6, left: 0.4, width: 3.2, fontSize: 0.16, color: '#dc2626', textAlign: 'center', visible: true },
      },
    },
    {
      id: 'expo_5_gala_platinum',
      name: 'Gala Dinner Platinum Pass',
      category: 'Exhibitions & Galas',
      description: 'Sophisticated silver & platinum layout for evening awards and celebration galas.',
      badgeWidthIn: 4,
      badgeHeightIn: 6,
      bgConfig: { headerColor: '#334155', accentColor: '#94a3b8', bgColor: '#f8fafc', footerColor: '#1e293b', pattern: 'modern' },
      layout: {
        badgeWidthIn: 4,
        badgeHeightIn: 6,
        showBackground: true,
        eventName: { top: 0.35, left: 0.3, width: 3.4, fontSize: 0.20, color: '#ffffff', textAlign: 'center', visible: true },
        name: { top: 1.6, left: 0.2, width: 3.6, fontSize: 0.28, color: '#0f172a', textAlign: 'center', visible: true },
        category: { top: 2.3, left: 0.4, width: 3.2, fontSize: 0.20, color: '#475569', textAlign: 'center', visible: true },
        qr: { top: 2.9, left: 1.35, size: 1.3 },
        registration: { top: 4.4, left: 0.4, width: 3.2, fontSize: 0.18, color: '#334155', textAlign: 'center', visible: true },
      },
    },
  ],
};

// Flattened list of all 25 templates for backward compatibility
export const BUILT_IN_BADGE_TEMPLATES: BadgeTemplateDef[] = Object.values(CATEGORIZED_BADGE_TEMPLATES).flat();
