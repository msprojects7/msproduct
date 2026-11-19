import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  QrCode,
  Printer,
  Users,
  FileSpreadsheet,
  Building2,
  ArrowRight,
  CheckCircle,
  Clock,
  Layers,
  Sparkles,
  BarChart3,
  BadgeCheck,
  CreditCard,
  UserPlus,
  Stethoscope,
  Briefcase,
  GraduationCap,
  Cpu,
  ChevronRight,
  Check
} from 'lucide-react';
import AppleDock from '@/app/components/navigation/AppleDock';
import { BadgeShowcase } from './components/marketing/BadgeShowcase';

export default function HomePage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'MS Backstage',
        description:
          'Multi-Tenant Event Operations & Registration Platform inspired by macOS design and Zoho Backstage capabilities',
        publisher: {
          '@type': 'Organization',
          name: 'MS Backstage',
          logo: {
            '@type': 'ImageObject',
            url: `${siteUrl}/msfav.png`,
          },
        },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${siteUrl}/#software`,
        name: 'MS Backstage',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web Browser',
        description:
          'Complete conference and event management software with spot registration desk, QR badge check-in, visual badge designer, and real-time attendance analytics.',
        featureList: [
          'Multi-Tenant Organization and Event Isolation',
          'Role-Based Access Control and Staff Permissions',
          'Pre-Registration and CSV/Excel Import Workflows',
          'Atomic Concurrency-Safe Spot Registration Desk',
          'QR Code Scanning for Real-Time Check-In and Check-Out',
          'Visual Badge Layout Designer with Thermal Print Support',
          'Real-Time Attendance Reports and Secure CSV/XLSX Exports',
        ],
      },
    ],
  };

  const capabilities = [
    {
      num: '01',
      title: 'Event Architecture',
      desc: 'Multi-day scheduling, custom timezone management, automated sequential numbering rules, and branded event portals.',
      icon: Layers,
    },
    {
      num: '02',
      title: 'Attendee Directory',
      desc: 'Centralized delegate registry with granular category segmentation, payment verification, and multi-field search.',
      icon: Users,
    },
    {
      num: '03',
      title: 'Rapid On-Spot Registration',
      desc: 'Counter-optimized terminal with keyboard-first data entry, zero friction flow, and instant sequential badge generation.',
      icon: UserPlus,
    },
    {
      num: '04',
      title: 'Dual-Mode QR Turnstile Scanner',
      desc: 'High-speed camera optical verification for check-in and check-out with audio confirmation and repeat scan alerts.',
      icon: QrCode,
    },
    {
      num: '05',
      title: 'Interactive Badge Designer',
      desc: 'Pixel-precise canvas editor with direct drag-and-drop elements, resize handles, and synchronized coordinate controls.',
      icon: CreditCard,
    },
    {
      num: '06',
      title: 'Multi-Badge Sheet Printing',
      desc: 'A4 6-up sheet layout engines with calibrated crop marks, gutter management, and direct thermal roll output.',
      icon: Printer,
    },
    {
      num: '07',
      title: 'Role-Based Staff Access',
      desc: 'Five distinct operational roles (Platform Admin, Org Owner, Event Manager, Registration Staff, Scanner Operator).',
      icon: ShieldCheck,
    },
    {
      num: '08',
      title: 'Live Velocity Analytics',
      desc: 'Turnstile check-in flow metrics, category attendance breakdown, peak hourly throughput, and exportable financial summaries.',
      icon: BarChart3,
    },
    {
      num: '09',
      title: 'Smart CSV / Excel Imports',
      desc: 'Intelligent column mapping, duplicate detection, schema validation, and row-level error reporting for high-volume batches.',
      icon: FileSpreadsheet,
    },
    {
      num: '10',
      title: 'Multi-Tenant Organizations',
      desc: 'Manage multiple concurrent client brands, enterprise workspaces, shared billing tiers, and centralized audit histories.',
      icon: Building2,
    },
  ];

  const steps = [
    { step: '1', title: 'Create Organization', desc: 'Configure brand identity, default timezone, and billing plan.' },
    { step: '2', title: 'Launch Workspace', desc: 'Define venue, dates, registration prefixes, and category tiers.' },
    { step: '3', title: 'Import or Pre-Register', desc: 'Upload pre-registered CSV lists or open online guest registration.' },
    { step: '4', title: 'Design Badges', desc: 'Pick from 10 curated templates or drag custom elements on canvas.' },
    { step: '5', title: 'Deploy Counters', desc: 'Staff terminal handles rapid on-spot registrations in under 15 seconds.' },
    { step: '6', title: 'Scan Turnstiles', desc: 'High-throughput optical QR scanners log attendance velocity.' },
    { step: '7', title: 'Review Audit', desc: 'Monitor hourly entry tallies, export records, and review security logs.' },
  ];

  const useCases = [
    {
      title: 'Medical Conferences & CME',
      desc: 'Capture Medical Council registration numbers, issue CME accreditation credits, and print specialty-coded badges for surgeons and faculty.',
      icon: Stethoscope,
      accent: 'border-sky-500/30 bg-sky-950/10',
    },
    {
      title: 'Corporate Summits & AGMs',
      desc: 'Executive VIP check-in lanes, strict access control zones, green-room access verification, and confidential shareholder registries.',
      icon: Briefcase,
      accent: 'border-indigo-500/30 bg-indigo-950/10',
    },
    {
      title: 'Academic Colloquiums',
      desc: 'Seamless student vs faculty categorization, department tracking, session attendance verification, and high-volume badge printing.',
      icon: GraduationCap,
      accent: 'border-emerald-500/30 bg-emerald-950/10',
    },
    {
      title: 'Exhibitions & Tech Expos',
      desc: 'Hall and booth identification badges, exhibitor lead-capture ready QR codes, and multi-station gate turnstile scanning.',
      icon: Cpu,
      accent: 'border-purple-500/30 bg-purple-950/10',
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top Floating macOS Navigation Dock */}
      <AppleDock variant="public" />

      <main className="flex-1 w-full pb-20">
        {/* HERO SECTION */}
        <section className="relative pt-8 pb-16 md:pt-16 md:pb-24 overflow-hidden">
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 blur-[120px] pointer-events-none rounded-full" />
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-sky-500/10 blur-[100px] pointer-events-none rounded-full" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              {/* Quiet text kicker */}
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-indigo-400 mb-4 px-3 py-1 rounded-full bg-indigo-950/40 border border-indigo-800/40">
                <Sparkles className="w-3.5 h-3.5" />
                <span>The Next-Generation Event Operating System</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
                Every Event. One Seamless Backstage.
              </h1>

              <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
                Manage registrations, attendees, on-site check-in, badges, and event analytics from one beautifully connected macOS-inspired workspace.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/dashboard"
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-950/60 flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  <span>Launch Event Console</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/features"
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 transition-all active:scale-95 cursor-pointer"
                >
                  Explore Features
                </Link>
                <Link
                  href="/pricing"
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 transition-all active:scale-95 cursor-pointer"
                >
                  Pricing &amp; Plans
                </Link>
              </div>

              {/* Quiet metadata features strip */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> 10 Professional Badge Templates</span>
                <span aria-hidden="true" className="text-slate-700">·</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Offline Turnstile Optical Scanner</span>
                <span aria-hidden="true" className="text-slate-700">·</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> 15-Second On-Spot Registration</span>
              </div>
            </div>

            {/* REALISTIC SAAS WORKSPACE PREVIEW */}
            <div className="mt-14 relative max-w-5xl mx-auto">
              <div className="rounded-3xl glass-panel shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
                {/* Window Header */}
                <div className="bg-slate-100/90 dark:bg-slate-900/90 px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="ml-3 text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
                      Apex Global Summit 2026 — Executive Operations Console
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                      LIVE EVENT ACTIVE
                    </span>
                  </div>
                </div>

                {/* Workspace Mock Content */}
                <div className="p-4 sm:p-6 bg-slate-50/70 dark:bg-slate-950/70 space-y-6">
                  {/* 4 KPI Metrics Strip */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Registered</p>
                      <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">1,420</p>
                      <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">+140 on-spot today</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Turnstile Check-ins</p>
                      <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">984</p>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">69.3% venue occupancy</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Badges Printed</p>
                      <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">1,128</p>
                      <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">94.8% print clearance</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Turnstile Scan Speed</p>
                      <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">1.8s</p>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Average gate dwell time</p>
                    </div>
                  </div>

                  {/* Sub-grid: Live Attendees Table + Quick Action Buttons */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Recent Live Attendees */}
                    <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Recent Checked-In Delegates
                        </h4>
                        <Link
                          href="/dashboard"
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-semibold flex items-center gap-1"
                        >
                          <span>Open Console</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      <div className="space-y-2 text-xs">
                        {[
                          { reg: 'APX-1001', name: 'Surya Kumar', cat: 'VIP', org: 'Apex Technologies', time: '08:42 AM' },
                          { reg: 'APX-1002', name: 'Dr. Jane Smith', cat: 'Speaker', org: 'NeuroSystems Global Labs', time: '09:05 AM' },
                          { reg: 'APX-1004', name: 'Kavita Patel', cat: 'Faculty', org: 'IIT Bombay', time: '09:18 AM' },
                          { reg: 'APX-1005', name: 'Rahul Verma', cat: 'Delegate', org: 'Infoway Systems Corp', time: '09:32 AM' },
                        ].map((row, i) => (
                          <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/60">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-300 font-semibold">{row.reg}</span>
                              <span className="font-semibold text-slate-800 dark:text-white">{row.name}</span>
                              <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">{row.org}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-medium">{row.cat}</span>
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">{row.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Operational Desks Fast Launch */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                          Operational Desks
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                          Instant single-click access to counter stations and gate hardware.
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        <Link
                          href="/dashboard"
                          className="w-full py-2.5 px-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-between transition-colors shadow-sm shadow-indigo-600/20"
                        >
                          <span className="flex items-center gap-2">
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>On-Spot Registration Desk</span>
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>

                        <Link
                          href="/dashboard"
                          className="w-full py-2.5 px-4 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold flex items-center justify-between transition-colors border border-slate-200 dark:border-slate-700"
                        >
                          <span className="flex items-center gap-2">
                            <QrCode className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span>Turnstile QR Scanner</span>
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>

                        <Link
                          href="/dashboard"
                          className="w-full py-2.5 px-4 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold flex items-center justify-between transition-colors border border-slate-200 dark:border-slate-700"
                        >
                          <span className="flex items-center gap-2">
                            <CreditCard className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span>Launch Badge Designer</span>
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CORE CAPABILITIES (10 FEATURES) */}
        <section id="capabilities" className="py-20 border-t border-slate-200 dark:border-slate-900 bg-slate-50/60 dark:bg-slate-950/40 transition-colors">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                End-to-End Event Infrastructure
              </h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Every tool required by on-site operations teams, convention organizers, and academic boards in one cohesive architecture.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {capabilities.map((cap, i) => {
                const Icon = cap.icon;
                return (
                  <div
                    key={i}
                    className="p-6 rounded-2xl bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 shadow-xs dark:shadow-none transition-all group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-xs text-slate-400 dark:text-slate-500 font-semibold">{cap.num}</span>
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">{cap.title}</h3>
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{cap.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CENTERPIECE: BADGE DESIGNER SHOWCASE */}
        <section className="py-20 border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950/60 transition-colors">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <BadgeShowcase />
          </div>
        </section>

        {/* INDUSTRY USE CASES */}
        <section className="py-20 border-t border-slate-200 dark:border-slate-900 transition-colors">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
                Tailored Solutions
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Built for High-Stakes Operations
              </h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Whether managing 500 cardiac surgeons or 15,000 expo visitors, MS Backstage adapts to your compliance and speed requirements.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {useCases.map((uc, i) => {
                const Icon = uc.icon;
                return (
                  <div
                    key={i}
                    className="p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs dark:shadow-none backdrop-blur-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-slate-900/80 border border-indigo-200 dark:border-slate-700/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                        {uc.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {uc.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 7-STAGE OPERATIONS WORKFLOW */}
        <section id="how-it-works" className="py-20 border-t border-slate-200 dark:border-slate-900 bg-slate-50/60 dark:bg-slate-950/40 transition-colors">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                How MS Backstage Works
              </h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                A continuous, frictionless workflow from initial organization setup to final post-event audit.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((st, i) => (
                <div
                  key={i}
                  className={`p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-none flex flex-col justify-between ${
                    i === 6 ? 'md:col-span-2 lg:col-span-2' : ''
                  }`}
                >
                  <div>
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold flex items-center justify-center mb-3">
                      {st.step}
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{st.title}</h4>
                    <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{st.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TRANSPARENT PRICING SECTION */}
        <section id="pricing" className="py-20 border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-transparent transition-colors">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                Transparent Commercial Pricing
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Predictable Plans for Conferences of Any Scale
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Every tier includes full event desk access, QR scanning, and thermal badge printing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Free */}
              <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Free Starter</span>
                  <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white mb-1">₹0</div>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-3">Up to 50 Attendees</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                    Ideal for small workshops, meetups, and platform trials.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 mb-6">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Instant QR Check-In</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Thermal Badge Printing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Attendee CSV Export</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/auth/sign-up"
                  className="w-full py-2 px-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl transition"
                >
                  Get Started Free
                </Link>
              </div>

              {/* Pro */}
              <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between border-2 border-indigo-500 bg-white/95 dark:bg-slate-900/90 shadow-2xl shadow-indigo-950/20 dark:shadow-indigo-950/50 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-md">
                  Most Popular
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Pro Event</span>
                  <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white mb-1">
                    ₹2,000 <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ event</span>
                  </div>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-3">Up to 1,000 Attendees</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                    Engineered for medium conferences, conventions &amp; summits.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 mb-6">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>Queue-Busting Spot Desk</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>Visual Badge Designer Canvas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>10 Built-In Templates (A4 &amp; A6)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>Formula-Safe Excel &amp; PDF</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>Up to 5 Desk Staff Operators</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/auth/sign-up"
                  className="w-full py-2.5 px-3 text-center text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition"
                >
                  Start Pro Event
                </Link>
              </div>

              {/* Pro Max */}
              <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Pro Max Summit</span>
                  <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white mb-1">
                    ₹5,000 <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ event</span>
                  </div>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-3">Up to 5,000 Attendees</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                    High-capacity national conferences and medical expos.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 mb-6">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Unlimited Spot Registration Desks</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Multi-Track Hall Access Control</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Live Attendance Velocity Charts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Intelligent Column Excel Import</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/auth/sign-up"
                  className="w-full py-2 px-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl transition"
                >
                  Start Pro Max
                </Link>
              </div>

              {/* Lifetime */}
              <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Lifetime Enterprise</span>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">Custom Terms</div>
                  <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold mb-3">Unlimited Attendees</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                    Perpetual licensing, private deployment &amp; on-site engineer.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 mb-6">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                      <span>Unlimited Concurrent Scanners</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                      <span>Custom Domain &amp; White Label</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                      <span>Dedicated SLA &amp; Support</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/pricing"
                  className="w-full py-2 px-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl transition"
                >
                  View Pricing Matrix
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 py-10 px-4 sm:px-6 text-xs transition-colors">
        <div className="max-w-6xl mx-auto flex flex-col items-center justify-center gap-3 text-center">
          <div className="flex items-center gap-2.5 justify-center">
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 flex items-center justify-center shadow-xs">
              <img
                src="/msfav.png"
                alt="MS Backstage Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              MS Backstage
            </span>
          </div>

          <div className="text-slate-500 dark:text-slate-400 text-xs font-medium">
            Events | MS Backstage &bull; &copy; {new Date().getFullYear()} All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
