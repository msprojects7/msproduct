'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Award,
  Plus,
  Send,
  ShieldAlert,
  Loader2,
  Sparkles,
  Palette,
  Eye,
  Edit3,
  Trash2,
  X,
  CheckCircle,
  Download,
  FileDown,
} from 'lucide-react';
import { CERTIFICATE_PRESETS, CertificateTemplatePreset } from '@/lib/certificates/templates';
import CertificateCanvas, { CertificateDesignConfig } from '@/app/components/certificates/CertificateCanvas';
import CanvaCertificateDesigner from '@/app/components/certificates/CanvaCertificateDesigner';
import {
  CertificateCanvasModel,
  createDefaultCanvasModel,
} from '@/lib/certificates/canvasModel';
import {
  downloadCertificateAsPng,
  downloadCertificateAsPdf,
} from '@/lib/certificates/exportCertificate';

interface CertificateTemplate {
  id: string;
  title: string;
  bodyText: string;
  signatoryName: string;
  signatoryTitle: string;
  criteriaType: 'check_in' | 'session_count' | 'manual';
  minSessionCount: number;
  logoUrl?: string | null;
  signatureUrl?: string | null;
  isActive: boolean;
  createdAt: string;
}

interface IssuedCertRow {
  id: string;
  certificateReference: string;
  status: string;
  issuedAt: string;
  attendeeName: string;
  registrationNumber: string;
  category: string;
}

