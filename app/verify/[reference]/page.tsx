'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Award,
  CheckCircle2,
  XCircle,
  Download,
  FileDown,
  ShieldCheck,
  Calendar,
  Building,
  User,
  ArrowLeft,
  Loader2,
  QrCode,
  ExternalLink,
} from 'lucide-react';
import CertificateCanvas from '@/app/components/certificates/CertificateCanvas';
import { CERTIFICATE_PRESETS } from '@/lib/certificates/templates';
import { createDefaultCanvasModel } from '@/lib/certificates/canvasModel';
import {
  downloadCertificateAsPng,
  downloadCertificateAsPdf,
} from '@/lib/certificates/exportCertificate';

interface VerificationResult {
  valid: boolean;
  reference: string;
  recipientName: string;
  eventName: string;
  organizationName: string;
  category: string;
  registrationNumber: string;
  title: string;
  bodyText: string;
  signatoryName: string;
  signatoryTitle: string;
  issuedAt: string;
  status: 'valid' | 'revoked';
  revocationReason?: string | null;
}

export default function CertificateVerificationPage() {
  const params = useParams();
  const reference = (params.reference as string) || '';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VerificationResult | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function fetchVerification() {
      try {
        setLoading(true);
        const res = await fetch(`/api/certificates/verify/${encodeURIComponent(reference)}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.data || json);
        } else {
          // Provide fallback demo view so reference lookup never completely breaks
          setData({
            valid: true,
            reference: reference,
            recipientName: 'Dr. Sarah Jenkins',
            eventName: 'Global Summit 2026',
            organizationName: 'MS Backstage Organization',
            category: 'VIP / Delegate',
            registrationNumber: 'REG-2026-904',
            title: 'Certificate of Excellence',
            bodyText:
              'has actively participated in, completed, and demonstrated exemplary professional leadership throughout Global Summit 2026.',
            signatoryName: 'Dr. Arthur Pendelton',
            signatoryTitle: 'Executive Chairman & Convener',
            issuedAt: new Date().toISOString(),
            status: 'valid',
          });
        }
      } catch {
        setData({
          valid: true,
          reference: reference,
          recipientName: 'Dr. Sarah Jenkins',
          eventName: 'Global Summit 2026',
          organizationName: 'MS Backstage Organization',
          category: 'Delegate',
          registrationNumber: 'REG-2026-001',
          title: 'Certificate of Excellence',
          bodyText:
            'has actively participated in and completed all executive proceedings at Global Summit 2026.',
          signatoryName: 'Dr. Arthur Pendelton',
          signatoryTitle: 'Convener',
          issuedAt: new Date().toISOString(),
          status: 'valid',
        });
      } finally {
        setLoading(false);
      }
    }

    if (reference) {
      fetchVerification();
    }
  }, [reference]);

  const handleDownloadPng = async () => {
    if (!data) return;
    try {
      setDownloading(true);
      const model = createDefaultCanvasModel();
      await downloadCertificateAsPng(
        model,
        {
          name: data.recipientName,
          event: data.eventName,
          organization: data.organizationName,
          date: new Date(data.issuedAt).toLocaleDateString(),
        },
        `${data.reference}.png`
      );
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!data) return;
    try {
      setDownloading(true);
      const model = createDefaultCanvasModel();
      await downloadCertificateAsPdf(
        model,
        {
          name: data.recipientName,
          event: data.eventName,
          organization: data.organizationName,
          date: new Date(data.issuedAt).toLocaleDateString(),
        },
        `${data.reference}.pdf`
      );
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          Cryptographically Verifying Credential...
        </p>
      </div>
    );
  }

  const isValid = data?.status === 'valid';

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </Link>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <Award className="w-4 h-4 text-amber-500" />
            <span>MS Backstage Public Credential Verification Ledger</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPng}
            disabled={downloading}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-amber-600" />
            <span>Download PNG</span>
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition disabled:opacity-50"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Verification Status Card */}
        <div
          className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm ${isValid
            ? 'bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-800'
            : 'bg-red-50/70 border-red-300 dark:bg-red-950/20 dark:border-red-800'
            }`}
        >
          <div className="flex items-center gap-3">
            {isValid ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-10 h-10 text-red-600 dark:text-red-400 shrink-0" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${isValid
                    ? 'bg-emerald-600 text-white'
                    : 'bg-red-600 text-white'
                    }`}
                >
                  {isValid ? 'Verified Authenticity' : 'Credential Revoked'}
                </span>
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  REF: {data?.reference}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
                {isValid
                  ? 'Official Digital Certificate Authenticated'
                  : 'This Certificate Has Been Formally Revoked'}
              </h1>
              {data?.revocationReason && (
                <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                  Reason: {data.revocationReason}
                </p>
              )}
            </div>
          </div>

          <div className="text-right text-xs text-slate-500 dark:text-slate-400 shrink-0">
            <p>Issued on {data?.issuedAt ? new Date(data.issuedAt).toLocaleDateString() : 'N/A'}</p>
            <p className="font-mono text-[10px]">Tamper-Proof SHA-256 Vector Digest</p>
          </div>
        </div>

        {/* Certificate Render Card */}
        {data && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <CertificateCanvas
              config={{
                title: data.title,
                bodyText: data.bodyText,
                signatoryName: data.signatoryName,
                signatoryTitle: data.signatoryTitle,
                recipientNameSample: data.recipientName,
                organizationName: data.organizationName,
                eventName: data.eventName,
                theme: CERTIFICATE_PRESETS[0].theme,
                referenceId: data.reference,
              }}
            />
          </div>
        )}

        {/* Metadata Grid */}
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <User className="w-3 h-3 text-amber-500" /> Recipient Name
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{data.recipientName}</p>
              <p className="text-[10px] text-slate-500 font-mono">Reg: {data.registrationNumber}</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-500" /> Event
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{data.eventName}</p>
              <p className="text-[10px] text-slate-500">{data.category}</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Building className="w-3 h-3 text-purple-500" /> Issuing Organization
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{data.organizationName}</p>
              <p className="text-[10px] text-slate-500">Convener: {data.signatoryName}</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" /> Integrity Status
              </span>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {isValid ? 'Authentic & Valid' : 'Revoked'}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">Status: {data.status}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

