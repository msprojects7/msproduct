'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BackButton from '@/app/components/ui/BackButton';
import { MailCheck, KeyRound, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialToken = searchParams.get('token') || '';

  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; orgName?: string; slug?: string } | null>(null);

  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
    }
  }, [initialToken]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ success: false, message: data.error || 'Failed to accept invitation' });
      } else {
        setResult({
          success: true,
          message: data.message || 'Invitation accepted successfully!',
          orgName: data.organization?.name,
          slug: data.organization?.slug,
        });
      }
    } catch {
      setResult({ success: false, message: 'An unexpected error occurred while accepting invitation' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      {/* Top Left Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <BackButton href="/dashboard" label="Back to Dashboard" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mb-3 border border-blue-200">
            <MailCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Accept Workspace Invitation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Join an event management team with your authenticated account
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          {result && (
            <div
              className={`p-4 rounded-xl border space-y-3 ${
                result.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {result.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                )}
                <span className="text-xs font-bold">{result.message}</span>
              </div>

              {result.success && result.slug && (
                <div className="pt-2">
                  <Link
                    href={`/organizations/${result.slug}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
                  >
                    Open {result.orgName || 'Workspace'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {!result?.success && (
            <form onSubmit={handleAccept} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Invitation Secret Token / Code *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste the 64-character token here"
                    className="w-full pl-10 pr-3.5 py-2 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !token.trim()}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Validating Token…' : 'Accept & Join Workspace'}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/dashboard"
                  className="text-xs text-slate-500 hover:text-slate-800 transition"
                >
                  Return to Dashboard
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-xs">
          Loading invitation…
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}
