import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowRight, 
  Sparkles, 
  QrCode, 
  CreditCard, 
  Users, 
  BarChart3, 
  ShieldCheck, 
  FileSpreadsheet, 
  Printer, 
  Building2, 
  UserPlus, 
  CheckCircle2, 
  Layers, 
  Check, 
  ChevronRight,
  Stethoscope,
  Briefcase,
  GraduationCap,
  Cpu
} from 'lucide-react';
import { initialBadgeTemplates } from '../../lib/badge-templates';

export const HomePage: React.FC = () => {
  const { navigate, setActiveBadgeTemplate } = useApp();
  const [activeTabTemplate, setActiveTabTemplate] = useState(0);

  const capabilities = [
    {
      num: '01',
      title: 'Event Architecture',
      desc: 'Multi-day scheduling, custom timezone management, automated sequential numbering rules, and branded event portals.',
      icon: Layers
    },
    {
      num: '02',
      title: 'Attendee Directory',
      desc: 'Centralized delegate registry with granular category segmentation, payment verification, and multi-field search.',
      icon: Users
    },
    {
      num: '03',
      title: 'Rapid On-Spot Registration',
      desc: 'Counter-optimized terminal with keyboard-first data entry, zero friction flow, and instant sequential badge generation.',
      icon: UserPlus
    },
    {
      num: '04',
      title: 'Dual-Mode QR Turnstile Scanner',
      desc: 'High-speed camera optical verification for check-in and check-out with audio confirmation and repeat scan alerts.',
      icon: QrCode
    },
    {
      num: '05',
      title: 'Interactive Badge Designer',
      desc: 'Pixel-precise canvas editor with direct drag-and-drop elements, resize handles, and synchronized coordinate controls.',
      icon: CreditCard
    },
    {
      num: '06',
      title: 'Multi-Badge Sheet Printing',
      desc: 'A4 6-up and 8-up sheet layout engines with calibrated crop marks, gutter management, and direct thermal roll output.',
      icon: Printer
    },
    {
      num: '07',
      title: 'Role-Based Staff Access',
      desc: 'Five distinct operational roles (Platform Admin, Org Owner, Event Manager, Registration Staff, Scanner Operator).',
      icon: ShieldCheck
    },
    {
      num: '08',
      title: 'Live Velocity Analytics',
      desc: 'Turnstile check-in flow metrics, category attendance breakdown, peak hourly throughput, and exportable financial summaries.',
      icon: BarChart3
    },
    {
      num: '09',
      title: 'Smart CSV / Excel Imports',
      desc: 'Intelligent column mapping, duplicate detection, schema validation, and row-level error reporting for high-volume batches.',
      icon: FileSpreadsheet
    },
    {
      num: '10',
      title: 'Multi-Tenant Organizations',
      desc: 'Manage multiple concurrent client brands, enterprise workspaces, shared billing tiers, and centralized audit histories.',
      icon: Building2
    }
  ];

  const steps = [
    { step: '1', title: 'Create Organization', desc: 'Configure brand identity, default timezone, and billing plan.' },
    { step: '2', title: 'Launch Event Workspace', desc: 'Define venue, dates, registration prefixes, and category tiers.' },
    { step: '3', title: 'Import or Pre-Register', desc: 'Upload pre-registered CSV lists or open online guest registration.' },
    { step: '4', title: 'Design Professional Badges', desc: 'Pick from 10 curated templates or drag custom elements on canvas.' },
    { step: '5', title: 'Deploy On-Site Counters', desc: 'Staff terminal handles rapid on-spot registrations in under 15 seconds.' },
    { step: '6', title: 'Scan & Turnstile Check-in', desc: 'High-throughput optical QR scanners log attendance velocity.' },
    { step: '7', title: 'Review Audit & Reports', desc: 'Monitor hourly entry tallies, export records, and review security logs.' }
  ];

  const useCases = [
    {
      title: 'Medical Conferences & CME',
      desc: 'Capture Medical Council registration numbers, issue CME accreditation credits, and print specialty-coded badges for surgeons and faculty.',
      icon: Stethoscope,
      accent: 'border-sky-500/30 bg-sky-950/10'
    },
    {
      title: 'Corporate Summits & AGMs',
      desc: 'Executive VIP check-in lanes, strict access control zones, green-room access verification, and confidential shareholder registries.',
      icon: Briefcase,
      accent: 'border-indigo-500/30 bg-indigo-950/10'
    },
    {
      title: 'Academic Colloquiums',
      desc: 'Seamless student vs faculty categorization, department tracking, session attendance verification, and high-volume badge printing.',
      icon: GraduationCap,
      accent: 'border-emerald-500/30 bg-emerald-950/10'
    },
    {
      title: 'Exhibitions & Tech Expos',
      desc: 'Hall and booth identification badges, exhibitor lead-capture ready QR codes, and multi-station gate turnstile scanning.',
      icon: Cpu,
      accent: 'border-purple-500/30 bg-purple-950/10'
    }
  ];

  return (
    <div className="w-full pb-20">
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
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

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] [text-wrap:balance]">
              Every Event. One Seamless Backstage.
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto [text-wrap:balance]">
              Manage registrations, attendees, on-site check-in, badges, and event analytics from one beautifully connected workspace.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('dashboard')}
                className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-950/60 flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <span>Launch Live Demo Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('pricing')}
                className="px-6 py-3 rounded-xl text-sm font-semibold text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 transition-all active:scale-95 cursor-pointer"
              >
                Explore Pricing & Plans
              </button>
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

          {/* SECTION 3 — PRODUCT PREVIEW: REALISTIC SAAS WORKSPACE PREVIEW */}
          <div className="mt-14 relative max-w-5xl mx-auto">
            {/* macOS Window Frame */}
            <div className="rounded-2xl glass-panel shadow-2xl overflow-hidden border border-slate-700/60">
              {/* Window Header */}
              <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-3 text-xs font-medium text-slate-400 font-mono">
                    Apex Global Summit 2026 — Executive Operations Console
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                    LIVE EVENT ACTIVE
                  </span>
                </div>
              </div>

              {/* Workspace Mock Content */}
              <div className="p-4 sm:p-6 bg-slate-950/70 space-y-6">
                {/* 4 KPI Metrics Strip */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <p className="text-xs text-slate-400">Total Registered</p>
                    <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-white">1,420</p>
                    <p className="mt-1 text-[11px] text-emerald-400 font-medium">+140 on-spot today</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <p className="text-xs text-slate-400">Turnstile Check-ins</p>
                    <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-indigo-400">984</p>
                    <p className="mt-1 text-[11px] text-slate-400">69.3% venue occupancy</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <p className="text-xs text-slate-400">Badges Printed</p>
                    <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-white">1,128</p>
                    <p className="mt-1 text-[11px] text-emerald-400 font-medium">94.8% print clearance</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <p className="text-xs text-slate-400">Turnstile Scan Speed</p>
                    <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-white">1.8s</p>
                    <p className="mt-1 text-[11px] text-slate-400">Average gate dwell time</p>
                  </div>
                </div>

                {/* Sub-grid: Live Attendees Table + Quick Action Buttons */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Recent Live Attendees */}
                  <div className="lg:col-span-2 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Recent Checked-In Delegates
                      </h4>
                      <button 
                        onClick={() => navigate('attendees')} 
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                      >
                        <span>View All 1,420</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      {[
                        { reg: 'APX-1001', name: 'Surya Kumar', cat: 'VIP', org: 'Apex Technologies', time: '08:42 AM' },
                        { reg: 'APX-1002', name: 'Dr. Jane Smith', cat: 'Speaker', org: 'NeuroSystems Global Labs', time: '09:05 AM' },
                        { reg: 'APX-1004', name: 'Kavita Patel', cat: 'Faculty', org: 'IIT Bombay', time: '09:18 AM' },
                        { reg: 'APX-1005', name: 'Rahul Verma', cat: 'Delegate', org: 'Infoway Systems Corp', time: '09:32 AM' }
                      ].map((row, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-slate-800/60">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[11px] text-indigo-300 font-medium">{row.reg}</span>
                            <span className="font-medium text-white">{row.name}</span>
                            <span className="text-slate-400 hidden sm:inline">{row.org}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-slate-400 font-mono">{row.cat}</span>
                            <span className="text-[11px] text-emerald-400 font-mono">{row.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Quick Launch Card */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                        Operational Desks
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed mb-4">
                        Instant single-click access to counter stations and gate hardware.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => navigate('spot-registration')}
                        className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-between transition-colors shadow-sm"
                      >
                        <span className="flex items-center gap-2">
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>On-Spot Registration Desk</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => navigate('scanner')}
                        className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-between transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Turnstile QR Scanner</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => navigate('badge-designer')}
                        className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-between transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Launch Badge Designer</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — CORE CAPABILITIES (10 FEATURES) */}
      <section className="py-20 border-t border-slate-900 bg-slate-950/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              End-to-End Event Infrastructure
            </h2>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Every tool required by on-site operations teams, convention organizers, and academic boards in one cohesive architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {capabilities.map((cap, i) => {
              const Icon = cap.icon;
              return (
                <div 
                  key={i}
                  className="p-6 rounded-2xl bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs text-slate-500 font-semibold">{cap.num}</span>
                  </div>
                  <h3 className="text-base font-semibold text-white tracking-tight">{cap.title}</h3>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">{cap.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 5 — HOW IT WORKS */}
      <section className="py-20 border-t border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              How MS Backstage Works
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              A continuous, frictionless workflow from initial organization setup to final post-event audit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((st, i) => (
              <div 
                key={i} 
                className={`p-5 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between ${
                  i === 6 ? 'md:col-span-2 lg:col-span-2' : ''
                }`}
              >
                <div>
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 font-mono text-xs font-bold flex items-center justify-center mb-3">
                    {st.step}
                  </div>
                  <h4 className="text-sm font-semibold text-white">{st.title}</h4>
                  <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6 — BADGE DESIGNER SHOWCASE */}
      <section className="py-20 border-t border-slate-900 bg-slate-950/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
                Centerpiece Feature
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Interactive Badge Designer
              </h2>
              <p className="mt-2 text-sm text-slate-400 max-w-xl">
                Choose from 10 distinct industry templates or customize dimensions, typography, QR positions, and lanyard ribbons with direct manipulation.
              </p>
            </div>
            <button
              onClick={() => {
                setActiveBadgeTemplate(initialBadgeTemplates[activeTabTemplate]);
                navigate('badge-designer');
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-md flex items-center gap-2 shrink-0"
            >
              <span>Open in Fullscreen Designer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Template Tab Switcher */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 no-scrollbar">
            {initialBadgeTemplates.map((tpl, idx) => (
              <button
                key={tpl.id}
                onClick={() => setActiveTabTemplate(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                  activeTabTemplate === idx
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {tpl.name}
              </button>
            ))}
          </div>

          {/* Live Badge Preview Card */}
          <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col lg:flex-row items-center justify-center gap-10">
            {/* Physical Badge Render Preview */}
            <div 
              className="relative shadow-2xl rounded-2xl overflow-hidden border border-slate-300/40 text-slate-900 transition-all duration-200"
              style={{
                width: initialBadgeTemplates[activeTabTemplate].orientation === 'portrait' ? '300px' : '400px',
                height: initialBadgeTemplates[activeTabTemplate].orientation === 'portrait' ? '450px' : '280px',
                backgroundColor: initialBadgeTemplates[activeTabTemplate].backgroundColor
              }}
            >
              {/* Lanyard Hole Clip Simulator */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-2 rounded-full bg-slate-300 border border-slate-400/50 z-20" />

              {/* Elements rendering */}
              {initialBadgeTemplates[activeTabTemplate].elements.filter(e => e.visible).map(el => (
                <div
                  key={el.id}
                  className="absolute flex items-center justify-center"
                  style={{
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    width: `${el.width}%`,
                    height: `${el.height}%`,
                    zIndex: el.zIndex,
                    backgroundColor: el.backgroundColor || 'transparent',
                    color: el.color || 'inherit',
                    borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined
                  }}
                >
                  {el.type === 'name' && (
                    <span 
                      className="font-bold tracking-tight text-center px-2 line-clamp-2"
                      style={{ fontSize: `${(el.fontSize || 22) * 0.75}px` }}
                    >
                      Surya Kumar
                    </span>
                  )}
                  {el.type === 'category' && (
                    <span 
                      className="font-bold uppercase tracking-wider text-center"
                      style={{ fontSize: `${(el.fontSize || 14) * 0.75}px` }}
                    >
                      VIP DELEGATE
                    </span>
                  )}
                  {el.type === 'eventName' && (
                    <span 
                      className="font-semibold uppercase tracking-wide text-center px-1 truncate"
                      style={{ fontSize: `${(el.fontSize || 12) * 0.7}px` }}
                    >
                      Apex Global Summit 2026
                    </span>
                  )}
                  {el.type === 'company' && (
                    <span 
                      className="text-center px-1 truncate"
                      style={{ fontSize: `${(el.fontSize || 12) * 0.75}px` }}
                    >
                      Apex Technologies Inc.
                    </span>
                  )}
                  {el.type === 'designation' && (
                    <span 
                      className="text-center px-1 truncate font-medium"
                      style={{ fontSize: `${(el.fontSize || 12) * 0.75}px` }}
                    >
                      Managing Director & Founder
                    </span>
                  )}
                  {el.type === 'regNumber' && (
                    <span 
                      className="font-mono font-bold tracking-wider text-center"
                      style={{ fontSize: `${(el.fontSize || 11) * 0.75}px` }}
                    >
                      APX-1001
                    </span>
                  )}
                  {el.type === 'qrCode' && (
                    <div className="w-full h-full p-1 bg-white border border-slate-300 rounded flex items-center justify-center">
                      <QrCode className="w-4/5 h-4/5 text-slate-900" />
                    </div>
                  )}
                  {el.type === 'logo' && (
                    <div className="flex items-center gap-1 text-slate-800 font-bold text-xs uppercase tracking-wider">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <span>APEX SUMMIT</span>
                    </div>
                  )}
                  {el.type === 'photo' && (
                    <div className="w-16 h-16 rounded-full bg-slate-200 border-2 border-indigo-500/40 flex items-center justify-center text-slate-600 font-bold text-sm">
                      SK
                    </div>
                  )}
                  {el.type === 'divider' && (
                    <div className="w-full h-full" style={{ backgroundColor: el.backgroundColor || '#cbd5e1' }} />
                  )}
                  {el.type === 'customText' && (
                    <span 
                      className="font-semibold text-center px-1 truncate"
                      style={{ fontSize: `${(el.fontSize || 10) * 0.75}px` }}
                    >
                      {el.customText}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Template Specs Sidebar */}
            <div className="max-w-md space-y-4">
              <div>
                <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider">
                  Template Details
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  {initialBadgeTemplates[activeTabTemplate].name}
                </h3>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  {initialBadgeTemplates[activeTabTemplate].description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400">Dimensions</span>
                  <p className="font-semibold text-white font-mono mt-0.5">
                    {initialBadgeTemplates[activeTabTemplate].widthInches} × {initialBadgeTemplates[activeTabTemplate].heightInches} inches
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400">Orientation</span>
                  <p className="font-semibold text-white capitalize mt-0.5">
                    {initialBadgeTemplates[activeTabTemplate].orientation}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Calibrated for standard A4 multi-badge and single thermal rolls</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>High-contrast typography readable at 2 meters distance</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Encodes scannable registration key and attendee identity</span>
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveBadgeTemplate(initialBadgeTemplates[activeTabTemplate]);
                  navigate('badge-designer');
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold text-center transition-all shadow-md active:scale-95"
              >
                Customize This Template Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 — USE CASES */}
      <section className="py-20 border-t border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Engineered for High-Stakes Gatherings
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Adaptable workflows built for specialized compliance, academic registries, and enterprise summits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {useCases.map((uc, i) => {
              const Icon = uc.icon;
              return (
                <div key={i} className={`p-6 rounded-2xl border ${uc.accent}`}>
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/60 text-white flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-base font-semibold text-white tracking-tight">{uc.title}</h3>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed">{uc.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 8 — PRICING PREVIEW */}
      <section className="py-20 border-t border-slate-900 bg-slate-950/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Transparent, Configurable Pricing
          </h2>
          <p className="mt-3 text-sm text-slate-400 max-w-xl mx-auto">
            From free 50-delegate workshops to multi-thousand attendee international summits.
          </p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
            {[
              { name: 'Free', cap: '50 Attendees', price: '₹0', note: 'Single meetups' },
              { name: 'Pro', cap: '1,000 Attendees', price: '₹2,000', note: 'Configurable cadence', highlight: true },
              { name: 'Pro Max', cap: '5,000 Attendees', price: '₹7,500', note: 'Proposed starting limit' },
              { name: 'Lifetime', cap: 'Unlimited', price: 'Custom', note: 'Enterprise SLA' }
            ].map((p, i) => (
              <div 
                key={i} 
                className={`p-5 rounded-2xl border ${
                  p.highlight ? 'bg-indigo-950/20 border-indigo-500/50 shadow-lg' : 'bg-slate-900/40 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">{p.name}</h4>
                  {p.highlight && <span className="text-[10px] text-indigo-300 font-mono">Popular</span>}
                </div>
                <p className="mt-2 text-2xl font-bold font-mono text-white">{p.price}</p>
                <p className="text-xs text-indigo-400 font-mono mt-0.5">{p.cap}</p>
                <p className="text-[11px] text-slate-400 mt-2">{p.note}</p>
                <button
                  onClick={() => navigate('pricing')}
                  className="mt-4 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold text-center transition-colors"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 9 — TRUST & TRANSPARENCY STATEMENT */}
      <section className="py-16 border-t border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <h3 className="text-sm font-semibold text-white">Trust & Product Integrity</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed max-w-2xl mx-auto">
              MS Backstage is built on honest software principles. We provide real client-side state engines, authentic scannable QR verification, responsive vector print rendering, and verified data workflows. No fabricated client logos, fake security badges, or simulated uptime metrics.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 10 — FINAL CTA */}
      <section className="py-20 border-t border-slate-900 bg-gradient-to-b from-slate-950 to-slate-900/80 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to Streamline Your Next Gathering?
          </h2>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed max-w-xl mx-auto">
            Test the entire prototype now. Experience on-spot check-in, real QR code generation, and the drag-and-drop badge designer.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('signup')}
              className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-950/60 active:scale-95"
            >
              Create Account Free
            </button>
            <button
              onClick={() => navigate('dashboard')}
              className="px-6 py-3 rounded-xl text-sm font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
            >
              Explore Live Prototype
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 11 — FOOTER */}
      <footer className="pt-12 pb-8 border-t border-slate-900 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white tracking-tight">MS BACKSTAGE</span>
            <span className="text-slate-600">·</span>
            <span>The Event Operating System</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <button onClick={() => navigate('features')} className="hover:text-white transition-colors">Features</button>
            <button onClick={() => navigate('pricing')} className="hover:text-white transition-colors">Pricing</button>
            <button onClick={() => navigate('signin')} className="hover:text-white transition-colors">Sign In</button>
            <span className="text-slate-600 font-mono text-[11px]">[Support Portal — Future Integration]</span>
            <span className="text-slate-600 font-mono text-[11px]">[Terms & Privacy — Future Integration]</span>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 pt-6 border-t border-slate-900/60 text-center text-slate-600 text-[11px]">
          © {new Date().getFullYear()} MS Backstage. Designed with macOS-inspired refinement for premier event organizers.
        </div>
      </footer>
    </div>
  );
};
