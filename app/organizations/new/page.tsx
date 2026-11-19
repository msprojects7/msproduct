'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/app/components/ui/Toast';
import BackButton from '@/app/components/ui/BackButton';
import { Building2, Sparkles, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function NewOrganizationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from name if not manually modified
  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(autoSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          logoUrl: logoUrl || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error || 'Failed to create organization';
        setError(errorMsg);
        toast.error(errorMsg);
        setLoading(false);
        return;
      }

      toast.success('Workspace created successfully!');
      router.push(`/organizations/${data.organization.slug}`);
      router.refresh();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-20 transition-colors duration-200">
      {/* Top Header with Mandatory Top-Left Back Button */}
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton href="/dashboard" label="Back to Dashboard" />
            <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-slate-800" />
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                Create New Organization
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Multi-Tenant Workspace &amp; Event Operations
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Form Container */}
      <main className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Workspace Setup</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You will automatically become the primary Owner of this workspace.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl text-xs text-red-800 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Organization Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Apex Health Conferences"
                className="w-full px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Workspace URL Slug *
              </label>
              <div className="flex items-center">
                <span className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-300 dark:border-slate-700 rounded-l-2xl text-xs text-slate-600 dark:text-slate-400 font-mono">
                  /organizations/
                </span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="apex-health-conferences"
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-r-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-mono placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Unique identifier for workspace URLs. Letters, numbers, and hyphens only.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Brand Logo URL (Optional)
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/dashboard"
                className="px-5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || !name.trim() || !slug.trim()}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 rounded-full shadow-md shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? 'Creating Workspace…' : 'Create Workspace'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
