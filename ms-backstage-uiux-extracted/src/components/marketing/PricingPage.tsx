import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { pricingPlans } from '../../lib/mock-data';
import { Check, HelpCircle, ArrowRight, ShieldCheck, Sliders } from 'lucide-react';
import { BackButton } from '../navigation/BackButton';

export const PricingPage: React.FC = () => {
  const { navigate, addToast } = useApp();
  const [cadence, setCadence] = useState<'per-event' | 'monthly' | 'annual'>('per-event');
  const [proMaxLimit, setProMaxLimit] = useState<number>(5000);

  const calculateProMaxPrice = (limit: number) => {
    // Dynamic price calculation based on configurable attendee capacity
    const base = 7500;
    const additional = ((limit - 5000) / 1000) * 1200;
    return `₹${(base + Math.max(0, additional)).toLocaleString('en-IN')}`;
  };

  const handleSelectPlan = (planId: string, planName: string) => {
    if (planId === 'free') {
      navigate('signup');
    } else if (planId === 'lifetime') {
      addToast({
        type: 'info',
        title: 'Sales Inquiry Registered',
        message: 'A dedicated enterprise specialist contact modal is triggered in production.'
      });
    } else {
      addToast({
        type: 'info',
        title: `Plan ${planName} Selected`,
        message: 'Frontend prototype mode: No payment gateway is attached during Phase 1.'
      });
      navigate('orgs-subscription');
    }
  };

  return (
    <div className="w-full pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <BackButton label="Back to Overview" targetRoute="home" className="mb-6" />

        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/50 border border-indigo-800/40 text-xs font-semibold text-indigo-400 mb-3">
            <Sliders className="w-3.5 h-3.5" />
            <span>Modular Commercial Licensing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Transparent Pricing Built for Every Scale
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto">
            Choose the capacity that matches your event size. Clear tiers, zero hidden ticketing surcharges, and comprehensive badge printing tools included.
          </p>

          {/* Configurable Billing Cadence Selector */}
          <div className="mt-8 inline-flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 shadow-inner">
            <button
              onClick={() => setCadence('per-event')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                cadence === 'per-event' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Per Single Event
            </button>
            <button
              onClick={() => setCadence('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                cadence === 'monthly' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Subscription
            </button>
            <button
              onClick={() => setCadence('annual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                cadence === 'annual' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Annual Enterprise Pass
            </button>
          </div>

          <p className="mt-2 text-[11px] text-slate-400 font-mono">
            *Pricing basis currently displayed for: {cadence === 'per-event' ? 'Single Event License' : cadence === 'monthly' ? 'Monthly Multi-Event' : 'Annual Consolidated Pass'}
          </p>
        </div>

        {/* 4 Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {pricingPlans.map((plan) => {
            const isProMax = plan.id === 'pro-max';
            const price = isProMax ? calculateProMaxPrice(proMaxLimit) : plan.priceDisplay;

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all duration-200 border ${
                  plan.isPopular
                    ? 'bg-slate-900/90 border-indigo-500 shadow-2xl shadow-indigo-950/60 ring-1 ring-indigo-500/50'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-[10px] font-bold text-white uppercase tracking-wider shadow">
                    Most Popular
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white tracking-tight">{plan.name}</h3>
                    <span className="text-xs font-mono text-indigo-400 font-medium">
                      {isProMax ? `${proMaxLimit.toLocaleString()} Pax` : plan.capacityDisplay}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-400 min-h-[32px] leading-relaxed">
                    {plan.targetAudience}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white font-mono tabular-nums">{price}</span>
                      {plan.priceDisplay !== 'Custom' && (
                        <span className="text-xs text-slate-400">
                          {cadence === 'per-event' ? '/ event' : cadence === 'monthly' ? '/ month' : '/ year'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{plan.priceSubtext}</p>
                  </div>

                  {/* Configurable Capacity Slider for Pro Max */}
                  {isProMax && (
                    <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-400 font-medium">Configure Capacity</span>
                        <span className="font-mono text-indigo-300 font-bold">{proMaxLimit.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="2000"
                        max="15000"
                        step="1000"
                        value={proMaxLimit}
                        onChange={(e) => setProMaxLimit(parseInt(e.target.value, 10))}
                        className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">Scale between 2,000 and 15,000 attendees</span>
                    </div>
                  )}

                  {/* Feature Lists */}
                  <div className="mt-6 space-y-4">
                    <div>
                      <h4 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                        Badge & Designer
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {plan.features.badges.map((f, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                        Operations & Counter
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {plan.features.operations.map((f, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => handleSelectPlan(plan.id, plan.name)}
                    className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 ${
                      plan.isPopular
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/60'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Deep Feature Comparison Matrix */}
        <div className="mt-16 rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800">
          <h3 className="text-xl font-bold text-white mb-2">Detailed Plan Comparison</h3>
          <p className="text-xs text-slate-400 mb-6">
            Everything you need to know about attendance thresholds, thermal printers, and security permissions.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-3 px-3 font-semibold">Capability</th>
                  <th className="py-3 px-3 font-semibold">Free</th>
                  <th className="py-3 px-3 font-semibold text-indigo-400">Pro (₹2,000)</th>
                  <th className="py-3 px-3 font-semibold">Pro Max</th>
                  <th className="py-3 px-3 font-semibold">Lifetime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="py-3 px-3 font-medium text-white">Attendee Capacity</td>
                  <td className="py-3 px-3 font-mono">50</td>
                  <td className="py-3 px-3 font-mono text-indigo-300 font-bold">1,000</td>
                  <td className="py-3 px-3 font-mono">5,000+</td>
                  <td className="py-3 px-3 font-mono">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium text-white">Interactive Badge Designer</td>
                  <td className="py-3 px-3">Basic (1 layout)</td>
                  <td className="py-3 px-3 text-emerald-400 font-medium">All 10 Templates</td>
                  <td className="py-3 px-3 text-emerald-400 font-medium">All 10 + Custom Canvas</td>
                  <td className="py-3 px-3 text-emerald-400 font-medium">Dedicated Engineering</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium text-white">Multi-Badge Sheet Print (A4)</td>
                  <td className="py-3 px-3 text-slate-500">—</td>
                  <td className="py-3 px-3">6-up & 8-up sheets</td>
                  <td className="py-3 px-3">6-up, 8-up + Thermal Roll</td>
                  <td className="py-3 px-3">High-speed drivers</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium text-white">On-Spot Registration Desk</td>
                  <td className="py-3 px-3">Manual Form</td>
                  <td className="py-3 px-3">Rapid Counter Mode</td>
                  <td className="py-3 px-3">Rapid Counter Mode</td>
                  <td className="py-3 px-3">Kiosk & Self-Service API</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium text-white">Simultaneous Scanners</td>
                  <td className="py-3 px-3 font-mono">1 Station</td>
                  <td className="py-3 px-3 font-mono">Up to 4 Stations</td>
                  <td className="py-3 px-3 font-mono">Unlimited Stations</td>
                  <td className="py-3 px-3 font-mono">Hardware Turnstiles</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium text-white">Staff Member Seats</td>
                  <td className="py-3 px-3 font-mono">1</td>
                  <td className="py-3 px-3 font-mono">10</td>
                  <td className="py-3 px-3 font-mono">Unlimited</td>
                  <td className="py-3 px-3 font-mono">Unlimited + SAML SSO</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium text-white">Audit Trail Retention</td>
                  <td className="py-3 px-3 font-mono">7 Days</td>
                  <td className="py-3 px-3 font-mono">90 Days</td>
                  <td className="py-3 px-3 font-mono">3 Years</td>
                  <td className="py-3 px-3 font-mono">Permanent & SOC 2</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Prototype Transparency Note */}
        <div className="mt-8 p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 text-center">
          <ShieldCheck className="w-4 h-4 text-indigo-400 inline-block mr-1.5 -mt-0.5" />
          <span>Notice: Commercial licensing terms will be activated during Phase 3 backend integration. No live transactions or credit card charges occur in this design prototype.</span>
        </div>
      </div>
    </div>
  );
};
