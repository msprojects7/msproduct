'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Users,
  UserCheck,
  Search,
  Filter,
  Plus,
  RefreshCw,
  FileText,
  X,
  Loader2,
} from 'lucide-react';
import BackButton from '@/app/components/ui/BackButton';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';
import { useToast } from '@/app/components/ui/Toast';

interface OrderItem {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  unitPrice: string;
  quantity: number;
  grossAmount: string;
  discountAmount: string;
  finalAmount: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  paymentProvider: string;
  createdAt: string;
  ticketId: string;
  ticketName: string;
  ticketCategory: string;
  attendeeId: string | null;
  attendeeRegNo: string | null;
  attendeeAttendanceStatus: string | null;
  promoCode: string | null;
}

interface RegistrationAnswerItem {
  id: string;
  fieldId: string | null;
  fieldKey: string;
  fieldLabel: string | null;
  fieldType: string | null;
  answerValue: unknown;
}

interface OrderDetailAttendee {
  id: string;
  name: string;
  registrationNumber: string;
  category: string;
  email: string | null;
  phoneNumber: string | null;
  paymentStatus: string;
  attendanceStatus: string;
  ticketToken: string;
}

interface OrderDetail extends OrderItem {
  attendeeName?: string;
  attendeeEmail?: string;
  attendeePaymentStatus?: string;
  answers?: RegistrationAnswerItem[];
  attendees?: OrderDetailAttendee[];
}

interface TicketOption {
  id: string;
  name: string;
  price: string;
  currency: string;
  availableQuantity: number;
}

interface StatsData {
  inventory: {
    totalCapacity: number;
    totalSold: number;
    totalReserved: number;
    totalAvailable: number;
    percentSold: number;
    categoryBreakdown: Record<string, { total: number; sold: number; available: number }>;
  };
  orders: {
    totalOrders: number;
    byStatus: Record<string, number>;
    freeRegistrations: number;
    paidRegistrations: number;
  };
  financials: {
    currency: string;
    grossRevenue: number;
    netRevenue: number;
    totalDiscountsGiven: number;
  };
  promoCodes: {
    totalRedemptions: number;
    totalPromoSavings: number;
  };
}

