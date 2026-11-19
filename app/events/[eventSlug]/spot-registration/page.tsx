'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import {
  UserPlus,
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ChevronRight,
  Shield,
  CreditCard,
  Utensils,
  QrCode,
  ArrowLeft,
  Users,
  LayoutDashboard,
} from 'lucide-react';
import { useToast } from '@/app/components/ui/Toast';
import { BackButton } from '@/app/components/ui/BackButton';

interface EventContextInfo {
  organization: { id: string; name: string; slug: string };
  event: { id: string; name: string; slug: string; status: string };
  user: { id: string; email: string };
  effectiveRole: string;
}

interface SpotAttendee {
  id: string;
  registrationNumber: string;
  name: string;
  category: string;
  phoneNumber?: string | null;
  email?: string | null;
  gender?: string | null;
  medicalCouncilNumber?: string | null;
  foodPreference: string;
  paymentStatus: string;
  registrationType: string;
  attendanceStatus: string;
  qrToken: string;
  createdAt: string;
}

const CATEGORY_OPTIONS = [
  'Delegate',
  'Faculty',
  'Postgraduate',
  'Exhibitor',
  'Accompanying',
  'Student',
  'VIP Guest',
  'General',
];

const FOOD_OPTIONS = [
  'Vegetarian',
  'Non-Vegetarian',
  'Jain Food',
  'Vegan',
  'Not Specified',
];

const PAYMENT_OPTIONS = ['Paid', 'Unpaid', 'Complimentary'];

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

