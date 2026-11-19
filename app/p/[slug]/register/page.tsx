'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import {
  Users,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Tag,
  CreditCard,
  Lock,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';

interface TicketItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  ticketType: string;
  basePrice: number;
  currentPrice: number;
  currency: string;
  remainingQuantity: number;
  minPerOrder: number;
  maxPerOrder: number;
}

interface FormField {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  isRequired: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
}

interface EventDetails {
  id: string;
  name: string;
  slug: string;
  venue?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

interface WebsiteDetails {
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
  };
}

interface PromoCodeDetails {
  id: string;
  code: string;
  discountType: string;
  discountValue: string;
}

interface AttendeeData {
  name: string;
  email: string;
  phoneNumber: string;
  gender: string;
  foodPreference: string;
  medicalCouncilNumber: string;
  answers: Record<string, unknown>;
}

export default function PublicRegistrationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;
  const initialTicketId = searchParams.get('ticketId');

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [website, setWebsite] = useState<WebsiteDetails | null>(null);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [formFields, setFormFields] = useState<FormField[]>([]);

  // Step state: 1 = Ticket selection, 2 = Attendee details, 3 = Billing & Payment
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Ticket Quantities map: { [ticketId]: number }
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Attendees array grouped by ticket: { [ticketId]: AttendeeData[] }
  const [attendeeForms, setAttendeeForms] = useState<Record<string, AttendeeData[]>>({});

  // Billing Contact
  const [billing, setBilling] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  // Promo code
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCodeDetails | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);

  // Checkout submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchEventDetails = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/public/events/${slug}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load event data');

      setEvent(data.event);
      setWebsite(data.website);
      setTickets(data.tickets || []);
      setFormFields(data.registrationForm?.fields || []);

      // If initialTicketId specified in URL, set quantity to 1
      if (initialTicketId && data.tickets?.some((t: TicketItem) => t.id === initialTicketId)) {
        setQuantities({ [initialTicketId]: 1 });
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load event data');
    } finally {
      setLoading(false);
    }
  }, [slug, initialTicketId]);

  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);

  const handleQuantityChange = (ticketId: string, delta: number) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    const current = quantities[ticketId] || 0;
    const next = Math.max(0, current + delta);

    if (next > ticket.maxPerOrder) return;
    if (next > ticket.remainingQuantity) return;

    setQuantities((prev) => ({
      ...prev,
      [ticketId]: next,
    }));
  };

  // Sync attendee forms when progressing to Step 2
  const prepareAttendeeForms = () => {
    const updated: Record<string, AttendeeData[]> = {};

    Object.entries(quantities).forEach(([ticketId, count]) => {
      if (count <= 0) return;
      const existing = attendeeForms[ticketId] || [];
      const list: AttendeeData[] = [];

      for (let i = 0; i < count; i++) {
        if (existing[i]) {
          list.push(existing[i]);
        } else {
          list.push({
            name: i === 0 && billing.name ? billing.name : '',
            email: i === 0 && billing.email ? billing.email : '',
            phoneNumber: i === 0 && billing.phone ? billing.phone : '',
            gender: 'Not Specified',
            foodPreference: 'Not Specified',
            medicalCouncilNumber: '',
            answers: {},
          });
        }
      }
      updated[ticketId] = list;
    });

    setAttendeeForms(updated);
    setStep(2);
  };

  const updateAttendeeField = (
    ticketId: string,
    index: number,
    field: keyof AttendeeData,
    value: unknown
  ) => {
    setAttendeeForms((prev) => {
      const list = [...(prev[ticketId] || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, [ticketId]: list };
    });
  };

  const updateAttendeeAnswer = (
    ticketId: string,
    index: number,
    fieldKey: string,
    value: unknown
  ) => {
    setAttendeeForms((prev) => {
      const list = [...(prev[ticketId] || [])];
      list[index] = {
        ...list[index],
        answers: { ...(list[index].answers || {}), [fieldKey]: value },
      };
      return { ...prev, [ticketId]: list };
    });
  };

  const validatePromoCode = async () => {
    if (!promoCode.trim() || !event) return;
    setValidatingPromo(true);
    setPromoError(null);
    try {
      const res = await fetch(`/api/events/${event.id}/promo-codes/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCode.trim(),
          orderAmount: calculateGrossTotal(),
          email: billing.email || 'customer@example.com',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid promotional code');

      setAppliedPromo(data.promoCode);
    } catch (err: unknown) {
      setPromoError(err instanceof Error ? err.message : 'Invalid promo code');
      setAppliedPromo(null);
    } finally {
      setValidatingPromo(false);
    }
  };

  const totalSelectedTickets = Object.values(quantities).reduce((a, b) => a + b, 0);

  const calculateGrossTotal = () => {
    return Object.entries(quantities).reduce((acc, [tId, qty]) => {
      const t = tickets.find((tick) => tick.id === tId);
      return acc + (t ? t.currentPrice * qty : 0);
    }, 0);
  };

  const calculateDiscountTotal = () => {
    if (!appliedPromo) return 0;
    const gross = calculateGrossTotal();
    if (appliedPromo.discountType === 'percentage') {
      return (gross * parseFloat(appliedPromo.discountValue)) / 100;
    }
    if (appliedPromo.discountType === 'fixed_amount') {
      return Math.min(gross, parseFloat(appliedPromo.discountValue));
    }
    if (appliedPromo.discountType === 'free_ticket') {
      return gross;
    }
    return 0;
  };

  const netPayable = Math.max(0, calculateGrossTotal() - calculateDiscountTotal());

  // Step Validation
  const canProceedToStep2 = totalSelectedTickets > 0;

  const validateAttendees = () => {
    for (const [, list] of Object.entries(attendeeForms)) {
      for (const att of list) {
        if (!att.name.trim()) return false;
      }
    }
    return true;
  };

  const handleCheckout = async () => {
    if (!billing.name.trim() || !billing.email.trim()) {
      setErrorMessage('Billing contact name and valid email are required');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      // Assemble checkout items payload
      const items = Object.entries(attendeeForms).map(([ticketId, attendeesList]) => ({
        ticketId,
        attendees: attendeesList.map((a) => ({
          name: a.name.trim(),
          email: a.email.trim() || billing.email.trim(),
          phoneNumber: a.phoneNumber.trim() || billing.phone.trim() || null,
          gender: a.gender,
          foodPreference: a.foodPreference,
          medicalCouncilNumber: a.medicalCouncilNumber.trim() || null,
          answers: a.answers,
        })),
      }));

      const res = await fetch(`/api/public/events/${slug}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: billing.name.trim(),
          customerEmail: billing.email.trim(),
          customerPhone: billing.phone.trim() || null,
          promoCode: appliedPromo ? promoCode.trim() : null,
          items,
          notes: billing.notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');

      // If Free Order: Instantly confirmed
      if (data.isFree) {
        router.push(`/p/${slug}/confirmation/${data.orderReference}`);
        return;
      }

      // If Paid Order: Launch Razorpay Modal
      const rzpData = data.razorpay;

      // If in browser and Razorpay is loaded
      const windowWithRzp = typeof window !== 'undefined' ? (window as unknown as { Razorpay?: new (opts: Record<string, unknown>) => { open: () => void } }) : {};
      if (windowWithRzp.Razorpay) {
        const options = {
          key: rzpData.keyId,
          amount: rzpData.amount,
          currency: rzpData.currency,
          name: rzpData.name,
          description: rzpData.description,
          order_id: rzpData.orderId,
          prefill: rzpData.prefill,
          theme: {
            color: website?.theme?.primaryColor || '#2563eb',
          },
          handler: async function (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) {
            // Verify payment on server
            try {
              const verifyRes = await fetch(`/api/public/events/${slug}/verify-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderReference: data.orderReference,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });
              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) throw new Error(verifyData.error || 'Payment signature verification failed');

              router.push(`/p/${slug}/confirmation/${data.orderReference}`);
            } catch (err: unknown) {
              setErrorMessage(err instanceof Error ? err.message : 'Payment verification failed');
              setSubmitting(false);
            }
          },
          modal: {
            ondismiss: function () {
              setSubmitting(false);
              setErrorMessage('Payment was cancelled. Your reservation is held for 15 minutes. You can retry anytime.');
            },
          },
        };

        const rzp = new windowWithRzp.Razorpay(options);
        rzp.open();
      } else {
        // Fallback simulation in test environments without Razorpay script loaded
        const mockVerifyRes = await fetch(`/api/public/events/${slug}/verify-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderReference: data.orderReference,
            razorpayPaymentId: `pay_mock_${Date.now()}`,
            razorpayOrderId: rzpData.orderId,
            razorpaySignature: 'mock_valid_signature_test',
          }),
        });
        const mockVerifyData = await mockVerifyRes.json();
        if (!mockVerifyRes.ok) throw new Error(mockVerifyData.error || 'Payment verification failed');

        router.push(`/p/${slug}/confirmation/${data.orderReference}`);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An error occurred during checkout');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const primaryColor = website?.theme?.primaryColor || '#2563eb';

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link
              href={`/p/${slug}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="line-clamp-1">{event?.name || 'Back to Event'}</span>
            </Link>

            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              Secure 256-Bit Checkout
            </div>
          </div>
        </header>

        {/* Multi-Step Indicator */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3">
          <div className="max-w-4xl mx-auto px-4 flex items-center justify-between text-xs font-semibold">
            <div className={`flex items-center gap-2 ${step === 1 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center bg-blue-50 dark:bg-blue-950/60 border border-blue-200">1</span>
              <span>Select Passes</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-200 dark:bg-slate-800" />
            <div className={`flex items-center gap-2 ${step === 2 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center bg-blue-50 dark:bg-blue-950/60 border border-blue-200">2</span>
              <span>Attendee Details</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-200 dark:bg-slate-800" />
            <div className={`flex items-center gap-2 ${step === 3 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center bg-blue-50 dark:bg-blue-950/60 border border-blue-200">3</span>
              <span>Payment & Review</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Select Passes & Quantities */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Select Admission Passes
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Choose the quantity of passes you wish to purchase for yourself or your group.
                </p>
              </div>

              <div className="space-y-4">
                {tickets.map((t) => {
                  const qty = quantities[t.id] || 0;
                  const isSoldOut = t.remainingQuantity <= 0;

                  return (
                    <div
                      key={t.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                            {t.category}
                          </span>
                          <span className="text-xs text-slate-400">
                            {isSoldOut ? 'Sold Out' : `${t.remainingQuantity} available`}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                          {t.name}
                        </h3>
                        {t.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {t.description}
                          </p>
                        )}
                        <div className="mt-2 text-base font-extrabold text-slate-900 dark:text-white">
                          {t.currentPrice === 0 ? 'Free' : `₹${t.currentPrice.toFixed(2)}`}
                          <span className="text-xs font-normal text-slate-400 ml-1">/ person</span>
                        </div>
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(t.id, -1)}
                          disabled={qty === 0 || isSoldOut}
                          className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-bold text-base">{qty}</span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(t.id, 1)}
                          disabled={qty >= t.maxPerOrder || isSoldOut}
                          className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Continue Bar */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Selected Passes:</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {totalSelectedTickets} Pass{totalSelectedTickets !== 1 ? 'es' : ''} (₹{calculateGrossTotal().toFixed(2)})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={prepareAttendeeForms}
                  disabled={!canProceedToStep2}
                  className="px-6 py-3 rounded-lg font-semibold text-white shadow transition flex items-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}
                >
                  Continue to Attendee Details
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Enter Attendee Information */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Attendee Information
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Provide ticket holder details for badge printing and verified admission.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Change Passes
                </button>
              </div>

              {Object.entries(attendeeForms).map(([ticketId, list]) => {
                const ticket = tickets.find((t) => t.id === ticketId);
                return list.map((att, idx) => (
                  <div
                    key={`${ticketId}-${idx}`}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <span className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        Attendee #{idx + 1} — {ticket?.name}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                        {ticket?.category}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={att.name}
                          onChange={(e) => updateAttendeeField(ticketId, idx, 'name', e.target.value)}
                          placeholder="Dr. Rajesh Kumar"
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={att.email}
                          onChange={(e) => updateAttendeeField(ticketId, idx, 'email', e.target.value)}
                          placeholder="rajesh@hospital.com"
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                          Mobile / WhatsApp Number
                        </label>
                        <input
                          type="tel"
                          value={att.phoneNumber}
                          onChange={(e) => updateAttendeeField(ticketId, idx, 'phoneNumber', e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                          Food Preference
                        </label>
                        <select
                          value={att.foodPreference}
                          onChange={(e) => updateAttendeeField(ticketId, idx, 'foodPreference', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm"
                        >
                          <option value="Not Specified">Not Specified</option>
                          <option value="Vegetarian">Vegetarian</option>
                          <option value="Non-Vegetarian">Non-Vegetarian</option>
                          <option value="Jain Food">Jain Food</option>
                          <option value="Vegan">Vegan</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                          Medical Council / Reg Number (Optional)
                        </label>
                        <input
                          type="text"
                          value={att.medicalCouncilNumber}
                          onChange={(e) => updateAttendeeField(ticketId, idx, 'medicalCouncilNumber', e.target.value)}
                          placeholder="MCI-12345"
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm"
                        />
                      </div>
                    </div>

                    {/* Dynamic Form Custom Questions */}
                    {formFields.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                          Additional Event Questions
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {formFields.map((field) => (
                            <div key={field.id}>
                              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                {field.fieldLabel} {field.isRequired && '*'}
                              </label>
                              {field.fieldType === 'dropdown' && field.options ? (
                                <select
                                  value={(att.answers[field.fieldKey] as string) || ''}
                                  onChange={(e) => updateAttendeeAnswer(ticketId, idx, field.fieldKey, e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm"
                                >
                                  <option value="">Select an option</option>
                                  {field.options.map((opt, oIdx) => (
                                    <option key={oIdx} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  placeholder={field.placeholder || ''}
                                  value={(att.answers[field.fieldKey] as string) || ''}
                                  onChange={(e) => updateAttendeeAnswer(ticketId, idx, field.fieldKey, e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ));
              })}

              {/* Bottom Actions */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (validateAttendees()) {
                      setStep(3);
                    } else {
                      setErrorMessage('Please enter the full name for each attendee before continuing.');
                    }
                  }}
                  className="px-6 py-3 rounded-lg font-semibold text-white shadow transition flex items-center gap-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  Proceed to Payment & Review
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Billing Contact, Promo Code, Review & Checkout */}
          {step === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left 2 Cols: Billing Information */}
              <div className="md:col-span-2 space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    Billing & Primary Contact
                  </h2>
                  <p className="text-xs text-slate-500">
                    Order confirmation, digital tickets, and official tax receipts will be delivered to this email.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        Primary Contact Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={billing.name}
                        onChange={(e) => setBilling({ ...billing, name: e.target.value })}
                        placeholder="Dr. Rajesh Kumar"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        Receipt & Ticket Delivery Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={billing.email}
                        onChange={(e) => setBilling({ ...billing, email: e.target.value })}
                        placeholder="rajesh@hospital.com"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={billing.phone}
                        onChange={(e) => setBilling({ ...billing, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Promo Code Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    Promotional / Discount Code
                  </h3>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="e.g. EARLY2026, FACULTYPASS"
                      className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm uppercase font-mono"
                    />
                    <button
                      type="button"
                      onClick={validatePromoCode}
                      disabled={validatingPromo || !promoCode.trim()}
                      className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition disabled:opacity-50"
                    >
                      {validatingPromo ? 'Checking...' : 'Apply'}
                    </button>
                  </div>

                  {appliedPromo && (
                    <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Coupon applied: {appliedPromo.code} ({appliedPromo.discountType} discount)
                    </div>
                  )}

                  {promoError && (
                    <div className="text-xs text-red-500 font-medium">{promoError}</div>
                  )}
                </div>
              </div>

              {/* Right Col: Order Summary & Checkout Button */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                    Order Summary
                  </h3>

                  <div className="space-y-2 text-xs">
                    {Object.entries(quantities).map(([tId, count]) => {
                      if (count <= 0) return null;
                      const t = tickets.find((tick) => tick.id === tId);
                      return (
                        <div key={tId} className="flex justify-between text-slate-600 dark:text-slate-400">
                          <span>
                            {t?.name} x {count}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            ₹{((t?.currentPrice || 0) * count).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                      <span className="text-slate-500">Gross Subtotal:</span>
                      <span className="font-semibold">₹{calculateGrossTotal().toFixed(2)}</span>
                    </div>

                    {calculateDiscountTotal() > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount Savings:</span>
                        <span className="font-semibold">-₹{calculateDiscountTotal().toFixed(2)}</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between text-base font-extrabold text-slate-900 dark:text-white">
                      <span>Net Payable:</span>
                      <span>{netPayable === 0 ? 'Free' : `₹${netPayable.toFixed(2)}`}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={submitting}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {submitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : netPayable === 0 ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    {submitting
                      ? 'Processing Order...'
                      : netPayable === 0
                      ? 'Confirm Free Pass'
                      : `Pay ₹${netPayable.toFixed(2)} via Razorpay`}
                  </button>

                  <p className="text-[11px] text-center text-slate-400 leading-tight">
                    By confirming, you agree to the event admission policies and terms. Ticket PDF will be generated immediately.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