export default function RegistrationsOverviewPage() {
  const params = useParams();
  const eventSlug = params?.eventSlug as string;
  const { toast } = useToast();

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected Order for Drawer
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<OrderItem | null>(null);

  // Manual Register Modal
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [tickets, setTickets] = useState<TicketOption[]>([]);
  const [registerForm, setRegisterForm] = useState({
    ticketId: '',
    name: '',
    email: '',
    phoneNumber: '',
    promoCode: '',
    answers: {} as Record<string, unknown>,
  });
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [ordersRes, statsRes, ticketsRes] = await Promise.all([
        fetch(
          `/api/events/${eventSlug}/registrations?${statusFilter !== 'all' ? `status=${statusFilter}&` : ''}${
            searchQuery ? `q=${encodeURIComponent(searchQuery)}` : ''
          }`
        ),
        fetch(`/api/events/${eventSlug}/registrations/stats`),
        fetch(`/api/events/${eventSlug}/tickets`),
      ]);

      const ordersData = await ordersRes.json();
      const statsData = await statsRes.json();
      const ticketsData = await ticketsRes.json();

      if (!ordersRes.ok) throw new Error(ordersData.error || 'Failed to fetch registrations');
      setOrders(ordersData.orders || []);

      if (statsRes.ok) {
        setStats(statsData);
      }
      if (ticketsRes.ok) {
        setTickets(ticketsData.tickets || []);
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error loading registration orders');
    } finally {
      setLoading(false);
    }
  }, [eventSlug, statusFilter, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDetails = async (orderId: string) => {
    try {
      const res = await fetch(`/api/events/${eventSlug}/registrations/${orderId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch order details');
      setSelectedOrder(data.order);
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || 'Error fetching details');
    }
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    try {
      const res = await fetch(`/api/events/${eventSlug}/registrations/${orderToCancel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel order');

      setOrderToCancel(null);
      if (selectedOrder?.id === orderToCancel.id) {
        setSelectedOrder(null);
      }
      toast.success('Order cancelled successfully');
      fetchData();
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || 'Error cancelling order');
    }
  };

  const handleManualRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterSubmitting(true);
    setRegisterError(null);

    try {
      const res = await fetch(`/api/events/${eventSlug}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration submission failed');

      setShowRegisterModal(false);
      fetchData();
    } catch (err: unknown) {
      const e = err as Error;
      setRegisterError(e.message || 'Error submitting registration');
    } finally {
      setRegisterSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref={`/events/${eventSlug}`} />
            <div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Registrations & Orders</h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Track real-time registrations, order statuses, financial receipts, and attendee badge tokens.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchData()}
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setRegisterForm({
                  ticketId: tickets[0]?.id || '',
                  name: '',
                  email: '',
                  phoneNumber: '',
                  promoCode: '',
                  answers: {},
                });
                setRegisterError(null);
                setShowRegisterModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              Register Attendee
            </button>
          </div>
        </div>

        {/* Real-time KPI Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Confirmed Attendees</span>
              <div className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                {stats.orders.byStatus.confirmed || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {stats.orders.freeRegistrations} Free • {stats.orders.paidRegistrations} Paid
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending Payment</span>
              <div className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                {stats.orders.byStatus.pending_payment || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Awaiting checkout (Stage 3)</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Net Revenue</span>
              <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                ₹ {stats.financials.netRevenue.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                ₹ {stats.financials.totalDiscountsGiven.toLocaleString()} in discounts
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">Capacity Filled</span>
              <div className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">
                {stats.inventory.percentSold}%
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {stats.inventory.totalSold} / {stats.inventory.totalCapacity} sold
              </p>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order number, attendee name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter orders by status"
              className="text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 w-full sm:w-auto"
            >
              <option value="all">All Orders</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending_payment">Pending Payment</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
              <p className="text-sm text-slate-500">Loading registrations...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500 text-sm">{error}</div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No registrations found</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Use the &quot;Register Attendee&quot; button above to submit a registration with ticket and dynamic fields.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Attendee</th>
                    <th className="py-3 px-4">Ticket Class</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Reg No</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {order.customerName}
                        </div>
                        <div className="text-[11px] text-slate-400">{order.customerEmail}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {order.ticketName}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1.5 uppercase font-mono">
                          ({order.ticketCategory})
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {Number(order.finalAmount) === 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400">FREE</span>
                        ) : (
                          `${order.currency} ${Number(order.finalAmount).toLocaleString()}`
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        {order.attendeeRegNo ? (
                          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                            {order.attendeeRegNo}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            order.status === 'confirmed'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : order.status === 'pending_payment'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                          }`}
                        >
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenDetails(order.id)}
                          className="px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ORDER DETAILS DRAWER */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Order {selectedOrder.orderNumber}
                  </h3>
                  <span className="text-xs text-slate-400">
                    Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs sm:text-sm">
                {/* Financial Summary Card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ticket Category</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {selectedOrder.ticketName} ({selectedOrder.ticketCategory})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Unit Price</span>
                    <span>
                      {selectedOrder.currency} {selectedOrder.unitPrice} x {selectedOrder.quantity}
                    </span>
                  </div>
                  {Number(selectedOrder.discountAmount) > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Discount Applied {selectedOrder.promoCode && `(${selectedOrder.promoCode})`}</span>
                      <span>- {selectedOrder.currency} {selectedOrder.discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                    <span>Total Amount</span>
                    <span>{selectedOrder.currency} {selectedOrder.finalAmount}</span>
                  </div>
                </div>

                {/* Multi-Attendee Passes List */}
                {selectedOrder.attendees && selectedOrder.attendees.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                      Confirmed Attendees ({selectedOrder.attendees.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedOrder.attendees.map((att) => (
                        <div
                          key={att.id}
                          className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{att.name}</div>
                            <div className="text-slate-500 font-mono mt-0.5">
                              {att.registrationNumber} • {att.category}
                            </div>
                          </div>
                          <a
                            href={`/api/public/tickets/download/${att.ticketToken}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold rounded-lg hover:underline flex items-center gap-1"
                          >
                            PDF Ticket
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attendee Details */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">Attendee Information</h4>
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div>
                      <span className="text-slate-400 text-xs">Name:</span>
                      <div className="font-semibold">{selectedOrder.customerName}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs">Email:</span>
                      <div className="font-semibold">{selectedOrder.customerEmail}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs">Registration Number:</span>
                      <div className="font-mono font-bold text-blue-600">
                        {selectedOrder.attendeeRegNo || 'Pending'}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs">Payment Status:</span>
                      <div className="font-semibold text-emerald-600">
                        {selectedOrder.attendeePaymentStatus || 'Paid'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Form Responses */}
                {selectedOrder.answers && selectedOrder.answers.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                      Registration Form Answers ({selectedOrder.answers.length})
                    </h4>
                    <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      {selectedOrder.answers.map((ans: RegistrationAnswerItem) => (
                        <div key={ans.id} className="border-b border-slate-200 dark:border-slate-700/50 pb-1.5 last:border-0 last:pb-0">
                          <span className="text-slate-400 text-[11px] block">{ans.fieldLabel || ans.fieldKey}</span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {typeof ans.answerValue === 'object'
                              ? JSON.stringify(ans.answerValue)
                              : String(ans.answerValue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cancel Action */}
                {selectedOrder.status !== 'cancelled' && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                    <button
                      onClick={() => setOrderToCancel(selectedOrder)}
                      className="px-4 py-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-xl font-medium text-xs transition"
                    >
                      Cancel Order & Release Inventory
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MANUAL REGISTRATION MODAL */}
        {showRegisterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Manual Attendee Registration</h3>
                <button
                  onClick={() => setShowRegisterModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {registerError && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 text-xs">
                  {registerError}
                </div>
              )}

              <form onSubmit={handleManualRegister} className="space-y-3.5 mt-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Select Ticket Class *</label>
                  <select
                    required
                    value={registerForm.ticketId}
                    onChange={(e) => setRegisterForm({ ...registerForm, ticketId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  >
                    {tickets.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} — {Number(t.price) === 0 ? 'FREE' : `${t.currency} ${t.price}`} ({t.availableQuantity} available)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Attendee Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Jane Doe"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="jane@example.com"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={registerForm.phoneNumber}
                      onChange={(e) => setRegisterForm({ ...registerForm, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Promo Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FACULTY100"
                    value={registerForm.promoCode}
                    onChange={(e) => setRegisterForm({ ...registerForm, promoCode: e.target.value.toUpperCase() })}
                    className="w-full font-mono uppercase px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(false)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={registerSubmitting}
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition shadow-md shadow-emerald-600/20"
                  >
                    {registerSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm Registration
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Cancel Confirmation */}
        <ConfirmDialog
          isOpen={!!orderToCancel}
          title="Cancel Registration Order"
          description={`Are you sure you want to cancel order ${orderToCancel?.orderNumber}? Reserved or sold inventory will be restored.`}
          confirmLabel="Cancel Order"
          variant="destructive"
          onConfirm={handleCancelOrder}
          onCancel={() => setOrderToCancel(null)}
        />
      </div>
    </div>
  );
}
