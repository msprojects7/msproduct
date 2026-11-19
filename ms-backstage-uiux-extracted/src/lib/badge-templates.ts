import { BadgeTemplate } from '../types';

export const initialBadgeTemplates: BadgeTemplate[] = [
  {
    id: 'tpl-corporate-minimal',
    name: 'Corporate Minimal',
    description: 'Clean high-contrast layout with top event header, bold attendee name, and centered QR.',
    widthInches: 4,
    heightInches: 6,
    orientation: 'portrait',
    headerColor: '#0f172a',
    accentColor: '#3b82f6',
    backgroundColor: '#ffffff',
    borderStyle: 'solid',
    elements: [
      { id: 'el-logo', type: 'logo', label: 'Company / Event Logo', x: 10, y: 5, width: 80, height: 10, textAlign: 'center', visible: true, zIndex: 1 },
      { id: 'el-event', type: 'eventName', label: 'Event Name', x: 8, y: 16, width: 84, height: 7, fontSize: 13, fontWeight: 'semibold', textAlign: 'center', color: '#64748b', textCase: 'uppercase', visible: true, zIndex: 2 },
      { id: 'el-divider-1', type: 'divider', label: 'Top Line', x: 15, y: 24, width: 70, height: 1, backgroundColor: '#e2e8f0', visible: true, zIndex: 3 },
      { id: 'el-name', type: 'name', label: 'Attendee Full Name', x: 6, y: 30, width: 88, height: 14, fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#0f172a', visible: true, zIndex: 4 },
      { id: 'el-designation', type: 'designation', label: 'Designation', x: 8, y: 44, width: 84, height: 6, fontSize: 13, fontWeight: 'semibold', textAlign: 'center', color: '#334155', visible: true, zIndex: 5 },
      { id: 'el-company', type: 'company', label: 'Company / Institute', x: 8, y: 50, width: 84, height: 6, fontSize: 12, fontWeight: 'normal', textAlign: 'center', color: '#64748b', visible: true, zIndex: 6 },
      { id: 'el-qr', type: 'qrCode', label: 'QR Code', x: 26, y: 58, width: 48, height: 24, visible: true, zIndex: 7 },
      { id: 'el-reg', type: 'regNumber', label: 'Registration ID', x: 10, y: 83, width: 80, height: 5, fontSize: 11, fontFamily: 'font-mono', fontWeight: 'bold', textAlign: 'center', color: '#475569', visible: true, zIndex: 8 },
      { id: 'el-category', type: 'category', label: 'Category Ribbon', x: 0, y: 90, width: 100, height: 10, fontSize: 15, fontWeight: 'bold', textAlign: 'center', color: '#ffffff', backgroundColor: '#2563eb', textCase: 'uppercase', visible: true, zIndex: 9 }
    ]
  },
  {
    id: 'tpl-executive-conference',
    name: 'Executive Conference',
    description: 'Sophisticated header block with prominent photo, balanced typography, and side QR block.',
    widthInches: 4,
    heightInches: 6,
    orientation: 'portrait',
    headerColor: '#1e1b4b',
    accentColor: '#6366f1',
    backgroundColor: '#f8fafc',
    borderStyle: 'solid',
    elements: [
      { id: 'el-event-box', type: 'eventName', label: 'Event Banner', x: 0, y: 0, width: 100, height: 15, fontSize: 14, fontWeight: 'bold', textAlign: 'center', color: '#ffffff', backgroundColor: '#1e1b4b', textCase: 'uppercase', visible: true, zIndex: 1 },
      { id: 'el-photo', type: 'photo', label: 'Attendee Photo', x: 33, y: 18, width: 34, height: 22, borderRadius: 8, visible: true, zIndex: 2 },
      { id: 'el-name', type: 'name', label: 'Full Name', x: 5, y: 43, width: 90, height: 12, fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: '#0f172a', visible: true, zIndex: 3 },
      { id: 'el-designation', type: 'designation', label: 'Designation', x: 8, y: 55, width: 84, height: 6, fontSize: 13, fontWeight: 'semibold', textAlign: 'center', color: '#4338ca', visible: true, zIndex: 4 },
      { id: 'el-company', type: 'company', label: 'Organization', x: 8, y: 61, width: 84, height: 6, fontSize: 12, textAlign: 'center', color: '#64748b', visible: true, zIndex: 5 },
      { id: 'el-qr', type: 'qrCode', label: 'Access QR', x: 34, y: 69, width: 32, height: 19, visible: true, zIndex: 6 },
      { id: 'el-reg', type: 'regNumber', label: 'Reg Code', x: 10, y: 88, width: 80, height: 4, fontSize: 11, fontFamily: 'font-mono', textAlign: 'center', color: '#64748b', visible: true, zIndex: 7 },
      { id: 'el-category', type: 'category', label: 'Access Level', x: 5, y: 93, width: 90, height: 6, fontSize: 12, fontWeight: 'bold', textAlign: 'center', color: '#ffffff', backgroundColor: '#4f46e5', borderRadius: 4, textCase: 'uppercase', visible: true, zIndex: 8 }
    ]
  },
  {
    id: 'tpl-medical-conference',
    name: 'Medical Conference',
    description: 'Designed for healthcare symposiums with Medical Council Reg Number, specialty, and hospital affiliation.',
    widthInches: 4,
    heightInches: 6,
    orientation: 'portrait',
    headerColor: '#0c4a6e',
    accentColor: '#0284c7',
    backgroundColor: '#ffffff',
    borderStyle: 'solid',
    elements: [
      { id: 'el-header', type: 'eventName', label: 'Council / Society Name', x: 0, y: 0, width: 100, height: 14, fontSize: 12, fontWeight: 'bold', textAlign: 'center', color: '#ffffff', backgroundColor: '#075985', textCase: 'uppercase', visible: true, zIndex: 1 },
      { id: 'el-category-pill', type: 'category', label: 'Delegate Specialty', x: 20, y: 17, width: 60, height: 6, fontSize: 12, fontWeight: 'bold', textAlign: 'center', color: '#0369a1', backgroundColor: '#e0f2fe', borderRadius: 4, textCase: 'uppercase', visible: true, zIndex: 2 },
      { id: 'el-name', type: 'name', label: 'Doctor / Surgeon Name', x: 5, y: 25, width: 90, height: 13, fontSize: 23, fontWeight: 'bold', textAlign: 'center', color: '#0c4a6e', visible: true, zIndex: 3 },
      { id: 'el-custom-council', type: 'customText', label: 'Medical Council Reg #', customText: 'MCI / State Reg: MCI-84920-A', x: 8, y: 39, width: 84, height: 5, fontSize: 11, fontFamily: 'font-mono', fontWeight: 'semibold', textAlign: 'center', color: '#0284c7', visible: true, zIndex: 4 },
      { id: 'el-company', type: 'company', label: 'Hospital / Institute', x: 8, y: 45, width: 84, height: 7, fontSize: 13, fontWeight: 'normal', textAlign: 'center', color: '#334155', visible: true, zIndex: 5 },
      { id: 'el-designation', type: 'designation', label: 'Department', x: 8, y: 52, width: 84, height: 5, fontSize: 11, textAlign: 'center', color: '#64748b', visible: true, zIndex: 6 },
      { id: 'el-qr', type: 'qrCode', label: 'Verification QR', x: 30, y: 59, width: 40, height: 23, visible: true, zIndex: 7 },
      { id: 'el-reg', type: 'regNumber', label: 'Badge ID', x: 10, y: 84, width: 80, height: 5, fontSize: 11, fontFamily: 'font-mono', textAlign: 'center', color: '#475569', visible: true, zIndex: 8 },
      { id: 'el-footer-note', type: 'customText', label: 'CME Credits', customText: '4 CME Accreditation Credits Approved', x: 0, y: 92, width: 100, height: 8, fontSize: 10, fontWeight: 'bold', textAlign: 'center', color: '#ffffff', backgroundColor: '#0369a1', visible: true, zIndex: 9 }
    ]
  },
  {
    id: 'tpl-academic-summit',
    name: 'Academic Summit',
    description: 'Prestigious serif-accented card ideal for universities, research symposiums, and faculty assemblies.',
    widthInches: 4,
    heightInches: 3,
    orientation: 'landscape',
    headerColor: '#312e81',
    accentColor: '#4338ca',
    backgroundColor: '#fafaf9',
    borderStyle: 'solid',
    elements: [
      { id: 'el-event', type: 'eventName', label: 'Symposium Title', x: 5, y: 6, width: 60, height: 12, fontSize: 12, fontWeight: 'bold', textAlign: 'left', color: '#312e81', textCase: 'uppercase', visible: true, zIndex: 1 },
      { id: 'el-reg', type: 'regNumber', label: 'Delegate Code', x: 68, y: 6, width: 27, height: 8, fontSize: 10, fontFamily: 'font-mono', textAlign: 'right', color: '#64748b', visible: true, zIndex: 2 },
      { id: 'el-name', type: 'name', label: 'Scholar Name', x: 5, y: 22, width: 62, height: 24, fontSize: 20, fontWeight: 'bold', textAlign: 'left', color: '#1c1917', visible: true, zIndex: 3 },
      { id: 'el-designation', type: 'designation', label: 'Faculty Title', x: 5, y: 48, width: 62, height: 12, fontSize: 12, textAlign: 'left', color: '#44403c', visible: true, zIndex: 4 },
      { id: 'el-company', type: 'company', label: 'University / Department', x: 5, y: 61, width: 62, height: 12, fontSize: 11, textAlign: 'left', color: '#78716c', visible: true, zIndex: 5 },
      { id: 'el-category', type: 'category', label: 'Role Ribbon', x: 0, y: 82, width: 65, height: 18, fontSize: 13, fontWeight: 'bold', textAlign: 'center', color: '#ffffff', backgroundColor: '#4338ca', textCase: 'uppercase', visible: true, zIndex: 6 },
      { id: 'el-qr', type: 'qrCode', label: 'Attendance QR', x: 70, y: 22, width: 25, height: 60, visible: true, zIndex: 7 }
    ]
  },
  {
    id: 'tpl-speaker-vip',
    name: 'Speaker / VIP',
    description: 'High-impact gold & midnight black aesthetic commanding immediate security recognition at executive stages.',
    widthInches: 4,
    heightInches: 6,
    orientation: 'portrait',
    headerColor: '#000000',
    accentColor: '#d97706',
    backgroundColor: '#09090b',
    borderStyle: 'solid',
    elements: [
      { id: 'el-event', type: 'eventName', label: 'Global Stage Event', x: 5, y: 4, width: 90, height: 8, fontSize: 12, fontWeight: 'bold', textAlign: 'center', color: '#a1a1aa', textCase: 'uppercase', visible: true, zIndex: 1 },
      { id: 'el-vip-badge', type: 'category', label: 'VIP / SPEAKER HEADER', x: 0, y: 13, width: 100, height: 14, fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#000000', backgroundColor: '#f59e0b', textCase: 'uppercase', visible: true, zIndex: 2 },
      { id: 'el-name', type: 'name', label: 'Speaker Full Name', x: 5, y: 32, width: 90, height: 16, fontSize: 26, fontWeight: 'bold', textAlign: 'center', color: '#ffffff', visible: true, zIndex: 3 },
      { id: 'el-designation', type: 'designation', label: 'Title / Subject', x: 6, y: 49, width: 88, height: 8, fontSize: 14, fontWeight: 'semibold', textAlign: 'center', color: '#f59e0b', visible: true, zIndex: 4 },
      { id: 'el-company', type: 'company', label: 'Organization', x: 6, y: 57, width: 88, height: 6, fontSize: 12, textAlign: 'center', color: '#a1a1aa', visible: true, zIndex: 5 },
      { id: 'el-qr', type: 'qrCode', label: 'Stage Access QR', x: 30, y: 65, width: 40, height: 21, visible: true, zIndex: 6 },
      { id: 'el-reg', type: 'regNumber', label: 'Key ID', x: 10, y: 88, width: 80, height: 4, fontSize: 11, fontFamily: 'font-mono', textAlign: 'center', color: '#71717a', visible: true, zIndex: 7 },
      { id: 'el-zone', type: 'customText', label: 'All Access Zone', customText: 'ALL-ACCESS GREEN ROOM · KEYNOTE PODIUM', x: 0, y: 93, width: 100, height: 7, fontSize: 10, fontWeight: 'bold', textAlign: 'center', color: '#fcd34d', backgroundColor: '#18181b', textCase: 'uppercase', visible: true, zIndex: 8 }
    ]
  },
  {
    id: 'tpl-delegate-standard',
    name: 'Delegate Standard',
    description: 'High-throughput rapid-print layout designed for conferences with thousands of general delegates.',
    widthInches: 4,
    heightInches: 6,
    orientation: 'portrait',
    headerColor: '#1e293b',
    accentColor: '#2563eb',
    backgroundColor: '#ffffff',
    borderStyle: 'solid',
    elements: [
      { id: 'el-event', type: 'eventName', label: 'Event Name', x: 8, y: 5, width: 84, height: 10, fontSize: 14, fontWeight: 'bold', textAlign: 'center', color: '#1e293b', textCase: 'uppercase', visible: true, zIndex: 1 },
      { id: 'el-divider', type: 'divider', label: 'Hairline', x: 10, y: 16, width: 80, height: 1, backgroundColor: '#cbd5e1', visible: true, zIndex: 2 },
      { id: 'el-name', type: 'name', label: 'Delegate Name', x: 4, y: 22, width: 92, height: 16, fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#0f172a', visible: true, zIndex: 3 },
      { id: 'el-company', type: 'company', label: 'Affiliation', x: 8, y: 40, width: 84, height: 8, fontSize: 14, textAlign: 'center', color: '#334155', visible: true, zIndex: 4 },
      { id: 'el-qr', type: 'qrCode', label: 'Check-in QR', x: 25, y: 50, width: 50, height: 26, visible: true, zIndex: 5 },
      { id: 'el-reg', type: 'regNumber', label: 'Registration #', x: 10, y: 78, width: 80, height: 5, fontSize: 12, fontFamily: 'font-mono', fontWeight: 'bold', textAlign: 'center', color: '#1e293b', visible: true, zIndex: 6 },
      { id: 'el-category', type: 'category', label: 'Delegate Ribbon', x: 0, y: 86, width: 100, height: 14, fontSize: 16, fontWeight: 'bold', textAlign: 'center', color: '#ffffff', backgroundColor: '#1d4ed8', textCase: 'uppercase', visible: true, zIndex: 7 }
    ]
  },
  {
    id: 'tpl-student-faculty',
    name: 'Student / Faculty',
    description: 'Split vertical format with institution crest area and distinctive student matriculation ID.',
    widthInches: 3,
    heightInches: 2,
    orientation: 'landscape',
    headerColor: '#15803d',
    accentColor: '#16a34a',
    backgroundColor: '#ffffff',
    borderStyle: 'solid',
    elements: [
      { id: 'el-event', type: 'eventName', label: 'University Colloquium', x: 5, y: 6, width: 62, height: 12, fontSize: 11, fontWeight: 'bold', textAlign: 'left', color: '#15803d', visible: true, zIndex: 1 },
      { id: 'el-name', type: 'name', label: 'Student / Faculty Name', x: 5, y: 20, width: 62, height: 26, fontSize: 18, fontWeight: 'bold', textAlign: 'left', color: '#14532d', visible: true, zIndex: 2 },
      { id: 'el-company', type: 'company', label: 'Department / College', x: 5, y: 48, width: 62, height: 14, fontSize: 11, textAlign: 'left', color: '#374151', visible: true, zIndex: 3 },
      { id: 'el-category', type: 'category', label: 'Role Badge', x: 5, y: 65, width: 35, height: 14, fontSize: 10, fontWeight: 'bold', textAlign: 'center', color: '#ffffff', backgroundColor: '#16a34a', borderRadius: 4, textCase: 'uppercase', visible: true, zIndex: 4 },
      { id: 'el-reg', type: 'regNumber', label: 'Roll / Reg #', x: 42, y: 66, width: 25, height: 12, fontSize: 9, fontFamily: 'font-mono', textAlign: 'left', color: '#4b5563', visible: true, zIndex: 5 },
      { id: 'el-qr', type: 'qrCode', label: 'Turnstile QR', x: 70, y: 15, width: 26, height: 70, visible: true, zIndex: 6 }
    ]
  },
  {
    id: 'tpl-exhibitor-sponsor',
    name: 'Exhibitor / Sponsor',
    description: 'Prominent booth location badge with exhibitor company headline and sponsor tier banner.',
    widthInches: 4,
    heightInches: 6,
    orientation: 'portrait',
    headerColor: '#7c3aed',
    accentColor: '#8b5cf6',
    backgroundColor: '#ffffff',
    borderStyle: 'solid',
    elements: [
      { id: 'el-category-top', type: 'category', label: 'EXHIBITOR PASS', x: 0, y: 0, width: 100, height: 14, fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: '#ffffff', backgroundColor: '#6d28d9', textCase: 'uppercase', visible: true, zIndex: 1 },
      { id: 'el-company', type: 'company', label: 'Exhibitor Company', x: 5, y: 18, width: 90, height: 14, fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#4c1d95', visible: true, zIndex: 2 },
      { id: 'el-name', type: 'name', label: 'Representative Name', x: 5, y: 34, width: 90, height: 10, fontSize: 18, fontWeight: 'semibold', textAlign: 'center', color: '#1e293b', visible: true, zIndex: 3 },
      { id: 'el-designation', type: 'designation', label: 'Role', x: 8, y: 44, width: 84, height: 6, fontSize: 12, textAlign: 'center', color: '#64748b', visible: true, zIndex: 4 },
      { id: 'el-booth', type: 'customText', label: 'Booth Number', customText: 'BOOTH: HALL 3 · B-14', x: 15, y: 52, width: 70, height: 8, fontSize: 13, fontWeight: 'bold', textAlign: 'center', color: '#6d28d9', backgroundColor: '#ede9fe', borderRadius: 4, visible: true, zIndex: 5 },
      { id: 'el-qr', type: 'qrCode', label: 'Lead Capture QR', x: 30, y: 62, width: 40, height: 23, visible: true, zIndex: 6 },
      { id: 'el-reg', type: 'regNumber', label: 'Badge ID', x: 10, y: 87, width: 80, height: 4, fontSize: 11, fontFamily: 'font-mono', textAlign: 'center', color: '#64748b', visible: true, zIndex: 7 },
      { id: 'el-event', type: 'eventName', label: 'Event Host', x: 5, y: 93, width: 90, height: 5, fontSize: 11, textAlign: 'center', color: '#7c3aed', textCase: 'uppercase', visible: true, zIndex: 8 }
    ]
  },
  {
    id: 'tpl-workshop',
    name: 'Workshop & Masterclass',
    description: 'Compact 4x4 inch square format with track assignment, lab room, and instructor accreditation.',
    widthInches: 4,
    heightInches: 4,
    orientation: 'portrait',
    headerColor: '#ea580c',
    accentColor: '#f97316',
    backgroundColor: '#ffffff',
    borderStyle: 'solid',
    elements: [
      { id: 'el-event', type: 'eventName', label: 'Workshop Series', x: 5, y: 4, width: 90, height: 10, fontSize: 13, fontWeight: 'bold', textAlign: 'center', color: '#c2410c', textCase: 'uppercase', visible: true, zIndex: 1 },
      { id: 'el-track', type: 'customText', label: 'Track Room', customText: 'LAB 4: ADVANCED TENSOR PROTOCOLS', x: 8, y: 15, width: 84, height: 6, fontSize: 10, fontWeight: 'bold', textAlign: 'center', color: '#ffffff', backgroundColor: '#ea580c', borderRadius: 3, textCase: 'uppercase', visible: true, zIndex: 2 },
      { id: 'el-name', type: 'name', label: 'Attendee Name', x: 5, y: 24, width: 90, height: 16, fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#0f172a', visible: true, zIndex: 3 },
      { id: 'el-company', type: 'company', label: 'Affiliation', x: 8, y: 41, width: 84, height: 8, fontSize: 12, textAlign: 'center', color: '#475569', visible: true, zIndex: 4 },
      { id: 'el-qr', type: 'qrCode', label: 'Class Check-in QR', x: 33, y: 50, width: 34, height: 32, visible: true, zIndex: 5 },
      { id: 'el-reg', type: 'regNumber', label: 'Seat / ID', x: 10, y: 84, width: 80, height: 6, fontSize: 10, fontFamily: 'font-mono', textAlign: 'center', color: '#64748b', visible: true, zIndex: 6 },
      { id: 'el-category', type: 'category', label: 'Track Access', x: 0, y: 92, width: 100, height: 8, fontSize: 11, fontWeight: 'bold', textAlign: 'center', color: '#ffffff', backgroundColor: '#9a3412', textCase: 'uppercase', visible: true, zIndex: 7 }
    ]
  },
  {
    id: 'tpl-modern-qr-first',
    name: 'Modern QR-First',
    description: 'Large central high-density QR code for instant optical scan velocity at automated gate turnstiles.',
    widthInches: 4,
    heightInches: 6,
    orientation: 'portrait',
    headerColor: '#09090b',
    accentColor: '#38bdf8',
    backgroundColor: '#ffffff',
    borderStyle: 'solid',
    elements: [
      { id: 'el-qr', type: 'qrCode', label: 'Central Gate Turnstile QR', x: 16, y: 6, width: 68, height: 42, visible: true, zIndex: 1 },
      { id: 'el-reg', type: 'regNumber', label: 'Registration Key', x: 10, y: 49, width: 80, height: 6, fontSize: 14, fontFamily: 'font-mono', fontWeight: 'bold', textAlign: 'center', color: '#09090b', visible: true, zIndex: 2 },
      { id: 'el-divider', type: 'divider', label: 'Divider', x: 15, y: 56, width: 70, height: 1, backgroundColor: '#09090b', visible: true, zIndex: 3 },
      { id: 'el-name', type: 'name', label: 'Attendee Full Name', x: 5, y: 60, width: 90, height: 14, fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#09090b', visible: true, zIndex: 4 },
      { id: 'el-company', type: 'company', label: 'Company / Organization', x: 6, y: 74, width: 88, height: 6, fontSize: 13, textAlign: 'center', color: '#52525b', visible: true, zIndex: 5 },
      { id: 'el-event', type: 'eventName', label: 'Event Host Name', x: 6, y: 81, width: 88, height: 6, fontSize: 11, fontWeight: 'semibold', textAlign: 'center', color: '#71717a', textCase: 'uppercase', visible: true, zIndex: 6 },
      { id: 'el-category', type: 'category', label: 'Color Block', x: 0, y: 89, width: 100, height: 11, fontSize: 16, fontWeight: 'bold', textAlign: 'center', color: '#ffffff', backgroundColor: '#0284c7', textCase: 'uppercase', visible: true, zIndex: 7 }
    ]
  }
];
