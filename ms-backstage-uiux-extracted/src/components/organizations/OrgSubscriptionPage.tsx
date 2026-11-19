import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../navigation/BackButton';
import { pricingPlans } from '../../lib/mock-data';
import { CreditCard, Check, ArrowRight, ShieldCheck, Sparkles, Building2 } from 'lucide-react';

export const OrgSubscriptionPage: React.FC = () => {
  const { currentOrg, updateOrganization, addToast } = useApp();
  const [selectedPlanId, setSelectedPlanId] = useState(currentOrg.plan.toLowerCase().replace(/\s+/g, '-'));

  const handleApplyPlan = (plan: typeof pricingPlans[0]) => {
    updateOrganization(currentOrg.id, { plan: plan.name as any });
    setSelectedPlanId(plan.id);
    addToast({
      type: 'success',
      title: 'Plan Updated',
      message: `${currentOrg.name} is now allocated to the ${plan.name} tier.`
    });
  };

  return (
    <div className="w-full pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <BackButton label="Back to Settings" targetRoute="orgs-settings" />
            <div className="pt-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Plan & Licensing Tiers</h1>
              <p className="text-xs text-slate-400">
                {currentOrg.name} · Current Active Tier: <span className="font-mono text-indigo-400 font-bold">{currentOrg.plan}</span>
              </p>
            </div>
          </div>
        </div>

        {/* ACTIVE PLAN BANNER */}
        <div className="rounded-3xl glass-panel p-6 border border-indigo-500/40 bg-indigo-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-950/60">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-indigo-300 uppercase tracking-wider">Active Subscription</span>
              <h3 className="text-xl font-bold text-white tracking-tight">{currentOrg.name} ({currentOrg.plan})</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Up to 5,000 attendees per event · Full interactive badge designer · Unlimited staff turnstile scanners
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-xs font-mono font-semibold">
              ACTIVE LICENSE
            </span>
          </div>
        </div>

        {/* PLAN CARDS FOR SWITCHING */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pricingPlans.map(plan => {
            const isCurrent = currentOrg.plan.toLowerCase().includes(plan.name.toLowerCase());
            return (
              <div
                key={plan.id}
                className={`p-6 rounded-3xl glass-panel border flex flex-col justify-between transition-all ${
                  isCurrent ? 'border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500/50' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-white">{plan.name}</h4>
                    {isCurrent && (
                      <span className="text-[10px] text-indigo-300 font-mono bg-indigo-900/60 px-2 py-0.5 rounded">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold font-mono text-white mt-3">{plan.priceDisplay}</p>
                  <p className="text-xs text-indigo-400 font-mono mt-0.5">{plan.capacityDisplay}</p>
                  <p className="text-xs text-slate-400 mt-2 min-h-[32px]">{plan.targetAudience}</p>

                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-1.5 text-xs text-slate-300">
                    {plan.features.badges.slice(0, 2).map((f, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-[11px]">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800">
                  <button
                    disabled={isCurrent}
                    onClick={() => handleApplyPlan(plan)}
                    className={`w-full py-2 rounded-xl text-xs font-semibold transition-all ${
                      isCurrent
                        ? 'bg-slate-800 text-slate-400 cursor-default'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95'
                    }`}
                  >
                    {isCurrent ? 'Current Allocated Plan' : `Allocate to ${plan.name}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Prototype Phase Notice */}
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 text-center">
          <ShieldCheck className="w-4 h-4 text-indigo-400 inline-block mr-1.5 -mt-0.5" />
          <span>Frontend Prototype Notice: Subscription allocation changes organization state locally. Real Stripe/Razorpay billing occurs post-Phase 2 review.</span>
        </div>

      </div>
    </div>
  );
};
