'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AppleDock from '@/app/components/navigation/AppleDock';
import BackButton from '@/app/components/ui/BackButton';
import { Check, HelpCircle, ArrowRight, ShieldCheck, Sliders, Sparkles } from 'lucide-react';

export default function PricingPage() {
  const [cadence, setCadence] = useState<'per-event' | 'monthly' | 'annual'>('per-event');
  const [proMaxLimit, setProMaxLimit] = useState<number>(5000);

  const calculateProMaxPrice = (limit: number) => {
    const base = 5000;
    const additional = ((limit - 5000) / 1000) * 1000;
    return `₹${(base + Math.max(0, additional)).toLocaleString('en-IN')}`;
  };

  const pricingPlans = [
    {
      id: 'free',
      name: 'Free Starter',
      price: '₹0',
      period: '15-day trial',
      badge: '15-Day Free Trial',
      description: 'Perfect for small meetups, workshops, and evaluating MS Backstage during your 15-day trial.',
      limit: 'Up to 50 Attendees',
      highlight: false,
      cta: 'Start 15-Day Free Trial',
      href: '/auth/sign-up',
      features: [
        '15-Day Full-Access Free Trial',
        'Up to 50 Attendees per Event',
        'Instant QR Check-In & Check-Out Desk',
        'Basic Badge Printing (Standard Thermal)',
        'Real-Time Attendance Overview',
        'Attendee List CSV Export',
        'Single Desk Operator'
      ]
    },
    {
      id: 'pro',
      name: 'Pro Event',
      price: cadence === 'annual' ? '₹1,600' : cadence === 'monthly' ? '₹2,500' : '₹2,000',
      period: cadence === 'per-event' ? 'per event' : cadence === 'monthly' ? 'per month' : 'per event (billed annually)',
      description: 'Complete high-throughput operational control for medium conferences & summits. Includes all Free features.',
      limit: 'Up to 1,000 Attendees',
      highlight: true,
      badge: '1 Month (30 Days) Validity',
      cta: 'Start Pro Event',
      href: '/auth/sign-up',
      features: [
        'All Free Starter Features Included',
        'Valid for 1 Month (30 Days)',
        'Up to 1,000 Attendees Included',
        'Over 1,000 attendees: ₹20 per extra attendee',
        'Queue-Busting Atomic Spot Registration Desk',
        'Visual Drag-and-Drop Badge Designer Canvas',
        '10 Built-In Badge Templates (A4 & A6 Sheet Print)',
        'Multi-Format Reports (Formula-Safe Excel & PDF)',
        'Up to 5 Concurrent Staff Operators',
        'Full Audit Trail & Reprint Tracking'
      ]
    },
    {
      id: 'pro-max',
      name: 'Pro Max Summit',
      price: calculateProMaxPrice(proMaxLimit),
      period: 'per event',
      description: 'Engineered for national conventions and trade shows. Includes all Free & Pro features.',
      limit: `Up to ${proMaxLimit.toLocaleString('en-IN')} Attendees`,
      highlight: false,
      badge: '1 Month (30 Days) Validity',
      isConfigurable: true,
      cta: 'Launch Pro Max Event',
      href: '/auth/sign-up',
      features: [
        'All Free Starter & Pro Event Features Included',
        'Valid for 1 Month (30 Days)',
        `Up to ${proMaxLimit.toLocaleString('en-IN')} Attendees Included`,
        'Over limit: ₹20 per extra attendee',
        'Unlimited High-Speed Spot Registration Desks',
        'Multi-Track Hall Scanners with Session Access Control',
        'Live Category Telemetry & Attendance Velocity Charts',
        'Batch Excel Import with Intelligent Column Mapping',
        'Priority Support & On-Ground Reliability Assurance',
        'Custom Badge Sizes & Direct Thermal Label Presets'
      ]
    },
    {
      id: 'lifetime',
      name: 'Contact Us / Custom Agreement',
      price: 'Custom',
      period: 'perpetual license',
      description: 'Unlimited capacity, perpetual licensing, and dedicated on-site assistance.',
      limit: 'Limit: 50,000 Attendees',
      highlight: false,
      badge: 'Enterprise SLA',
      cta: 'Contact Sales',
      href: 'mailto:sales@msbackstage.com?subject=Enterprise%20Agreement%20Inquiry%20-%20MS%20Backstage&body=Hello%20Sales%20Team%2C%0A%0AWe%20are%20interested%20in%20the%20Custom%20Agreement%20Enterprise%20Plan%20(50%2C000%2B%20Attendees).%0A%0APlease%20contact%20us%20with%20custom%20SLA%20and%20on-premises%2Fprivate%20cloud%20deployment%20options.%0A%0AThank%20you.',
      features: [
        'Unlimited Attendees & Unlimited Events',
        'Dedicated Custom Tenant Domain & Branding',
        'Perpetual On-Premises or Private Cloud Deployment',
        'Unlimited Concurrent Scanner Operators',
        'Custom SLA, Dedicated Engineering & On-Site Support',
        'Direct Database Integration & Webhook Automation'
      ]
    }
  ];

  return (
    <div className="w-full pb-20">
      <AppleDock variant="public" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <BackButton href="/" label="Back to Overview" className="mb-6" />

        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/40 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-3 shadow-xs">
            <Sliders className="w-3.5 h-3.5" />
            <span>Modular Commercial Licensing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Transparent Pricing Built for Every Scale
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mx-auto">
            Choose the capacity that matches your event size. Clear tiers, zero hidden ticketing surcharges, and comprehensive badge printing tools included.
          </p>

          {/* Configurable Billing Cadence Selector */}
          <div className="mt-8 inline-flex items-center p-1.5 rounded-full bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-inner">
            <button
              onClick={() => setCadence('per-event')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                cadence === 'per-event'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pay Per Event
            </button>
            <button
              onClick={() => setCadence('monthly')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                cadence === 'monthly'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Monthly Agency
            </button>
            <button
              onClick={() => setCadence('annual')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                cadence === 'annual'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Annual Pass</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-mono font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* 4 Plans Pricing Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 flex flex-col justify-between transition-all duration-200 relative ${
                plan.highlight
                  ? 'bg-white dark:bg-slate-900/90 border-2 border-blue-500 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold tracking-wider uppercase shadow-md">
                  {plan.badge}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                </div>

                <div className="mb-2">
                  <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5 font-normal">
                    /{plan.period}
                  </span>
                </div>

                <div className="inline-block px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-[11px] font-semibold text-blue-700 dark:text-blue-300 mb-4">
                  {plan.limit}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  {plan.description}
                </p>

                {/* Interactive Attendee Scale Slider for Pro Max */}
                {plan.isConfigurable && (
                  <div className="mb-6 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[11px] mb-2 font-medium">
                      <span className="text-slate-600 dark:text-slate-400">Scale Capacity:</span>
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                        {proMaxLimit.toLocaleString('en-IN')} Attendees
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5000"
                      max="25000"
                      step="2500"
                      value={proMaxLimit}
                      onChange={(e) => setProMaxLimit(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                      <span>5K</span>
                      <span>15K</span>
                      <span>25K</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2.5 mb-8">
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 leading-tight">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href={plan.href}
                className={`w-full py-2.5 px-4 rounded-full text-xs font-semibold text-center transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                  plan.highlight
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Complete Feature Breakdown Matrix */}
        <div className="mt-16 bg-white dark:bg-slate-900/60 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Complete Feature Breakdown
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Detailed capabilities comparison across all MS Backstage licensing tiers.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  <th className="py-3.5 px-3 font-semibold">Capability</th>
                  <th className="py-3.5 px-3 font-semibold">Free Starter</th>
                  <th className="py-3.5 px-3 font-semibold text-blue-600 dark:text-blue-400">Pro Event (₹2,000)</th>
                  <th className="py-3.5 px-3 font-semibold">Pro Max Summit</th>
                  <th className="py-3.5 px-3 font-semibold">Lifetime Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                <tr>
                  <td className="py-3.5 px-3 font-semibold text-slate-900 dark:text-white">Attendee Capacity</td>
                  <td className="py-3.5 px-3 font-mono">50</td>
                  <td className="py-3.5 px-3 font-mono text-blue-600 dark:text-blue-300 font-bold">1,000</td>
                  <td className="py-3.5 px-3 font-mono">5,000+</td>
                  <td className="py-3.5 px-3 font-mono">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-3 font-semibold text-slate-900 dark:text-white">Interactive Badge Designer</td>
                  <td className="py-3.5 px-3">Basic (1 layout)</td>
                  <td className="py-3.5 px-3 text-emerald-600 dark:text-emerald-400 font-medium">All 25 Templates</td>
                  <td className="py-3.5 px-3 text-emerald-600 dark:text-emerald-400 font-medium">All 25 + Custom Canvas</td>
                  <td className="py-3.5 px-3 text-emerald-600 dark:text-emerald-400 font-medium">Dedicated Engineering</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-3 font-semibold text-slate-900 dark:text-white">Multi-Badge Sheet Print (A4)</td>
                  <td className="py-3.5 px-3 text-slate-400 dark:text-slate-500">—</td>
                  <td className="py-3.5 px-3">4-up &amp; 6-up sheets</td>
                  <td className="py-3.5 px-3">4-up, 6-up + Thermal Roll</td>
                  <td className="py-3.5 px-3">Zero-margin drivers</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-3 font-semibold text-slate-900 dark:text-white">Spot Registration Desk</td>
                  <td className="py-3.5 px-3">Standard Form</td>
                  <td className="py-3.5 px-3">Rapid Atomic Counter</td>
                  <td className="py-3.5 px-3">Rapid Atomic Counter</td>
                  <td className="py-3.5 px-3">Kiosk &amp; Self-Service API</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-3 font-semibold text-slate-900 dark:text-white">Simultaneous Scanners</td>
                  <td className="py-3.5 px-3 font-mono">1 Station</td>
                  <td className="py-3.5 px-3 font-mono">Up to 5 Stations</td>
                  <td className="py-3.5 px-3 font-mono">Unlimited Stations</td>
                  <td className="py-3.5 px-3 font-mono">Hardware Turnstiles</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-3 font-semibold text-slate-900 dark:text-white">Staff Member Seats</td>
                  <td className="py-3.5 px-3 font-mono">1</td>
                  <td className="py-3.5 px-3 font-mono">10</td>
                  <td className="py-3.5 px-3 font-mono">Unlimited</td>
                  <td className="py-3.5 px-3 font-mono">Unlimited + SAML SSO</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-3 font-semibold text-slate-900 dark:text-white">Audit Trail Retention</td>
                  <td className="py-3.5 px-3 font-mono">7 Days</td>
                  <td className="py-3.5 px-3 font-mono">90 Days</td>
                  <td className="py-3.5 px-3 font-mono">3 Years</td>
                  <td className="py-3.5 px-3 font-mono">Permanent &amp; SOC 2</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Custom Terms Box */}
        <div className="mt-12 bg-white dark:bg-slate-900/60 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Need Custom Terms or Purchase Order Invoicing?</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                We support corporate procurement, GST invoicing, custom SLAs, and dedicated technical standby engineers for large-scale conventions.
              </p>
            </div>
          </div>
          <Link
            href="/auth/sign-up"
            className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold border border-slate-700 whitespace-nowrap shadow-sm hover:scale-105 active:scale-95 transition"
          >
            Contact Sales Desk
          </Link>
        </div>
      </div>
    </div>
  );
}
