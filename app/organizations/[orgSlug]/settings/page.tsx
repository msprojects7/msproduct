'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { SubscriptionModal } from '@/app/components/billing/SubscriptionModal';
import { useToast } from '@/app/components/ui/Toast';
import BackButton from '@/app/components/ui/BackButton';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';
import {
  Settings,
  ShieldAlert,
  Building,
  CreditCard,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function OrganizationSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const { toast } = useToast();

  const [org, setOrg] = useState<{ id: string; name: string; slug: string; logoUrl?: string } | null>(null);
  const [role, setRole] = useState<string>('');
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [subData, setSubData] = useState<any>(null);
  const upgradeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    async function loadOrg() {
      try {
        const [orgRes, subRes] = await Promise.all([
          fetch(`/api/organizations/${orgSlug}`),
          fetch(`/api/organizations/${orgSlug}/subscription`).catch(() => null),
        ]);

        if (!orgRes.ok) {
          router.push('/dashboard');
          return;
        }
        const data = await orgRes.json();
        setOrg(data.organization);
        setRole(data.effectiveRole);
        setName(data.organization.name);
        setLogoUrl(data.organization.logoUrl || '');

        if (subRes && subRes.ok) {
          const subJson = await subRes.json();
          setSubData(subJson.subscription);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load organization settings');
      } finally {
        setLoading(false);
      }
    }
    loadOrg();
  }, [orgSlug, router, toast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org || saving) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/organizations/${org.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, logoUrl: logoUrl || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error || 'Failed to update organization';
        toast.error(errorMsg);
      } else {
        toast.success('Organization settings updated successfully');
      }
    } catch {
      toast.error('An unexpected error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!org || deactivating) return;
    setDeactivating(true);

    try {
      const res = await fetch(`/api/organizations/${org.id}/deactivate`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json();
        const errorMsg = data.error || 'Failed to deactivate organization';
        toast.error(errorMsg);
        setDeactivating(false);
        return;
      }
      toast.success('Organization deactivated successfully.');
      setShowDeactivateConfirm(false);
      router.push('/dashboard');
      router.refresh();
    } catch {
      toast.error('An unexpected error occurred during deactivation');
      setDeactivating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm font-medium text-slate-600">Loading Workspace Settings…</p>
        </div>
      </div>
    );
  }

  const isOwner = role === 'org_owner';

  return (
    <div className="pb-20 font-sans">
      {/* Top Action Bar with Top-Left Back Button */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-slate-200 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <BackButton
              href={`/organizations/${orgSlug}`}
              label={`Back to ${org?.name || 'Workspace'}`}
            />
            <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-800" />
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Workspace Settings
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Body */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* 1. General Profile Settings Card */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Organization Identity</h2>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Organization Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Organization Slug (Immutable Identifier)
              </label>
              <input
                type="text"
                disabled
                value={org?.slug}
                className="w-full px-3.5 py-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl cursor-not-allowed font-mono"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Used in public URL routes and API endpoints. Cannot be altered.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Logo Artwork URL
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full px-3.5 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving Changes…' : 'Save Organization'}
              </button>
            </div>
          </form>
        </div>

        {/* 2. Subscription & Plan Entitlements Section */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Subscription &amp; Attendee Capacity</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage commercial plan tiers, spot desk quotas, and automated thermal badge print features
                </p>
              </div>
            </div>

            <button
              ref={upgradeBtnRef}
              type="button"
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              View Commercial Plans
            </button>
          </div>

          {/* Expiration Warning Reminder (1 week before expiry) */}
          {subData?.isExpiringSoon && !subData?.isExpired && (
            <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <span className="font-bold text-sm block mb-0.5 text-amber-950 dark:text-amber-100">
                  Plan Expiring Soon
                </span>
                Your <strong>{subData.planName}</strong> will expire in{' '}
                <span className="font-bold text-amber-900 dark:text-amber-300">{subData.daysRemaining} day{subData.daysRemaining === 1 ? '' : 's'}</span> (on {new Date(subData.expiresAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}). Renew or upgrade your plan to maintain high-throughput attendee limits and advanced badge printing.
              </div>
              <button
                type="button"
                onClick={() => setIsSubscriptionModalOpen(true)}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition shrink-0"
              >
                Renew Plan
              </button>
            </div>
          )}

          {/* Expired Notification */}
          {subData?.isExpired && (
            <div className="p-4 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 flex items-start gap-3 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <span className="font-bold text-sm block mb-0.5 text-red-950 dark:text-red-100">
                  Plan Has Expired
                </span>
                Your previous plan expired on {new Date(subData.expiresAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}. Your workspace has been temporarily placed on the Free Starter Tier (50 attendees).
              </div>
              <button
                type="button"
                onClick={() => setIsSubscriptionModalOpen(true)}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition shrink-0"
              >
                Upgrade Now
              </button>
            </div>
          )}

          <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Current Plan: {subData?.planName || 'Free Starter Tier'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border dark:border-emerald-800/50">
                  {subData?.status === 'active' ? 'Active Plan' : 'Workspace Tier'}
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {subData?.planId === 'pro'
                  ? '₹2,000 / event'
                  : subData?.planId === 'pro_max'
                  ? '₹5,000 / event'
                  : '₹0 / Forever'}
              </span>
            </div>

            {/* Plan Dates Timeline Metadata */}
            {subData?.activatedAt && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-850 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">Date Activated</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {new Date(subData.activatedAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">Expiration Date</span>
                  <span className={`font-semibold ${subData?.isExpiringSoon ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-800 dark:text-slate-200'}`}>
                    {subData?.expiresAt
                      ? new Date(subData.expiresAt).toLocaleDateString(undefined, { dateStyle: 'long' })
                      : 'Lifetime / Perpetual'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">Plan Validity</span>
                  <span className="font-semibold text-purple-700 dark:text-purple-300">
                    {subData?.validityDuration || (subData?.planId === 'free' ? '15 Days Trial' : '1 Month (30 Days)')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">Days Remaining</span>
                  <span
                    className={`inline-block font-bold text-xs mt-0.5 px-2 py-0.5 rounded-md ${
                      subData?.isExpired
                        ? 'bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300'
                        : subData?.isExpiringSoon
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                    }`}
                  >
                    {subData?.isExpired
                      ? 'Expired'
                      : typeof subData?.daysRemaining === 'number'
                      ? `${subData.daysRemaining} Day${subData.daysRemaining === 1 ? '' : 's'} Remaining`
                      : 'Active'}
                  </span>
                </div>
              </div>
            )}

            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>{subData?.entitlements?.maxAttendees ? Number(subData.entitlements.maxAttendees).toLocaleString() : '50'} Attendees</strong> total capacity per event
                  {subData?.extraAttendeesQuota ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1">
                      (includes +{subData.extraAttendeesQuota} extra purchased attendees)
                    </span>
                  ) : null}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Spot Registration Desk enabled with instant QR check-in &amp; sequential badge numbering</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Over-quota capacity: ₹20 per attendee over plan limit via Razorpay</span>
              </li>
              {subData?.planId === 'free' && (
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>
                    Upgrade to <strong>Pro (1,000 attendees • ₹2,000)</strong> or <strong>Pro Max (5,000 attendees)</strong> to allow extra attendees and multi-desk operators
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* 3. Subscription Modal Container */}
        {isSubscriptionModalOpen && org && (
          <SubscriptionModal
            isOpen={isSubscriptionModalOpen}
            onClose={() => setIsSubscriptionModalOpen(false)}
            organizationId={org.id}
            currentPlanId={subData?.planId || 'free'}
            subscription={subData}
            triggerRef={upgradeBtnRef}
          />
        )}

        {/* 4. Danger Zone (Owner Only) */}
        {isOwner && (
          <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-red-200/80 dark:border-red-900/50 shadow-sm p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-950 dark:text-red-200">Workspace Deactivation</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Immediately restrict access for all members, staff desks, and ongoing event registrations
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Deactivating this workspace will revoke access for all event staff and operators. Attendee records and audit logs are preserved securely according to compliance rules.
            </p>

            <div className="pt-2">
              <button
                type="button"
                disabled={deactivating}
                onClick={() => setShowDeactivateConfirm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl shadow-xs transition"
              >
                {deactivating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                {deactivating ? 'Deactivating Workspace…' : 'Deactivate Organization'}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Accessible Branded Confirmation Dialog replacing native window.confirm */}
      <ConfirmDialog
        isOpen={showDeactivateConfirm}
        onClose={() => setShowDeactivateConfirm(false)}
        onConfirm={handleConfirmDeactivate}
        title="Deactivate Organization Workspace?"
        description="Are you sure you want to deactivate this organization? All events, spot desks, and member invitations will become immediately inaccessible."
        confirmText="Yes, Deactivate"
        variant="destructive"
        loading={deactivating}
      />
    </div>
  );
}