export default function CertificateStudioPage() {
  const params = useParams();
  const eventSlug = params.eventSlug as string;

  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [issuedCerts, setIssuedCerts] = useState<IssuedCertRow[]>([]);
  const [stats, setStats] = useState<{ totalIssued: number; eligibleAttendees: number }>({
    totalIssued: 0,
    eligibleAttendees: 0,
  });

  // Active Tab: 'templates' | 'issued' | 'presets'
  const [activeTab, setActiveTab] = useState<'templates' | 'issued' | 'presets'>('templates');

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editorSubTab, setEditorSubTab] = useState<'content' | 'style' | 'signatory' | 'criteria'>('content');

  // Certificate Editor Form State
  const [title, setTitle] = useState('Certificate of Attendance');
  const [bodyText, setBodyText] = useState(
    'has actively participated and successfully completed all designated proceedings of {{event}}.'
  );
  const [signatoryName, setSignatoryName] = useState('Dr. Event Chair');
  const [signatoryTitle, setSignatoryTitle] = useState('Organizing Chairperson & Director');
  const [sampleRecipient, setSampleRecipient] = useState('Dr. Sarah Jenkins');
  const [criteriaType, setCriteriaType] = useState<'check_in' | 'session_count' | 'manual'>('check_in');
  const [minSessionCount, setMinSessionCount] = useState(1);
  const [logoUrl, setLogoUrl] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');

  // Styling & Theme state
  const [selectedPresetId, setSelectedPresetId] = useState<string>('classic_gold');
  const [theme, setTheme] = useState<CertificateTemplatePreset['theme']>(CERTIFICATE_PRESETS[0].theme);
  const [currentCanvasModel, setCurrentCanvasModel] = useState<CertificateCanvasModel | null>(null);

  // Preview Modal
  const [previewTemplate, setPreviewTemplate] = useState<CertificateTemplate | null>(null);

  // Bulk Issue Confirmation Modal (Zero Native Alerts)
  const [bulkIssueModal, setBulkIssueModal] = useState<{ open: boolean; template: CertificateTemplate | null }>({
    open: false,
    template: null,
  });

  // Operations State
  const [saving, setSaving] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Revoke Modal
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<IssuedCertRow | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  const fetchCertificatesData = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventSlug}/certificates`);
      if (res.ok) {
        const json = await res.json();
        setTemplates(json.templates || []);
        setIssuedCerts(json.issuedCertificates || []);
        if (json.stats) setStats(json.stats);
      }
    } catch (err) {
      console.error('Certificates load error:', err);
    } finally {
      setLoading(false);
    }
  }, [eventSlug]);

  useEffect(() => {
    fetchCertificatesData();
  }, [fetchCertificatesData]);

  // Apply a preset to editor
  const applyPreset = (preset: CertificateTemplatePreset) => {
    setSelectedPresetId(preset.id);
    setTitle(preset.defaults.title);
    setBodyText(preset.defaults.bodyText);
    setSignatoryName(preset.defaults.signatoryName);
    setSignatoryTitle(preset.defaults.signatoryTitle);
    setCriteriaType(preset.defaults.criteriaType);
    setMinSessionCount(preset.defaults.minSessionCount);
    setTheme(preset.theme);
    setCurrentCanvasModel(createDefaultCanvasModel(preset.id));
  };

  // Open Editor for New Template
  const handleOpenCreate = (preset?: CertificateTemplatePreset) => {
    setEditingTemplateId(null);
    if (preset) {
      applyPreset(preset);
    } else {
      applyPreset(CERTIFICATE_PRESETS[0]);
    }
    setIsEditorOpen(true);
  };

  // Open Editor for Existing Template
  const handleOpenEdit = (tpl: CertificateTemplate) => {
    setEditingTemplateId(tpl.id);
    setTitle(tpl.title);
    setSignatoryName(tpl.signatoryName);
    setSignatoryTitle(tpl.signatoryTitle);
    setCriteriaType(tpl.criteriaType);
    setMinSessionCount(tpl.minSessionCount);
    setLogoUrl(tpl.logoUrl || '');
    setSignatureUrl(tpl.signatureUrl || '');

    // Check if bodyText encodes custom styling or full canvasModel
    try {
      if (tpl.bodyText.startsWith('{') && tpl.bodyText.endsWith('}')) {
        const parsed = JSON.parse(tpl.bodyText);
        setBodyText(parsed.statement || tpl.bodyText);
        if (parsed.theme) setTheme(parsed.theme);
        if (parsed.presetId) setSelectedPresetId(parsed.presetId);
        if (parsed.canvasModel) {
          setCurrentCanvasModel(parsed.canvasModel);
        } else {
          const model = createDefaultCanvasModel(parsed.presetId || 'classic_gold');
          setCurrentCanvasModel(model);
        }
      } else {
        setBodyText(tpl.bodyText);
        setCurrentCanvasModel(createDefaultCanvasModel('classic_gold'));
      }
    } catch {
      setBodyText(tpl.bodyText);
      setCurrentCanvasModel(createDefaultCanvasModel('classic_gold'));
    }

    setIsEditorOpen(true);
  };

  // Save Template from Canva Certificate Designer
  const handleSaveFromCanva = async (
    model: CertificateCanvasModel,
    savedTitle: string,
    savedSignatoryName: string,
    savedSignatoryTitle: string
  ) => {
    setSaving(true);
    try {
      const action = editingTemplateId ? 'update_template' : 'create_template';
      const statementEl = model.elements.find((e) => e.id === 'statement' || e.type === 'body');
      const statementText = statementEl?.content || bodyText;

      const payloadBodyText = JSON.stringify({
        statement: statementText,
        presetId: selectedPresetId,
        theme: {
          fontFamily: theme.fontFamily || 'serif',
          primaryColor: model.border.color || '#d97706',
          accentColor: '#d97706',
          backgroundColor: model.background.color || '#fffbeb',
          borderStyle: model.border.style || 'double_gold',
        },
        canvasModel: model,
      });

      const res = await fetch(`/api/events/${eventSlug}/certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          templateId: editingTemplateId || undefined,
          title: savedTitle || title,
          bodyText: payloadBodyText,
          signatoryName: savedSignatoryName || signatoryName,
          signatoryTitle: savedSignatoryTitle || signatoryTitle,
          criteriaType,
          minSessionCount,
          logoUrl: logoUrl.trim() || null,
          signatureUrl: signatureUrl.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save certificate template');

      setIsEditorOpen(false);
      setNotification({
        type: 'success',
        message: editingTemplateId
          ? 'Certificate template updated successfully in Canva Studio!'
          : 'Certificate template created and ready for issuance!',
      });
      fetchCertificatesData();
    } catch (err: unknown) {
      const error = err as Error;
      setNotification({ type: 'error', message: error.message || 'Error saving template' });
    } finally {
      setSaving(false);
    }
  };

  // Save Template (Create or Update)
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payloadBodyText = JSON.stringify({
        statement: bodyText,
        presetId: selectedPresetId,
        theme,
      });

      const action = editingTemplateId ? 'update_template' : 'create_template';
      const res = await fetch(`/api/events/${eventSlug}/certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          templateId: editingTemplateId || undefined,
          title,
          bodyText: payloadBodyText,
          signatoryName,
          signatoryTitle,
          criteriaType,
          minSessionCount,
          logoUrl: logoUrl.trim() || null,
          signatureUrl: signatureUrl.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save certificate template');

      setIsEditorOpen(false);
      setNotification({
        type: 'success',
        message: editingTemplateId
          ? 'Certificate template updated successfully!'
          : 'Certificate template created and ready for issuance!',
      });
      fetchCertificatesData();
    } catch (err: unknown) {
      const error = err as Error;
      setNotification({ type: 'error', message: error.message || 'Error saving template' });
    } finally {
      setSaving(false);
    }
  };

  // Delete Template
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const res = await fetch(`/api/events/${eventSlug}/certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_template',
          templateId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete template');
      }
      setNotification({ type: 'success', message: 'Certificate template deleted.' });
      fetchCertificatesData();
    } catch (err: unknown) {
      const error = err as Error;
      setNotification({ type: 'error', message: error.message || 'Error deleting template' });
    }
  };

  // Handle Bulk Issuance
  const handleBulkIssue = async (templateId: string) => {
    setIssuing(true);
    setNotification({ type: 'success', message: 'Issuing official digital certificates to eligible attendees...' });
    try {
      const res = await fetch(`/api/events/${eventSlug}/certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'issue_bulk',
          templateId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Issuance failed');

      setNotification({
        type: 'success',
        message: data.message || `Successfully issued ${data.count} certificates!`,
      });
      fetchCertificatesData();
    } catch (err: unknown) {
      const error = err as Error;
      setNotification({ type: 'error', message: error.message || 'Error issuing certificates' });
    } finally {
      setIssuing(false);
    }
  };

  // Handle Revoke
  const handleConfirmRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeTarget || !revokeReason.trim()) return;
    setRevoking(true);
    try {
      const res = await fetch(`/api/events/${eventSlug}/certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke',
          certificateId: revokeTarget.id,
          reason: revokeReason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Revocation failed');

      setRevokeModalOpen(false);
      setRevokeTarget(null);
      setRevokeReason('');
      setNotification({ type: 'success', message: 'Certificate revoked and flagged invalid.' });
      fetchCertificatesData();
    } catch (err: unknown) {
      const error = err as Error;
      setNotification({ type: 'error', message: error.message || 'Revocation error' });
    } finally {
      setRevoking(false);
    }
  };

  // Live Canvas Design Config for Editor
  const currentCanvasConfig: CertificateDesignConfig = useMemo(() => {
    return {
      title,
      bodyText,
      signatoryName,
      signatoryTitle,
      recipientNameSample: sampleRecipient,
      organizationName: 'MS Backstage Organization',
      eventName: eventSlug.toUpperCase(),
      theme,
      logoUrl: logoUrl.trim() || undefined,
      signatureUrl: signatureUrl.trim() || undefined,
      referenceId: 'CERT-PREVIEW-001',
    };
  }, [title, bodyText, signatoryName, signatoryTitle, sampleRecipient, eventSlug, theme, logoUrl, signatureUrl]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-200">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {loading ? (
          <div className="p-16 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
            <span className="text-xs">Loading certificate templates and issuance registry...</span>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                  <Award className="w-6 h-6 text-amber-500 dark:text-amber-400" />
                  <span>Certificate Studio & Credential Issuance</span>
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Design certificates using 10 professional presets or custom canvas editing, define issuance criteria, and generate verifiable credentials.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleOpenCreate()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-600/25 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Design Certificate</span>
                </button>
              </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Active Templates</span>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{templates.length}</p>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl shadow-xs">
                <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Certificates Issued</span>
                <p className="text-2xl font-extrabold text-amber-900 dark:text-amber-300 mt-1">{stats.totalIssued}</p>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl shadow-xs">
                <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Eligible by Check-In</span>
                <p className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-300 mt-1">{stats.eligibleAttendees}</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-2xl shadow-xs">
                <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-400 uppercase tracking-wider">Issuance Format</span>
                <p className="text-xl font-extrabold text-blue-900 dark:text-blue-300 mt-1">Pure Vector PDF</p>
              </div>
            </div>

            {/* Notification Banner */}
            {notification && (
              <div
                className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${notification.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
                  : 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800/80 text-red-900 dark:text-red-200'
                  }`}
              >
                <span>{notification.message}</span>
                <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white ml-2">
                  ✕
                </button>
              </div>
            )}

            {/* Tabs Bar */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <button
                onClick={() => setActiveTab('templates')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'templates'
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Configured Templates ({templates.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('presets')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'presets'
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>10 Ready-Made Presets</span>
              </button>

              <button
                onClick={() => setActiveTab('issued')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'issued'
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Issued Registry ({issuedCerts.length})</span>
              </button>
            </div>

            {/* TAB 1: Configured Templates */}
            {activeTab === 'templates' && (
              <div className="space-y-4">
                {templates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((tpl) => {
                      let parsedBody = tpl.bodyText;
                      try {
                        if (tpl.bodyText.startsWith('{') && tpl.bodyText.endsWith('}')) {
                          parsedBody = JSON.parse(tpl.bodyText).statement || tpl.bodyText;
                        }
                      } catch { }

                      return (
                        <div
                          key={tpl.id}
                          className="p-5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between hover:border-amber-500/50 transition shadow-xs"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{tpl.title}</h3>
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-500/20 uppercase shrink-0">
                                Criteria: {tpl.criteriaType}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 italic line-clamp-2">"{parsedBody}"</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Signatory: <strong className="text-slate-800 dark:text-white">{tpl.signatoryName}</strong> ({tpl.signatoryTitle})
                            </p>
                          </div>

                          <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenEdit(tpl)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-xs"
                                title="Edit in Canvas Studio"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                                <span>Edit</span>
                              </button>

                              <button
                                onClick={() => setPreviewTemplate(tpl)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-xs"
                                title="Preview Certificate"
                              >
                                <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                <span>Preview</span>
                              </button>

                              <button
                                onClick={() => handleDeleteTemplate(tpl.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 transition"
                                title="Delete Template"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <button
                              onClick={() => setBulkIssueModal({ open: true, template: tpl })}
                              disabled={issuing}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition shrink-0"
                            >
                              {issuing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                              <span>Issue to Eligible</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-white dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl space-y-3">
                    <Award className="w-10 h-10 text-amber-500/40 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Certificate Templates Configured</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                      Get started quickly by choosing one of our 10 professional ready-made presets below, or design your own in the visual canvas editor.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => setActiveTab('presets')}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2 shadow-xs"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Browse 10 Ready-Made Presets</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: 10 Ready-Made Presets */}
            {activeTab === 'presets' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                      <span>10 Ready-to-Use Certificate Templates</span>
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Pick any template to immediately customize in the canvas studio and issue to your attendees.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {CERTIFICATE_PRESETS.map((preset, index) => (
                    <div
                      key={preset.id}
                      className="group p-4 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 rounded-2xl space-y-3 flex flex-col justify-between transition shadow-xs"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-500/20">
                            Preset #{index + 1}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{preset.category}</span>
                        </div>

                        {/* Mini Visual Preview Card */}
                        <div
                          className="h-28 rounded-xl border p-3 flex flex-col justify-between text-center relative overflow-hidden select-none"
                          style={{
                            backgroundColor: preset.theme.bgColor,
                            backgroundImage: preset.theme.bgGradient,
                            borderColor: `${preset.theme.borderColor}55`,
                            color: preset.theme.textColor,
                          }}
                        >
                          <div className="text-[8px] font-bold uppercase tracking-widest" style={{ color: preset.theme.accentColor }}>
                            {eventSlug.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-tight" style={{ color: preset.theme.titleColor }}>
                              {preset.defaults.title}
                            </p>
                            <p className="text-[9px] font-semibold opacity-90 mt-0.5">Jane Doe</p>
                          </div>
                          <div className="flex justify-between items-center text-[7px] opacity-75 pt-1 border-t border-black/10">
                            <span>{preset.defaults.signatoryName}</span>
                            <span className="font-mono">VERIFIED</span>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white">{preset.name}</h3>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{preset.description}</p>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => handleOpenCreate(preset)}
                          className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Customize in Canvas</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: Issued Registry */}
            {activeTab === 'issued' && (
              <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Issued Credentials Ledger</h2>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{issuedCerts.length} records</span>
                </div>

                {issuedCerts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">
                          <th className="py-2.5 px-3">Reference ID</th>
                          <th className="py-2.5 px-3">Recipient</th>
                          <th className="py-2.5 px-3">Reg #</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Issued Date</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                        {issuedCerts.map((cert) => {
                          const isValid = cert.status === 'valid';
                          return (
                            <tr key={cert.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                              <td className="py-2.5 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                                {cert.certificateReference}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{cert.attendeeName}</td>
                              <td className="py-2.5 px-3 text-blue-600 dark:text-blue-400 font-mono text-[11px]">
                                {cert.registrationNumber}
                              </td>
                              <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{cert.category}</td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${isValid
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                    : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                                    }`}
                                >
                                  {cert.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                                {new Date(cert.issuedAt).toLocaleDateString()}
                              </td>
                              <td className="py-2.5 px-3 text-right space-x-2">
                                <Link
                                  href={`/verify/${cert.certificateReference}`}
                                  target="_blank"
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-semibold transition inline-block shadow-xs"
                                >
                                  Verify & Download
                                </Link>
                                {isValid && (
                                  <button
                                    onClick={() => {
                                      setRevokeTarget(cert);
                                      setRevokeModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg text-[11px] font-semibold transition"
                                  >
                                    Revoke
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-4">No certificates issued yet.</p>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* CANVA-STYLE FULL INTERACTIVE DESIGNER STUDIO MODAL */}
      {isEditorOpen && (
        <CanvaCertificateDesigner
          initialModel={currentCanvasModel || createDefaultCanvasModel(selectedPresetId)}
          sampleRecipientName={sampleRecipient}
          eventName={eventSlug.toUpperCase()}
          organizationName="MS Backstage Organization"
          onSave={handleSaveFromCanva}
          onClose={() => setIsEditorOpen(false)}
          saving={saving}
        />
      )}

      {/* READ-ONLY PREVIEW MODAL */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Certificate Preview: {previewTemplate.title}</span>
              </h3>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-2">
              <CertificateCanvas
                config={{
                  title: previewTemplate.title,
                  bodyText: (() => {
                    try {
                      if (previewTemplate.bodyText.startsWith('{')) {
                        return JSON.parse(previewTemplate.bodyText).statement || previewTemplate.bodyText;
                      }
                    } catch { }
                    return previewTemplate.bodyText;
                  })(),
                  signatoryName: previewTemplate.signatoryName,
                  signatoryTitle: previewTemplate.signatoryTitle,
                  recipientNameSample: 'Dr. Sarah Jenkins',
                  organizationName: 'MS Backstage Organization',
                  eventName: eventSlug.toUpperCase(),
                  theme: (() => {
                    try {
                      if (previewTemplate.bodyText.startsWith('{')) {
                        return JSON.parse(previewTemplate.bodyText).theme || CERTIFICATE_PRESETS[0].theme;
                      }
                    } catch { }
                    return CERTIFICATE_PRESETS[0].theme;
                  })(),
                  logoUrl: previewTemplate.logoUrl,
                  signatureUrl: previewTemplate.signatureUrl,
                  referenceId: 'CERT-DEMO-SAMPLE',
                }}
              />
            </div>

            <div className="pt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    let presetId = 'classic_gold';
                    let statement = previewTemplate.bodyText;
                    let savedModel: CertificateCanvasModel | null = null;
                    try {
                      if (previewTemplate.bodyText.startsWith('{')) {
                        const parsed = JSON.parse(previewTemplate.bodyText);
                        presetId = parsed.presetId || 'classic_gold';
                        statement = parsed.statement || previewTemplate.bodyText;
                        if (parsed.canvasModel) {
                          savedModel = parsed.canvasModel;
                        }
                      }
                    } catch { }

                    const model: CertificateCanvasModel = savedModel
                      ? JSON.parse(JSON.stringify(savedModel))
                      : createDefaultCanvasModel(presetId);

                    model.elements = model.elements.map((el) => {
                      if (el.type === 'title') return { ...el, content: previewTemplate.title };
                      if (el.type === 'body') return { ...el, content: statement };
                      if (el.type === 'signatory')
                        return {
                          ...el,
                          signatoryName: previewTemplate.signatoryName,
                          signatoryTitle: previewTemplate.signatoryTitle,
                        };
                      if (el.type === 'logo' && previewTemplate.logoUrl)
                        return { ...el, src: previewTemplate.logoUrl };
                      return el;
                    });

                    await downloadCertificateAsPng(
                      model,
                      {
                        name: 'Dr. Sarah Jenkins',
                        event: eventSlug.toUpperCase(),
                        organization: 'MS Backstage Organization',
                      },
                      `${previewTemplate.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-preview.png`
                    );
                  }}
                  className="px-3 py-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-amber-600" />
                  <span>Download PNG</span>
                </button>

                <button
                  onClick={async () => {
                    let presetId = 'classic_gold';
                    let statement = previewTemplate.bodyText;
                    let savedModel: CertificateCanvasModel | null = null;
                    try {
                      if (previewTemplate.bodyText.startsWith('{')) {
                        const parsed = JSON.parse(previewTemplate.bodyText);
                        presetId = parsed.presetId || 'classic_gold';
                        statement = parsed.statement || previewTemplate.bodyText;
                        if (parsed.canvasModel) {
                          savedModel = parsed.canvasModel;
                        }
                      }
                    } catch { }

                    const model: CertificateCanvasModel = savedModel
                      ? JSON.parse(JSON.stringify(savedModel))
                      : createDefaultCanvasModel(presetId);

                    model.elements = model.elements.map((el) => {
                      if (el.type === 'title') return { ...el, content: previewTemplate.title };
                      if (el.type === 'body') return { ...el, content: statement };
                      if (el.type === 'signatory')
                        return {
                          ...el,
                          signatoryName: previewTemplate.signatoryName,
                          signatoryTitle: previewTemplate.signatoryTitle,
                        };
                      if (el.type === 'logo' && previewTemplate.logoUrl)
                        return { ...el, src: previewTemplate.logoUrl };
                      return el;
                    });

                    await downloadCertificateAsPdf(
                      model,
                      {
                        name: 'Dr. Sarah Jenkins',
                        event: eventSlug.toUpperCase(),
                        organization: 'MS Backstage Organization',
                      },
                      `${previewTemplate.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-preview.pdf`
                    );
                  }}
                  className="px-3 py-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 shadow-xs"
                >
                  <FileDown className="w-3.5 h-3.5 text-amber-600" />
                  <span>Download PDF</span>
                </button>
              </div>

              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-200 dark:border-slate-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revocation Modal */}
      {revokeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-6 h-6 text-red-500 dark:text-red-400" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Revoke Issued Credential</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  Reference: {revokeTarget?.certificateReference}
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmRevoke} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Revocation
                </label>
                <textarea
                  required
                  rows={3}
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="e.g. Duplicate issuance, attendee request, or administrative cancellation"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRevokeModalOpen(false);
                    setRevokeTarget(null);
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={revoking}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-600/25 transition disabled:opacity-50"
                >
                  {revoking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Revocation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Bulk Issuance In-App Modal (Strictly Zero Native Alert/Confirm) */}
      {bulkIssueModal.open && bulkIssueModal.template && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Issue Digital Certificates</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Official Credential Registry</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Issue official digital credentials to all eligible attendees for{' '}
              <strong className="text-slate-900 dark:text-white">"{bulkIssueModal.template.title}"</strong> now?
              Attendees who meet the criteria (
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {bulkIssueModal.template.criteriaType === 'check_in' ? 'Check-in Verified' : 'Session Attendance'}
              </span>
              ) will receive their verified certificate immediately.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setBulkIssueModal({ open: false, template: null })}
                disabled={issuing}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition border border-slate-200 dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={issuing}
                onClick={async () => {
                  const tplId = bulkIssueModal.template?.id;
                  setBulkIssueModal({ open: false, template: null });
                  if (tplId) {
                    await handleBulkIssue(tplId);
                  }
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition"
              >
                {issuing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Confirm & Issue</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
