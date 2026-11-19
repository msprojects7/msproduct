'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Calendar,
  MapPin,
  Ticket,
  Download,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Printer,
  FileText,
} from 'lucide-react';

interface AttendeeItem {
  attendeeId: string;
  name: string;
  registrationNumber: string;
  category: string;
  ticketToken: string;
  downloadUrl: string;
}

interface OrderData {
  orderNumber: string;
  orderReference: string;
  status: string;
  currency: string;
  quantity: number;
  grossAmount: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  paymentProvider: string;
  paymentReference?: string;
  createdAt: string;
}

interface EventData {
  name: string;
  slug: string;
  venue?: string;
  startDate?: string;
  endDate?: string;
  organizationName: string;
}

export default function PublicConfirmationPage() {
  const params = useParams();
  const slug = params.slug as string;
  const orderReference = params.orderReference as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [event, setEvent] = useState<EventData | null>(null);
  const [attendees, setAttendees] = useState<AttendeeItem[]>([]);
  const [primaryTicketName, setPrimaryTicketName] = useState<string>('Pass');

  const fetchOrderDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/orders/${orderReference}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to retrieve order confirmation details');

      setOrder(data.order);
      setEvent(data.event);
      setAttendees(data.attendees || []);
      setPrimaryTicketName(data.primaryTicketName || 'Event Pass');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred loading order details');
    } finally {
      setLoading(false);
    }
  }, [orderReference]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !order || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Order Not Found</h1>
          <p className="text-sm text-slate-500 mt-2">{error || 'Invalid or expired confirmation link'}</p>
          <div className="mt-6">
            <Link
              href={`/p/${slug}`}
              className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
            >
              Return to Event
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href={`/p/${slug}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{event.name}</span>
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Receipt
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10 space-y-8">
        {/* Success Banner */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Registration Confirmed!
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-lg mx-auto">
            Thank you, <strong>{order.customerName}</strong>. Your passes for <strong>{event.name}</strong> have been secured. Digital tickets and invoice have been dispatched to{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{order.customerEmail}</span>.
          </p>

          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3 text-xs font-mono bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl">
            <span>Order Reference: <strong>{order.orderNumber}</strong></span>
            <span>•</span>
            <span>Date: {new Date(order.createdAt).toLocaleDateString()}</span>
            <span>•</span>
            <span className="text-emerald-600 font-bold">STATUS: {order.status.toUpperCase()}</span>
          </div>
        </div>

        {/* Digital Tickets Container */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Ticket className="w-5 h-5 text-blue-600" />
              Verified Admission Tickets ({attendees.length})
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              Save or download PDF passes for entrance check-in
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {attendees.map((att, idx) => (
              <div
                key={att.attendeeId || idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                      {att.category}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {att.registrationNumber}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {att.name}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">
                    Pass Type: {primaryTicketName}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href={att.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-sm transition"
                  >
                    <Download className="w-4 h-4" />
                    Download Official PDF Ticket
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Details Breakdown Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            Payment & Billing Summary
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            <div className="py-2.5 flex justify-between text-slate-600 dark:text-slate-400">
              <span>Gross Amount ({order.quantity} passes)</span>
              <span>₹{order.grossAmount.toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="py-2.5 flex justify-between text-emerald-600 font-medium">
                <span>Discount Applied</span>
                <span>-₹{order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="py-2.5 flex justify-between font-bold text-base text-slate-900 dark:text-white">
              <span>Total Paid</span>
              <span>{order.finalAmount === 0 ? 'Free' : `₹${order.finalAmount.toFixed(2)}`}</span>
            </div>
            <div className="py-2.5 flex justify-between text-xs text-slate-500">
              <span>Payment Gateway / Method</span>
              <span className="font-mono">{order.paymentProvider.toUpperCase()}</span>
            </div>
            {order.paymentReference && (
              <div className="py-2.5 flex justify-between text-xs text-slate-500">
                <span>Transaction Reference</span>
                <span className="font-mono">{order.paymentReference}</span>
              </div>
            )}
          </div>
        </div>

        {/* Venue & Event Reminder */}
        <div className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="font-bold text-slate-900 dark:text-white block">{event.name}</span>
            {event.venue && (
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                <span>{event.venue}</span>
              </div>
            )}
            {event.startDate && (
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <span>{new Date(event.startDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <Link
            href={`/p/${slug}`}
            className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            Visit Event Microsite
          </Link>
        </div>
      </main>
    </div>
  );
}
