import React from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../navigation/BackButton';
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
  Sliders
} from 'lucide-react';

export const FeaturesPage: React.FC = () => {
  const { navigate } = useApp();

  const featureDeepDives = [
    {
      id: 'badge-designer',
      title: 'Vector-Precision Interactive Badge Designer',
      tagline: 'From blank canvas to lanyard-ready thermal prints in minutes',
      desc: 'Our direct-manipulation badge designer lets you position attendee names, registration codes, scannable QR tokens, and sponsor logos with pixel and millimeter precision. Switch dynamically between 10 built-in templates, test against real attendee profiles, or toggle between portrait and landscape formats.',
      icon: CreditCard,
      action: () => navigate('badge-designer'),
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
      action: () => navigate('spot-registration'),
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
      action: () => navigate('scanner'),
      actionLabel: 'Open Gate Scanner',
      bullets: [
        'Hardware camera streaming with automatic barcode and QR decoding',
        'Simulated scan shortcut panel for rapid demonstration without physical badges',
        'Check-In vs Check-Out mode toggle for venue capacity compliance',
        'Anti-passback protection flagging already-scanned badges'
      ]
    },
    {
      id: 'multi-print',
      title: 'Calibrated Multi-Badge Sheet & Thermal Printing',
      tagline: 'A4 6-up sheets or single-label thermal rolls with crop marks',
      desc: 'Say goodbye to misaligned paper badges. MS Backstage includes a sheet layout engine supporting standard A4 6-badge (2 columns × 3 rows) layouts, 8-badge sheets, or single thermal label rolls (Zebra, Brother, Epson). Clean @media print rules ensure zero UI clutter on paper.',
      icon: Printer,
      action: () => navigate('print-preview'),
      actionLabel: 'Open Print Preview',
      bullets: [
        'A4 6-up sheet layout with calibrated margins and center gutters',
        'Vector rendering ensures crisp lines even on compact 203 DPI thermal printers',
        'Dynamic crop marks guide fast guillotine and paper-cutter slicing',
        'Batch attendee selection for bulk printing hundreds of badges at once'
      ]
    },
    {
      id: 'analytics',
      title: 'Live Velocity & Category Analytics',
      tagline: 'Real-time venue intelligence and attendance velocity',
      desc: 'Track entry flow in real time across morning keynote rushes. Monitor which delegate tiers have checked in, review payment status reconciliations, and inspect detailed audit trails tracking every staff mutation.',
      icon: BarChart3,
      action: () => navigate('reports'),
      actionLabel: 'Inspect Analytics Workspace',
      bullets: [
        'Hourly turnstile check-in velocity graphs',
        'Category breakdown charts (VIP, Speaker, Delegate, Faculty, Student)',
        'Full export to CSV and Excel formats with single-click download',
        'Immutable audit logs tracking actor, IP address, and changed values'
      ]
    }
  ];

  return (
    <div className="w-full pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <BackButton label="Back to Overview" targetRoute="home" className="mb-6" />

        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/50 border border-indigo-800/40 text-xs font-semibold text-indigo-400 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Platform Capabilities</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Every Feature Built for Real On-Site Demands
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            From the bustling registration lobby to the executive stage turnstiles, MS Backstage delivers uncompromising speed and tactile control.
          </p>
        </div>

        {/* Feature Deep Dives Stack */}
        <div className="space-y-8">
          {featureDeepDives.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col lg:flex-row items-start gap-8"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-700/40 text-indigo-400 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex-1">
                  <span className="text-[11px] font-mono font-semibold text-indigo-400 uppercase tracking-wider">
                    {feat.tagline}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">{feat.title}</h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {feat.desc}
                  </p>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {feat.bullets.map((b, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-3">
                    <button
                      onClick={feat.action}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md flex items-center gap-2 active:scale-95"
                    >
                      <span>{feat.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <button
            onClick={() => navigate('dashboard')}
            className="px-8 py-3.5 rounded-2xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-950/60 active:scale-95"
          >
            Launch Complete Platform Experience
          </button>
        </div>
      </div>
    </div>
  );
};