export default function SpotRegistrationPage({
  params,
}: {
  params: { eventSlug: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [contextInfo, setContextInfo] = useState<EventContextInfo | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Delegate');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [medicalCouncilNumber, setMedicalCouncilNumber] = useState('');
  const [address, setAddress] = useState('');
  const [foodPreference, setFoodPreference] = useState('Vegetarian');
  const [paymentStatus, setPaymentStatus] = useState('Paid');

  // Operational State
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [capacityExceededInfo, setCapacityExceededInfo] = useState<{
    currentCount: number;
    maxAllowed: number;
    planId: string;
    planName: string;
    isExpired: boolean;
    upgradeRequired?: boolean;
    payExtraAllowed?: boolean;
    extraAttendeePriceInPaise?: number;
  } | null>(null);
  const [buyingExtra, setBuyingExtra] = useState(false);

  // Success State
  const [successAttendee, setSuccessAttendee] = useState<SpotAttendee | null>(null);
  const [copiedRegNo, setCopiedRegNo] = useState(false);

  // Canvas ref for QR code
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Generate unique idempotency key per registration attempt
  const refreshIdempotencyKey = useCallback(() => {
    const key = `spot_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    setIdempotencyKey(key);
  }, []);

  const handlePayForExtraAttendees = async (quantity: number = 25) => {
    if (!contextInfo) return;
    setBuyingExtra(true);

    try {
      // 1. Create Order
      const res = await fetch(`/api/organizations/${contextInfo.organization.id}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_extra_attendees_order',
          quantity,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to initialize extra attendee payment.');
        setBuyingExtra(false);
        return;
      }

      // 2. Open Razorpay Checkout
      const loadScript = () => {
        return new Promise<boolean>((resolve) => {
          if ((window as any).Razorpay) return resolve(true);
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const loaded = await loadScript();
      const Razorpay = (window as any).Razorpay;

      if (loaded && Razorpay && data.order && data.keyId) {
        const rzp = new Razorpay({
          key: data.keyId,
          amount: data.order.amount,
          currency: data.order.currency,
          name: 'MS Backstage',
          description: `Add +${quantity} Attendees (₹20/each)`,
          image: '/msfav.png',
          order_id: data.order.id,
          theme: { color: '#10b981' },
          handler: async function (resp: any) {
            try {
              const verifyRes = await fetch(`/api/organizations/${contextInfo.organization.id}/subscription`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'verify_extra_attendees_payment',
                  quantity,
                  razorpayOrderId: resp.razorpay_order_id,
                  razorpayPaymentId: resp.razorpay_payment_id,
                  razorpaySignature: resp.razorpay_signature,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.status === 'ok') {
                toast.success(`Payment verified! Added +${quantity} attendees capacity.`);
                setCapacityExceededInfo(null);
                setFormError(null);
              } else {
                toast.error('Payment verification failed.');
              }
            } catch {
              toast.error('Error verifying payment.');
            } finally {
              setBuyingExtra(false);
            }
          },
          modal: {
            ondismiss: () => setBuyingExtra(false),
          },
        });
        rzp.open();
      } else {
        toast.error('Razorpay failed to load.');
        setBuyingExtra(false);
      }
    } catch {
      toast.error('Network error initiating payment.');
      setBuyingExtra(false);
    }
  };

  // Fetch Event Context
  const loadContext = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${params.eventSlug}`);
      if (res.status === 401) {
        router.push('/auth/sign-in');
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAuthError(data.error || 'Failed to authorize event context');
        setInitialLoading(false);
        return;
      }
      const data = await res.json();
      setContextInfo(data);
      refreshIdempotencyKey();
    } catch {
      setAuthError('Network error connecting to event services.');
    } finally {
      setInitialLoading(false);
    }
  }, [params.eventSlug, router, refreshIdempotencyKey]);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  // Focus name field on load
  useEffect(() => {
    if (!successAttendee && !initialLoading) {
      nameInputRef.current?.focus();
    }
  }, [successAttendee, initialLoading]);

  // Render QR Code onto Canvas when attendee is confirmed
  useEffect(() => {
    if (successAttendee?.qrToken && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        successAttendee.qrToken,
        {
          width: 160,
          margin: 1,
          color: { dark: '#0f172a', light: '#ffffff' },
          errorCorrectionLevel: 'M',
        },
        (err) => {
          if (err) console.error('Failed to generate sticker QR code:', err);
        }
      );
    }
  }, [successAttendee]);

  // Client Validation
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = 'Full name is required.';
    } else if (trimmedName.length > 200) {
      errors.name = 'Name must be 200 characters or fewer.';
    }

    const trimmedPhone = phoneNumber.trim();
    if (trimmedPhone && !/^[0-9+\s-]{8,15}$/.test(trimmedPhone)) {
      errors.phoneNumber = 'Enter a valid phone number (8-15 digits).';
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedEmail)) {
      errors.email = 'Enter a valid email address.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !contextInfo) return;

    setFormError(null);
    if (!validate()) {
      toast.warning('Please review and correct the highlighted fields.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        category,
        phoneNumber: phoneNumber.trim() || null,
        email: email.trim().toLowerCase() || null,
        gender: gender || null,
        medicalCouncilNumber: medicalCouncilNumber.trim() || null,
        address: address.trim() || null,
        foodPreference,
        paymentStatus,
        idempotencyKey,
      };

      const res = await fetch(`/api/events/${contextInfo.event.id}/spot-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          const mapped: Record<string, string> = {};
          Object.keys(data.details).forEach((k) => {
            if (Array.isArray(data.details[k])) {
              mapped[k] = data.details[k][0];
            }
          });
          setFieldErrors(mapped);
        }
        const errorMsg = data.error || 'Failed to complete spot registration.';
        setFormError(errorMsg);
        if (data.code === 'CAPACITY_LIMIT_EXCEEDED') {
          setCapacityExceededInfo(data.details || null);
        }
        toast.error(errorMsg);
        return;
      }

      setCapacityExceededInfo(null);
      setSuccessAttendee(data.attendee);
      toast.success(`Spot registration complete: ${data.attendee.registrationNumber} (${data.attendee.name})`);
    } catch {
      const errorMsg = 'Network error submitting spot registration. Please try again.';
      setFormError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form to register next attendee
  const handleRegisterNext = () => {
    setName('');
    setCategory('Delegate');
    setPhoneNumber('');
    setEmail('');
    setGender('');
    setMedicalCouncilNumber('');
    setAddress('');
    setFoodPreference('Vegetarian');
    setPaymentStatus('Paid');
    setFieldErrors({});
    setFormError(null);
    setSuccessAttendee(null);
    setCopiedRegNo(false);
    refreshIdempotencyKey();
  };

  // Copy registration number to clipboard
  const handleCopyRegNo = () => {
    if (!successAttendee?.registrationNumber) return;
    navigator.clipboard.writeText(successAttendee.registrationNumber);
    setCopiedRegNo(true);
    setTimeout(() => setCopiedRegNo(false), 2000);
  };

  // Print badge sticker
  const handlePrint = () => {
    window.print();
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-sans">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Initializing Spot Registration Desk...</p>
        </div>
      </div>
    );
  }

  if (authError || !contextInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4 font-sans">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-6 rounded-xl border border-red-200 dark:border-red-900/50 shadow-sm text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Access Restricted</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{authError || 'Unauthorized access'}</p>
          <Link
            href={`/events/${params.eventSlug}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Event Overview
          </Link>
        </div>
      </div>
    );
  }

  const { event, organization, effectiveRole, user } = contextInfo;

  return (
    <div className="pb-16 font-sans">
      {/* Top Action Bar with Top-Left Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-slate-200 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <BackButton href={`/events/${event.slug}`} label="Back to Event" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20 capitalize">
              {(effectiveRole || 'Staff').replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Desk Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {!successAttendee ? (
          /* REGISTRATION FORM VIEW */
          <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-linear-to-r from-indigo-50/50 to-white dark:from-slate-900/80 dark:to-slate-900/40 flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  On-Site Spot Registration
                </h1>
              </div>
            </div>

            {formError && (
              <div className="mx-6 mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex flex-col gap-3 text-red-800 dark:text-red-300 text-sm">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold text-base mb-0.5">Attendee Limit Reached</div>
                    <div>{formError}</div>
                  </div>
                </div>

                {/* If paid plan (Pro/Pro Max) exceeded: allow instant +25, +50, +100 attendee purchase via Razorpay at ₹20/each */}
                {capacityExceededInfo?.payExtraAllowed && (
                  <div className="pt-3 border-t border-red-200 dark:border-red-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 dark:bg-slate-900/60 p-3 rounded-lg">
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        Need extra attendees? ₹20 per attendee
                      </span>
                      Pay with Razorpay to immediately unlock additional capacity for this event.
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handlePayForExtraAttendees(25)}
                        disabled={buyingExtra}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {buyingExtra ? 'Processing…' : '+25 Attendees (₹500)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePayForExtraAttendees(50)}
                        disabled={buyingExtra}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {buyingExtra ? 'Processing…' : '+50 Attendees (₹1,000)'}
                      </button>
                    </div>
                  </div>
                )}

                {/* If Free plan: prompt upgrade */}
                {capacityExceededInfo?.upgradeRequired && (
                  <div className="pt-3 border-t border-red-200 dark:border-red-900/60 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Free Starter plan is strictly capped at 50 attendees.
                    </span>
                    <Link
                      href={`/organizations/${organization.slug}/settings`}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition"
                    >
                      Upgrade Plan
                    </Link>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* PRIMARY ATTENDEE DETAILS */}
              <div className="space-y-4">
                <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Delegate Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      ref={nameInputRef}
                      type="text"
                      required
                      placeholder="e.g. Surya Kumar"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full rounded-lg border px-3.5 py-2.5 text-sm transition focus:outline-none focus:ring-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${
                        fieldErrors.name
                          ? 'border-red-300 focus:ring-red-500 bg-red-50/30'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500'
                      }`}
                    />
                    {fieldErrors.name && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>
                    )}
                  </div>

                  {/* Category Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Registration Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Medical Council Number */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Medical Council Reg # (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MCI-2018-98421"
                      value={medicalCouncilNumber}
                      onChange={(e) => setMedicalCouncilNumber(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Mobile / WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className={`w-full rounded-lg border px-3.5 py-2.5 text-sm transition focus:outline-none focus:ring-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 ${
                        fieldErrors.phoneNumber
                          ? 'border-red-300 focus:ring-red-500 bg-red-50/30'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500'
                      }`}
                    />
                    {fieldErrors.phoneNumber && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.phoneNumber}</p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. doctor@hospital.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full rounded-lg border px-3.5 py-2.5 text-sm transition focus:outline-none focus:ring-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 ${
                        fieldErrors.email
                          ? 'border-red-300 focus:ring-red-500 bg-red-50/30'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500'
                      }`}
                    />
                    {fieldErrors.email && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>
                    )}
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Gender</option>
                      {GENDER_OPTIONS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Address */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Address (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 123 Healthcare Ave, Suite 400, Chennai, India"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* OPERATIONAL / SPOT PREFERENCES */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Payment & On-Site Preferences
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Payment Status */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      Payment Status
                    </label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {PAYMENT_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Food Preference */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Utensils className="w-3.5 h-3.5 text-slate-400" />
                      Meal Preference
                    </label>
                    <select
                      value={foodPreference}
                      onChange={(e) => setFoodPreference(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {FOOD_OPTIONS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono">Enter</kbd> to submit
                </p>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-full text-sm font-bold shadow-md shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Registering Attendee...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Register Attendee
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* SUCCESS CONFIRMATION & BADGE PREVIEW */
          <div className="space-y-6">
            {/* Top Success Banner */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-emerald-950 dark:text-emerald-200">
                  Spot Registration Confirmed!
                </h2>
                <p className="text-sm text-emerald-800 dark:text-emerald-300 mt-0.5">
                  Attendee has been issued a sequential registration number and entered into the directory.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border border-emerald-300 dark:border-emerald-700/60 flex items-center gap-3 shadow-xs">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Registration Number:
                    </span>
                    <span className="text-xl font-mono font-bold text-indigo-700 dark:text-indigo-400 tracking-wide">
                      {successAttendee.registrationNumber}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyRegNo}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition"
                      title="Copy registration number"
                    >
                      {copiedRegNo ? (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                    <Shield className="w-3.5 h-3.5" />
                    Spot Registered
                  </span>
                </div>
              </div>
            </div>

            {/* STICKER / BADGE CARD (PREVIEW & PRINTABLE) */}
            <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 print:border-none print:shadow-none print:p-0">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6 print:hidden">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Spot Sticker / Badge Layout Preview
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Spot Sticker
                </button>
              </div>

              {/* Printable Sticker Wrapper */}
              <div className="flex justify-center">
                <div
                  id="spot-sticker-printable"
                  className="w-80 sm:w-96 p-6 rounded-xl border-2 border-dashed border-slate-300 bg-linear-to-b from-white to-slate-50 shadow-inner flex flex-col items-center text-center relative print:border-none print:shadow-none print:w-full"
                >
                  {/* Event Badge Header */}
                  <div className="text-xs uppercase tracking-widest font-bold text-indigo-600 mb-1">
                    {event.name}
                  </div>

                  {/* Attendee Name */}
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight mb-1">
                    {successAttendee.name}
                  </div>

                  {/* Category Pill */}
                  <div className="inline-block px-3 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white mb-4">
                    {successAttendee.category}
                  </div>

                  {/* QR Code Canvas */}
                  <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-xs mb-3">
                    <canvas ref={canvasRef} className="w-40 h-40 block" />
                  </div>

                  {/* Prominent Reg No */}
                  <div className="font-mono text-base font-bold text-indigo-700 tracking-wider">
                    {successAttendee.registrationNumber}
                  </div>

                  {/* Meal / Medical Council Info */}
                  <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-2">
                    <span>Meal: {successAttendee.foodPreference}</span>
                    {successAttendee.medicalCouncilNumber && (
                      <>
                        <span>•</span>
                        <span>MCI: {successAttendee.medicalCouncilNumber}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION FOOTER */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4 print:hidden">
              <Link
                href={`/events/${event.slug}/attendees`}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
              >
                <Users className="w-4 h-4 text-slate-500" />
                View in Attendees Directory
              </Link>

              <button
                type="button"
                onClick={handleRegisterNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition shadow-xs"
              >
                <RotateCcw className="w-4 h-4" />
                Register Next Attendee
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Print Specific CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #spot-sticker-printable,
          #spot-sticker-printable * {
            visibility: visible;
          }
          #spot-sticker-printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 10mm;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
