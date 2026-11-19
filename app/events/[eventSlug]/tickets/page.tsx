'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Ticket,
  Plus,
  Edit2,
  Trash2,
  Percent,
  AlertCircle,
  Search,
  Filter,
  Sparkles,
  X,
  Loader2,
} from 'lucide-react';
import BackButton from '@/app/components/ui/BackButton';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';
import { useToast } from '@/app/components/ui/Toast';

interface PriceRule {
  id: string;
  name: string;
  ruleType: string;
  discountType: string;
  discountValue: string;
  minQuantity: number;
  maxQuantity?: number | null;
  validFrom?: string | null;
  validTo?: string | null;
  isActive: boolean;
}

interface EventTicket {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  ticketType: 'free' | 'paid' | 'donation';
  category: string;
  price: string;
  currency: string;
  totalQuantity: number;
  soldQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minPerOrder: number;
  maxPerOrder: number;
  salesStart: string | null;
  salesEnd: string | null;
  visibility: 'public' | 'hidden' | 'access_code_only';
  status: 'draft' | 'scheduled' | 'on_sale' | 'sold_out' | 'paused' | 'closed';
  displayOrder: number;
  isFree: boolean;
  priceRules: PriceRule[];
}

export default function TicketManagementPage() {
  const params = useParams();
  const eventSlug = params?.eventSlug as string;
  const { toast } = useToast();

  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Ticket Modal state
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<EventTicket | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<EventTicket | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Price Rule Modal state
  const [selectedTicketForRules, setSelectedTicketForRules] = useState<EventTicket | null>(null);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<PriceRule | null>(null);
  const [ruleToDelete, setRuleToDelete] = useState<PriceRule | null>(null);

  // Ticket Form state
  const [ticketForm, setTicketForm] = useState({
    name: '',
    description: '',
    ticketType: 'paid',
    category: 'general',
    price: 0,
    currency: 'INR',
    totalQuantity: 100,
    minPerOrder: 1,
    maxPerOrder: 10,
    salesStart: '',
    salesEnd: '',
    visibility: 'public',
    status: 'draft',
    displayOrder: 0,
  });

  // Price Rule Form state
  const [ruleForm, setRuleForm] = useState({
    name: '',
    ruleType: 'early_bird',
    discountType: 'percentage',
    discountValue: 10,
    minQuantity: 1,
    maxQuantity: null as number | null,
    validFrom: '',
    validTo: '',
    isActive: true,
  });

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/events/${eventSlug}/tickets`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch tickets');
      setTickets(data.tickets || []);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error loading tickets');
    } finally {
      setLoading(false);
    }
  }, [eventSlug]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleOpenCreateTicket = () => {
    setEditingTicket(null);
    setTicketForm({
      name: '',
      description: '',
      ticketType: 'paid',
      category: 'general',
      price: 999,
      currency: 'INR',
      totalQuantity: 100,
      minPerOrder: 1,
      maxPerOrder: 10,
      salesStart: '',
      salesEnd: '',
      visibility: 'public',
      status: 'on_sale',
      displayOrder: tickets.length,
    });
    setFormError(null);
    setShowTicketModal(true);
  };

  const handleOpenEditTicket = (ticket: EventTicket) => {
    setEditingTicket(ticket);
    setTicketForm({
      name: ticket.name,
      description: ticket.description || '',
      ticketType: ticket.ticketType,
      category: ticket.category,
      price: Number(ticket.price),
      currency: ticket.currency,
      totalQuantity: ticket.totalQuantity,
      minPerOrder: ticket.minPerOrder,
      maxPerOrder: ticket.maxPerOrder,
      salesStart: ticket.salesStart ? new Date(ticket.salesStart).toISOString().slice(0, 16) : '',
      salesEnd: ticket.salesEnd ? new Date(ticket.salesEnd).toISOString().slice(0, 16) : '',
      visibility: ticket.visibility,
      status: ticket.status,
      displayOrder: ticket.displayOrder,
    });
    setFormError(null);
    setShowTicketModal(true);
  };

  const handleSaveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        ...ticketForm,
        price: ticketForm.ticketType === 'free' ? 0 : Number(ticketForm.price),
        salesStart: ticketForm.salesStart ? new Date(ticketForm.salesStart).toISOString() : null,
        salesEnd: ticketForm.salesEnd ? new Date(ticketForm.salesEnd).toISOString() : null,
      };

      const url = editingTicket
        ? `/api/events/${eventSlug}/tickets/${editingTicket.id}`
        : `/api/events/${eventSlug}/tickets`;
      const method = editingTicket ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save ticket');

      setShowTicketModal(false);
      fetchTickets();
    } catch (err: unknown) {
      const e = err as Error;
      setFormError(e.message || 'Error saving ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${eventSlug}/tickets/${ticketToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete ticket');

      setTicketToDelete(null);
      toast.success('Ticket tier removed successfully');
      fetchTickets();
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || 'Error deleting ticket');
    } finally {
      setSubmitting(false);
    }
  };

  // Price Rule Management
  const handleOpenRuleModal = (ticket: EventTicket) => {
    setSelectedTicketForRules(ticket);
    setEditingRule(null);
    setRuleForm({
      name: 'Early Bird Discount',
      ruleType: 'early_bird',
      discountType: 'percentage',
      discountValue: 15,
      minQuantity: 1,
      maxQuantity: null,
      validFrom: '',
      validTo: '',
      isActive: true,
    });
    setFormError(null);
    setShowRuleModal(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketForRules) return;
    setSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        ...ruleForm,
        discountValue: Number(ruleForm.discountValue),
        minQuantity: Number(ruleForm.minQuantity) || 1,
        maxQuantity: ruleForm.maxQuantity ? Number(ruleForm.maxQuantity) : null,
        validFrom: ruleForm.validFrom ? new Date(ruleForm.validFrom).toISOString() : null,
        validTo: ruleForm.validTo ? new Date(ruleForm.validTo).toISOString() : null,
      };

      const url = editingRule
        ? `/api/events/${eventSlug}/tickets/${selectedTicketForRules.id}/rules/${editingRule.id}`
        : `/api/events/${eventSlug}/tickets/${selectedTicketForRules.id}/rules`;
      const method = editingRule ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save price rule');

      setShowRuleModal(false);
      fetchTickets();
    } catch (err: unknown) {
      const e = err as Error;
      setFormError(e.message || 'Error saving price rule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRule = async () => {
    if (!selectedTicketForRules || !ruleToDelete) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/events/${eventSlug}/tickets/${selectedTicketForRules.id}/rules/${ruleToDelete.id}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete rule');

      setRuleToDelete(null);
      toast.success('Price rule removed successfully');
      fetchTickets();
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || 'Error deleting rule');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCapacity = tickets.reduce((acc, t) => acc + t.totalQuantity, 0);
  const totalSold = tickets.reduce((acc, t) => acc + t.soldQuantity, 0);
  const totalAvailable = tickets.reduce((acc, t) => acc + t.availableQuantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref={`/events/${eventSlug}`} />
            <div>
              <div className="flex items-center gap-2">
                <Ticket className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Ticket Classes & Pricing</h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Manage ticket tiers, sales windows, inventory quotas, and early-bird discounts.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenCreateTicket}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm rounded-xl transition shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            Add Ticket Class
          </button>
        </div>

        {/* Inventory Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Capacity</span>
            <div className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{totalCapacity}</div>
            <p className="text-xs text-slate-400 mt-1">Across {tickets.length} ticket tiers</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Tickets Sold</span>
            <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{totalSold}</div>
            <p className="text-xs text-slate-400 mt-1">
              {totalCapacity > 0 ? `${Math.round((totalSold / totalCapacity) * 100)}% capacity filled` : '0%'}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">Available Inventory</span>
            <div className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{totalAvailable}</div>
            <p className="text-xs text-slate-400 mt-1">Remaining seats for sale</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ticket name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter tickets by status"
              className="text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 w-full sm:w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="on_sale">On Sale</option>
              <option value="draft">Draft</option>
              <option value="sold_out">Sold Out</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Tickets Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
            <p className="text-sm text-slate-500">Loading ticket classes...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Ticket className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No ticket classes found</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Create your first ticket class (e.g. Free Pass, Early Bird, General Admission, VIP) to start registrations.
            </p>
            <button
              onClick={handleOpenCreateTicket}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm rounded-xl transition"
            >
              Create Ticket Class
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTickets.map((ticket) => {
              const pctSold = ticket.totalQuantity > 0 ? (ticket.soldQuantity / ticket.totalQuantity) * 100 : 0;
              return (
                <div
                  key={ticket.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                            {ticket.category}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              ticket.status === 'on_sale'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : ticket.status === 'sold_out'
                                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                                : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                            }`}
                          >
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">{ticket.name}</h3>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-900 dark:text-white">
                          {ticket.isFree ? (
                            <span className="text-emerald-600 dark:text-emerald-400">FREE</span>
                          ) : (
                            `${ticket.currency} ${Number(ticket.price).toLocaleString()}`
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">per person</span>
                      </div>
                    </div>

                    {ticket.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {ticket.description}
                      </p>
                    )}

                    {/* Inventory bar */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Sold: <strong>{ticket.soldQuantity}</strong> / {ticket.totalQuantity}</span>
                        <span>Available: <strong>{ticket.availableQuantity}</strong></span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, pctSold)}%` }}
                        />
                      </div>
                    </div>

                    {/* Price rules badge */}
                    {ticket.priceRules && ticket.priceRules.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                        <Percent className="w-3.5 h-3.5" />
                        <span>{ticket.priceRules.length} Active Price Rule(s)</span>
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleOpenRuleModal(ticket)}
                      className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Price Rules
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditTicket(ticket)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Edit ticket"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setTicketToDelete(ticket)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Delete ticket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CREATE / EDIT TICKET MODAL */}
        {showTicketModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingTicket ? 'Edit Ticket Class' : 'Create New Ticket Class'}
                </h2>
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveTicket} className="space-y-4 mt-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Ticket Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Early Bird Delegate Pass"
                    value={ticketForm.name}
                    onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Ticket Type *
                    </label>
                    <select
                      value={ticketForm.ticketType}
                      onChange={(e) =>
                        setTicketForm({
                          ...ticketForm,
                          ticketType: e.target.value as 'free' | 'paid' | 'donation',
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                    >
                      <option value="paid">Paid Ticket</option>
                      <option value="free">Free Ticket</option>
                      <option value="donation">Donation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Category *
                    </label>
                    <select
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                    >
                      <option value="general">General Admission</option>
                      <option value="vip">VIP / Dignitary</option>
                      <option value="early_bird">Early Bird</option>
                      <option value="student">Student / Postgraduate</option>
                      <option value="group">Group Pass</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>

                {ticketForm.ticketType !== 'free' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Price (in currency) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={ticketForm.price}
                        onChange={(e) => setTicketForm({ ...ticketForm, price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Currency *
                      </label>
                      <input
                        type="text"
                        required
                        value={ticketForm.currency}
                        onChange={(e) => setTicketForm({ ...ticketForm, currency: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Total Inventory *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={ticketForm.totalQuantity}
                      onChange={(e) => setTicketForm({ ...ticketForm, totalQuantity: parseInt(e.target.value, 10) || 1 })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Min Per Order
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={ticketForm.minPerOrder}
                      onChange={(e) => setTicketForm({ ...ticketForm, minPerOrder: parseInt(e.target.value, 10) || 1 })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Max Per Order
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={ticketForm.maxPerOrder}
                      onChange={(e) => setTicketForm({ ...ticketForm, maxPerOrder: parseInt(e.target.value, 10) || 10 })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Sales Start
                    </label>
                    <input
                      type="datetime-local"
                      value={ticketForm.salesStart}
                      onChange={(e) => setTicketForm({ ...ticketForm, salesStart: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Sales End
                    </label>
                    <input
                      type="datetime-local"
                      value={ticketForm.salesEnd}
                      onChange={(e) => setTicketForm({ ...ticketForm, salesEnd: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Status *
                    </label>
                    <select
                      value={ticketForm.status}
                      onChange={(e) =>
                        setTicketForm({
                          ...ticketForm,
                          status: e.target.value as 'draft' | 'scheduled' | 'on_sale' | 'sold_out' | 'paused' | 'closed',
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                    >
                      <option value="draft">Draft</option>
                      <option value="on_sale">On Sale</option>
                      <option value="paused">Paused</option>
                      <option value="closed">Closed</option>
                      <option value="sold_out">Sold Out</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Visibility *
                    </label>
                    <select
                      value={ticketForm.visibility}
                      onChange={(e) =>
                        setTicketForm({
                          ...ticketForm,
                          visibility: e.target.value as 'public' | 'hidden' | 'access_code_only',
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                    >
                      <option value="public">Public</option>
                      <option value="hidden">Hidden</option>
                      <option value="access_code_only">Access Code Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Description & Inclusions
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Includes delegate kit, scientific sessions, lunch & banquet dinner"
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowTicketModal(false)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-md shadow-blue-600/20 disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingTicket ? 'Save Changes' : 'Create Ticket'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PRICE RULES MODAL */}
        {showRuleModal && selectedTicketForRules && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Dynamic Price Rules
                  </h2>
                  <p className="text-xs text-slate-400">
                    Ticket: <strong>{selectedTicketForRules.name}</strong> ({selectedTicketForRules.currency} {selectedTicketForRules.price})
                  </p>
                </div>
                <button
                  onClick={() => setShowRuleModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Existing Rules List */}
              <div className="my-4 space-y-2">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Configured Rules</h4>
                {selectedTicketForRules.priceRules.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No price rules active for this ticket yet.</p>
                ) : (
                  selectedTicketForRules.priceRules.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                    >
                      <div>
                        <div className="font-semibold text-xs text-slate-900 dark:text-white">{r.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {r.ruleType === 'early_bird' ? 'Early Bird' : 'Group'} discount of{' '}
                          <strong>
                            {r.discountType === 'percentage' ? `${r.discountValue}%` : `${selectedTicketForRules.currency} ${r.discountValue}`}
                          </strong>
                        </div>
                      </div>
                      <button
                        onClick={() => setRuleToDelete(r)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded-md transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add New Rule Form */}
              <form onSubmit={handleSaveRule} className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3 text-xs sm:text-sm">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200">Add New Pricing Rule</h4>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Rule Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Early Bird 20% Off"
                    value={ruleForm.name}
                    onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Rule Type</label>
                    <select
                      value={ruleForm.ruleType}
                      onChange={(e) => setRuleForm({ ...ruleForm, ruleType: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                    >
                      <option value="early_bird">Early Bird (Date Based)</option>
                      <option value="group">Group Discount (Qty Based)</option>
                      <option value="scheduled">Scheduled Change</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Discount Type</label>
                    <select
                      value={ruleForm.discountType}
                      onChange={(e) => setRuleForm({ ...ruleForm, discountType: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed_amount">Fixed Amount</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Discount Value {ruleForm.discountType === 'percentage' ? '(%)' : `(${selectedTicketForRules.currency})`} *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={ruleForm.discountValue}
                      onChange={(e) => setRuleForm({ ...ruleForm, discountValue: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Min Quantity (Group discount)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={ruleForm.minQuantity}
                      onChange={(e) => setRuleForm({ ...ruleForm, minQuantity: parseInt(e.target.value, 10) || 1 })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Valid From</label>
                    <input
                      type="datetime-local"
                      value={ruleForm.validFrom}
                      onChange={(e) => setRuleForm({ ...ruleForm, validFrom: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Valid Until</label>
                    <input
                      type="datetime-local"
                      value={ruleForm.validTo}
                      onChange={(e) => setRuleForm({ ...ruleForm, validTo: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition shadow-md shadow-purple-600/20 disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Add Price Rule
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CONFIRM DELETE DIALOGS */}
        <ConfirmDialog
          isOpen={!!ticketToDelete}
          title="Delete Ticket Class"
          description={`Are you sure you want to delete '${ticketToDelete?.name}'? This action cannot be undone.`}
          confirmLabel="Delete Ticket"
          variant="destructive"
          onConfirm={handleDeleteTicket}
          onCancel={() => setTicketToDelete(null)}
        />

        <ConfirmDialog
          isOpen={!!ruleToDelete}
          title="Delete Price Rule"
          description={`Are you sure you want to remove rule '${ruleToDelete?.name}'?`}
          confirmLabel="Delete Rule"
          variant="destructive"
          onConfirm={handleDeleteRule}
          onCancel={() => setRuleToDelete(null)}
        />
      </div>
    </div>
  );
}
