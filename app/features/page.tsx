import React from 'react';
import Link from 'next/link';
import AppleDock from '@/app/components/navigation/AppleDock';
import BackButton from '@/app/components/ui/BackButton';
import { 
  CreditCard, 
  QrCode, 
  UserPlus, 
  Users, 
  BarChart3, 
  Printer, 
  ShieldCheck, 
  FileSpreadsheet, 
  ArrowRight,
  Sparkles,
  Sliders,
  Check
} from 'lucide-react';

export default function FeaturesPage() {
  const featureDeepDives = [
    {
      id: 'badge-designer',
      title: 'Vector-Precision Interactive Badge Designer',
      tagline: 'From blank canvas to lanyard-ready thermal prints in minutes',
      desc: 'Our direct-manipulation badge designer lets you position attendee names, registration codes, scannable QR tokens, and sponsor logos with pixel and millimeter precision. Switch dynamically between 10 built-in templates, test against real attendee profiles, or toggle between portrait and landscape formats.',
      icon: CreditCard,
      href: '/events',
      actionLabel: 'Launch Interactive Designer',
      bullets: [
        'Real-time drag, drop, and resize handles with synchronized property inputs',
        'Built-in support for 4x6", 4x3", 3x2", 4x4", and custom millimeter dimensions',
        'Calibrated lanyard punch-hole clearance guide',
        'Synchronized typography controls (family, weight, case, alignment, color)'
      ]
    },
    {
      id: 'spot-reg',
      title: 'Counter-Optimized On-Spot Registration',
      tagline: 'Under 15 seconds from attendee walk-in to badge print',
      desc: 'Designed specifically for high-stress registration desks where lines form rapidly. Keyboard-first workflow allows operators to type the delegate’s name, hit enter, automatically generate an authenticated sequential registration code, and trigger an immediate thermal print job without touching the mouse.',
      icon: UserPlus,
      href: '/events',
      actionLabel: 'Try Spot Registration Desk',
      bullets: [
        'Full Name is the only mandatory input; all supporting fields are optional',
        'Instant collision-free sequential registration number generation (e.g. APX-1019)',
        'Automatic QR payload creation with attendee verification checksum',
        'One-click "Register Another" shortcut for rapid multi-counter operations'
      ]
    },
    {
      id: 'turnstile-scanner',
      title: 'Dual-Mode Optical Turnstile QR Scanner',
      tagline: 'Instant check-in & check-out validation with zero friction',
      desc: 'Turn any tablet, smartphone, or laptop camera into an industrial event gate scanner. Validates tickets and badges instantly, flags duplicate check-in attempts with clear visual and audio alerts, and maintains a real-time turnstile log with millisecond timestamps.',
      icon: QrCode,
      href: '/events',
      actionLabel: 'Open Gate Scanner',
      bullets: [
        'High-fps optical continuous recognition without freezing between scans',
        'Toggle seamlessly between Event Gate Check-In and Session Check-Out',
        'Visual pass / fail banners visible from 10 feet away in harsh lighting',
        'Manual override search for delegates with damaged or lost physical badges'
      ]
    },
    {
      id: 'live-analytics',
      title: 'Live Velocity Telemetry & Turnout Tracking',
      tagline: 'Make on-the-fly crowd management decisions backed by live data',
      desc: 'Watch delegate check-ins stream in real time. Compare registration velocity against actual hall attendance, monitor category breakdown across VIPs, speakers, faculty, and general delegates, and export formula-safe audit reports directly to Excel or CSV.',
      icon: BarChart3,
      href: '/events',
      actionLabel: 'View Event Analytics',
      bullets: [
        'Real-time attendance percentage breakdown and hourly arrival velocity chart',
        'Category breakdown table with checked-in vs pending registration tallies',
        'Formula-injection sanitized XLSX and CSV exports for organizers and security audits',
        'Session-by-session tracking for CME credits and restricted hall sessions'
      ]
    },
    {
      id: 'rbac-security',
      title: 'Role-Based Access Control & Strict Tenant Isolation',
      tagline: 'Granular permissions that prevent accidental staff mistakes',
      desc: 'Equip your volunteer staff, scanner operators, and check-in desks with purpose-built minimal interfaces. Registration staff cannot modify event billing or delete attendees; scanner operators only see camera feeds and verification counters.',
      icon: ShieldCheck,
      href: '/events',
      actionLabel: 'Review Staff Permissions',
      bullets: [
        'Five distinct operational roles: Platform Admin, Org Owner, Event Manager, Registration Staff, Scanner Operator',
        'Strict tenant boundaries enforced at every SQL query and API endpoint',
        'Immutable security audit trail capturing badge re-prints, deletions, and role promotions',
        'Session revocation and CSRF defense built directly into authentication'
      ]
    },
    {
      id: 'sheet-printing',
      title: 'Multi-Badge Sheet Printing & Thermal Roll Integration',
      tagline: 'A4 6-up sheets or single-badge thermal outputs on demand',
      desc: 'Whether printing continuous rolls at rapid registration desks or running pre-conference bulk badge runs on industrial laser printers, our print engine handles layout calibration, crop gutters, and margins without clipping.',
      icon: Printer,
      href: '/events',
      actionLabel: 'Open Print Preview',
      bullets: [
        'Calibrated A4 multi-badge grid layouts (6 badges per sheet) with boundary cuts',
        'Single-badge direct print mode for Zebra, TSC, and Brother thermal printers',
        'Cross-browser print CSS hiding navigation docks and interface chrome',
        'Audit-logged reprint workflow requiring explicit operator confirmation'
      ]
    }
  ];

  return (
    <div className="w-full pb-20">
      <AppleDock variant="public" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <BackButton href="/" label="Back to Overview" className="mb-6" />

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/50 border border-indigo-800/40 text-xs font-semibold text-indigo-400 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Complete Feature Breakdown</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Engineered for Flawless On-Ground Operations
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto">
            Explore the core architectural components that make MS Backstage the most reliable operating system for conferences, summits, and exhibitions.
          </p>
        </div>

        {/* Deep Dive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {featureDeepDives.map((feat) => {
            const Icon = feat.icon;
            return (
              <div 
                key={feat.id}
                className="glass-panel rounded-2xl p-6 sm:p-8 flex flex-col justify-between hover:border-slate-600/60 transition-all group"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-indigo-400 tracking-wide uppercase">
                        {feat.tagline}
                      </span>
                      <h2 className="text-lg font-bold text-white tracking-tight leading-snug">
                        {feat.title}
                      </h2>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                    {feat.desc}
                  </p>

                  <div className="space-y-2 mb-8">
                    {feat.bullets.map((b, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <Link
                    href={feat.href}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <span>{feat.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
