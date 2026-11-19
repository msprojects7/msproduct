'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Check, ShieldCheck, Zap, Sparkles, Building2, AlertCircle } from 'lucide-react';
import { PLAN_TIERS, PlanTier } from '@/lib/payments/plans';
import { useToast } from '@/app/components/ui/Toast';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  currentPlanId?: string;
  subscription?: {
    planId: string;
    planName: string;
    status: string;
    billingCycle: string;
    validityDuration?: string;
    activatedAt: string | null;
    expiresAt: string | null;
    isExpiringSoon: boolean;
    daysRemaining: number;
    isExpired: boolean;
    extraAttendeesQuota?: number;
    totalMaxAttendees?: number;
    extraAttendeePriceInPaise?: number;
  } | null;
  triggerRef?: React.RefObject<HTMLElement>;
}

export function SubscriptionModal({
  isOpen,
  onClose,
  organizationId,
  currentPlanId = 'free',
  subscription,
  triggerRef,
}: SubscriptionModalProps) {
  const { toast } = useToast();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [extraAttendeeCount, setExtraAttendeeCount] = useState<number>(50);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    setTimeout(() => closeButtonRef.current?.focus(), 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      triggerRef?.current?.focus();
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(false);
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSelectPlan = async (plan: PlanTier) => {
    if (plan.id === currentPlanId) return;

    if (plan.id === 'lifetime') {
      window.location.href =
        'mailto:sales@msbackstage.com?subject=Lifetime%20Enterprise%20Agreement%20Inquiry%20-%20MS%20Backstage&body=Hello%20Sales%20Team%2C%0A%0AWe%20would%20like%20to%20discuss%20the%20Lifetime%20Enterprise%20Plan%20for%20our%20organization.%0A%0AOrganization%20ID%3A%20' +
        encodeURIComponent(organizationId) +
        '%0ACapacity%20Required%3A%2050%2C000%2B%20Attendees%0A%0APlease%20provide%20a%20custom%20commercial%20quote%20and%20deployment%20details.%0A%0AThank%20you.';
      return;
    }

    setLoadingPlan(plan.id);
    setNotice(null);

    try {
      const res = await fetch(`/api/organizations/${organizationId}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_order',
          targetPlanId: plan.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'ALREADY_ON_PLAN') {
          toast.info(`You already have an active ${plan.name} subscription.`);
          onClose();
          return;
        }
        setNotice(data.error || 'Failed to initialize plan checkout.');
        return;
      }

      const isLoaded = await loadRazorpayScript();
      const RazorpayConstructor = (window as any).Razorpay;

      if (isLoaded && RazorpayConstructor && data.order && data.keyId) {
        const options = {
          key: data.keyId,
          amount: data.order.amount,
          currency: data.order.currency,
          name: 'MS Backstage',
          description: `Subscription Upgrade to ${plan.name}`,
          image: '/msfav.png',
          order_id: data.order.id,
          prefill: {
            name: 'MS Backstage Admin',
            email: 'admin@msbackstage.internal',
            contact: '+919999999999',
          },
          theme: {
            color: document.documentElement.classList.contains('dark') ? '#2563eb' : '#4f46e5',
            backdrop_color: document.documentElement.classList.contains('dark') ? 'rgba(15, 23, 42, 0.85)' : 'rgba(15, 23, 42, 0.6)',
          },
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch(`/api/organizations/${organizationId}/subscription`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'verify_payment',
                  targetPlanId: plan.id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.status === 'ok') {
                const activePlanName = verifyData.planName || plan.name;
                toast.success(`Payment successful! Your organization is now upgraded to ${activePlanName}.`);
                onClose();
                setTimeout(() => {
                  window.location.reload();
                }, 1500);
              } else {
                toast.error('Payment verification failed. Please contact support.');
                setNotice('Payment verification failed. Please contact support.');
              }
            } catch {
              toast.error('Network error while verifying payment.');
              setNotice('Network error while verifying payment.');
            }
          },
          modal: {
            ondismiss: function () {
              setLoadingPlan(null);
            },
          },
        };

        const rzp = new RazorpayConstructor(options);
        rzp.on('payment.failed', function (resp: any) {
          setNotice(resp.error?.description || 'Payment failed or was cancelled.');
        });
        rzp.open();
      } else {
        setNotice('Razorpay Checkout failed to initialize. Please check your network connection.');
      }
    } catch {
      setNotice('Network error while processing subscription request.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleBuyExtraAttendees = async (quantity: number) => {
    if (quantity <= 0) return;
    setLoadingPlan('extra_attendees');
    setNotice(null);

    try {
      const res = await fetch(`/api/organizations/${organizationId}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_extra_attendees_order',
          quantity,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setNotice(data.error || 'Failed to initialize extra attendees payment.');
        return;
      }

      const isLoaded = await loadRazorpayScript();
      const RazorpayConstructor = (window as any).Razorpay;

      if (isLoaded && RazorpayConstructor && data.order && data.keyId) {
        const options = {
          key: data.keyId,
          amount: data.order.amount,
          currency: data.order.currency,
          name: 'MS Backstage',
          description: `Extra Attendee Quota: +${quantity} Attendees (₹20/each)`,
          image: '/msfav.png',
          order_id: data.order.id,
          prefill: {
            name: 'MS Backstage Admin',
            email: 'admin@msbackstage.internal',
            contact: '+919999999999',
          },
          theme: {
            color: '#10b981',
            backdrop_color: 'rgba(15, 23, 42, 0.75)',
          },
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch(`/api/organizations/${organizationId}/subscription`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'verify_extra_attendees_payment',
                  quantity,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.status === 'ok') {
                toast.success(`Payment successful! Added ${quantity} extra attendees capacity to your workspace.`);
                onClose();
                setTimeout(() => {
                  window.location.reload();
                }, 1500);
              } else {
                toast.error('Payment verification failed for extra attendees.');
                setNotice('Payment verification failed for extra attendees.');
              }
            } catch {
              toast.error('Network error while verifying payment.');
              setNotice('Network error while verifying payment.');
            }
          },
          modal: {
            ondismiss: function () {
              setLoadingPlan(null);
            },
          },
        };

        const rzp = new RazorpayConstructor(options);
        rzp.on('payment.failed', function (resp: any) {
          setNotice(resp.error?.description || 'Payment failed or was cancelled.');
        });
        rzp.open();
      } else {
        setNotice('Razorpay Checkout failed to initialize. Please check your network connection.');
      }
    } catch {
      setNotice('Network error while processing extra attendee payment.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const planList = Object.values(PLAN_TIERS);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscription-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs transition-opacity animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-5xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="subscription-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                Subscription Plans &amp; Entitlements
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Scale your event capacity with high-speed spot desks, thermal badges, and exports.
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Banner */}
        {notice && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{notice}</span>
          </div>
        )}

        {/* Plans Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {planList.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            const isPopular = plan.popular;

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-5 flex flex-col justify-between transition-all duration-150 ${
                  isCurrent
                    ? 'border-2 border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 shadow-xs'
                    : isPopular
                    ? 'border-2 border-indigo-500 bg-white dark:bg-slate-850 dark:bg-slate-900 shadow-md shadow-indigo-500/5'
                    : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-xs">
                    Popular
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{plan.name}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-full">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="mb-2">
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {plan.priceFormatted}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-normal ml-1">
                      / {plan.billingUnit}
                    </span>
                  </div>

                  {/* Plan Validity Duration */}
                  <div className="mb-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800/60 text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                    <span>Validity:</span>
                    <span className="font-bold">{plan.validityDuration}</span>
                  </div>

                  <div className="mb-3 px-2 py-1 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700/60 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Limit: <span className="text-blue-600 dark:text-blue-400 font-bold">{plan.maxAttendees.toLocaleString()} Attendees</span>
                    {plan.extraAttendeePriceInPaise ? (
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                        Over limit: ₹20 / extra attendee
                      </span>
                    ) : null}
                  </div>

                  {isCurrent && subscription?.expiresAt && (
                    <div className="mb-3 p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span>Started:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {subscription.activatedAt
                            ? new Date(subscription.activatedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })
                            : 'Active'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span>Expires:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {new Date(subscription.expiresAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </span>
                      </div>
                      <div className="pt-1 border-t border-blue-100 dark:border-blue-900/40 flex items-center justify-between font-bold">
                        <span className="text-blue-700 dark:text-blue-300">Remaining:</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-md ${
                            subscription.daysRemaining <= 7
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                              : 'bg-blue-100 dark:bg-blue-900/80 text-blue-800 dark:text-blue-200'
                          }`}
                        >
                          {subscription.daysRemaining} {subscription.daysRemaining === 1 ? 'day' : 'days'} left
                        </span>
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 leading-relaxed min-h-[32px]">
                    {plan.description}
                  </p>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isCurrent || Boolean(loadingPlan)}
                  className={`w-full py-2.5 px-3 rounded-full text-xs font-semibold transition shadow-2xs flex items-center justify-center gap-1.5 ${
                    isCurrent
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-default'
                      : isPopular
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      : 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white'
                  }`}
                >
                  {loadingPlan === plan.id && (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {isCurrent ? 'Current Plan' : plan.ctaLabel}
                </button>
              </div>
            );
          })}
        </div>

        {/* Extra Attendees On-Demand Capacity Purchase (Pro & Pro Max users) */}
        {currentPlanId !== 'free' && (
          <div className="mx-6 mb-6 p-4 rounded-2xl bg-linear-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Capacity Addon
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                  ₹20 / extra attendee
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Need more than {currentPlanId === 'pro' ? '1,000' : '5,000'} attendees?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
                Add instant attendee quota to your active event roster. Extra capacity never expires during your plan validity.
                {subscription?.extraAttendeesQuota ? (
                  <span className="block font-semibold text-emerald-700 dark:text-emerald-300 mt-0.5">
                    Currently purchased extra quota: +{subscription.extraAttendeesQuota.toLocaleString()} attendees.
                  </span>
                ) : null}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-xs">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Attendees:</label>
                <select
                  value={extraAttendeeCount}
                  onChange={(e) => setExtraAttendeeCount(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value={25} className="dark:bg-slate-900">25 (₹500)</option>
                  <option value={50} className="dark:bg-slate-900">50 (₹1,000)</option>
                  <option value={100} className="dark:bg-slate-900">100 (₹2,000)</option>
                  <option value={250} className="dark:bg-slate-900">250 (₹5,000)</option>
                  <option value={500} className="dark:bg-slate-900">500 (₹10,000)</option>
                  <option value={1000} className="dark:bg-slate-900">1,000 (₹20,000)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleBuyExtraAttendees(extraAttendeeCount)}
                disabled={loadingPlan === 'extra_attendees'}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loadingPlan === 'extra_attendees' ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                Pay ₹{(extraAttendeeCount * 20).toLocaleString('en-IN')} with Razorpay
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
