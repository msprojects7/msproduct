'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  FileText,
  Trash2,
  Edit3,
  Eye,
  CheckCircle2,
  HelpCircle,
  Copy,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Layers,
  Check,
  ChevronDown,
  Calendar,
  Globe,
  Upload,
  AlignLeft,
  Hash,
  Phone,
  Mail,
  ToggleLeft,
  X,
  Loader2,
} from 'lucide-react';
import BackButton from '@/app/components/ui/BackButton';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';
import { useToast } from '@/app/components/ui/Toast';

interface FormField {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  description: string | null;
  placeholder: string | null;
  isRequired: boolean;
  defaultValue: string | null;
  options: { label: string; value: string }[] | null;
  validationRules: Record<string, unknown> | null;
  conditionalLogic: {
    dependsOnFieldKey: string;
    operator: 'equals' | 'not_equals' | 'contains';
    value: unknown;
  } | null;
  displayOrder: number;
  isVisible: boolean;
}

interface RegistrationFormMeta {
  id: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  settings: Record<string, unknown> | null;
}

const FIELD_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  text: AlignLeft,
  textarea: FileText,
  email: Mail,
  phone: Phone,
  number: Hash,
  dropdown: ChevronDown,
  radio: ToggleLeft,
  checkbox: CheckCircle2,
  date: Calendar,
  country: Globe,
  state: Globe,
  address: AlignLeft,
  url: Globe,
  file: Upload,
  consent: Check,
  section: Layers,
  info: HelpCircle,
};

const PALETTE_FIELDS = [
  { type: 'text', label: 'Short Text', desc: 'Single-line text response' },
  { type: 'textarea', label: 'Long Text', desc: 'Multi-line detailed answer' },
  { type: 'email', label: 'Email Address', desc: 'Email with format validation' },
  { type: 'phone', label: 'Phone Number', desc: 'Mobile/telephone number' },
  { type: 'number', label: 'Number', desc: 'Numeric values only' },
  { type: 'dropdown', label: 'Dropdown Select', desc: 'Single pick from options' },
  { type: 'radio', label: 'Single Choice (Radio)', desc: 'Select one option' },
  { type: 'checkbox', label: 'Multiple Choice', desc: 'Select one or more options' },
  { type: 'date', label: 'Date Picker', desc: 'Date selection' },
  { type: 'country', label: 'Country', desc: 'Country selector' },
  { type: 'state', label: 'State / Province', desc: 'State selector' },
  { type: 'address', label: 'Mailing Address', desc: 'Postal address' },
  { type: 'url', label: 'Website / Portfolio', desc: 'Web URL' },
  { type: 'file', label: 'File Upload', desc: 'Documents, PDFs or ID card' },
  { type: 'consent', label: 'Consent / Terms', desc: 'Terms & conditions checkbox' },
  { type: 'section', label: 'Section Header', desc: 'Divider and section title' },
  { type: 'info', label: 'Informational Note', desc: 'Callout guidance box' },
];

export default function RegistrationFormBuilderPage() {
  const params = useParams();
  const eventSlug = params?.eventSlug as string;
  const { toast } = useToast();

  const [formMeta, setFormMeta] = useState<RegistrationFormMeta | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'builder' | 'preview'>('builder');

  // Modal / Drawer state for adding or editing field
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<FormField | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [publishSaving, setPublishSaving] = useState(false);

  // Field Editor Form State
  const [fieldFormData, setFieldFormData] = useState({
    fieldKey: '',
    fieldLabel: '',
    fieldType: 'text',
    description: '',
    placeholder: '',
    isRequired: false,
    optionsText: '', // newline separated
    hasCondition: false,
    conditionFieldKey: '',
    conditionOperator: 'equals' as 'equals' | 'not_equals' | 'contains',
    conditionValue: '',
  });

  // Preview Responses State
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, unknown>>({});
  const [previewSubmitted, setPreviewSubmitted] = useState(false);

  const fetchForm = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/events/${eventSlug}/registration-forms`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch form configuration');

      setFormMeta(data.form);
      setFields(data.fields || []);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error loading registration form builder');
    } finally {
      setLoading(false);
    }
  }, [eventSlug]);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  const handleOpenAddField = (fieldType = 'text') => {
    setEditingField(null);
    setFieldFormData({
      fieldKey: '',
      fieldLabel: '',
      fieldType,
      description: '',
      placeholder: '',
      isRequired: false,
      optionsText: ['dropdown', 'radio', 'checkbox'].includes(fieldType)
        ? 'Option 1\nOption 2\nOption 3'
        : '',
      hasCondition: false,
      conditionFieldKey: '',
      conditionOperator: 'equals',
      conditionValue: '',
    });
    setFormError(null);
    setShowFieldModal(true);
  };

  const handleOpenEditField = (field: FormField) => {
    setEditingField(field);
    const optionsText = field.options ? field.options.map((o) => o.label).join('\n') : '';
    setFieldFormData({
      fieldKey: field.fieldKey,
      fieldLabel: field.fieldLabel,
      fieldType: field.fieldType,
      description: field.description || '',
      placeholder: field.placeholder || '',
      isRequired: field.isRequired,
      optionsText,
      hasCondition: !!field.conditionalLogic,
      conditionFieldKey: field.conditionalLogic?.dependsOnFieldKey || '',
      conditionOperator: field.conditionalLogic?.operator || 'equals',
      conditionValue: String(field.conditionalLogic?.value || ''),
    });
    setFormError(null);
    setShowFieldModal(true);
  };

  const handleDuplicateField = async (field: FormField) => {
    try {
      setSubmitting(true);
      const newKey = `${field.fieldKey}_copy_${Math.floor(Math.random() * 1000)}`;
      const res = await fetch(`/api/events/${eventSlug}/registration-forms/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldKey: newKey,
          fieldLabel: `${field.fieldLabel} (Copy)`,
          fieldType: field.fieldType,
          description: field.description,
          placeholder: field.placeholder,
          isRequired: field.isRequired,
          options: field.options,
          validationRules: field.validationRules,
          conditionalLogic: field.conditionalLogic,
          displayOrder: field.displayOrder + 1,
          isVisible: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to duplicate field');

      toast.success('Field duplicated');
      fetchForm();
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || 'Error duplicating field');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      // Process options
      let optionsArray: { label: string; value: string }[] | null = null;
      if (['dropdown', 'radio', 'checkbox'].includes(fieldFormData.fieldType)) {
        const lines = fieldFormData.optionsText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);
        if (lines.length > 0) {
          optionsArray = lines.map((line) => ({ label: line, value: line }));
        }
      }

      // Conditional logic
      let condLogic = null;
      if (fieldFormData.hasCondition && fieldFormData.conditionFieldKey) {
        condLogic = {
          dependsOnFieldKey: fieldFormData.conditionFieldKey,
          operator: fieldFormData.conditionOperator,
          value: fieldFormData.conditionValue,
        };
      }

      if (editingField) {
        const res = await fetch(
          `/api/events/${eventSlug}/registration-forms/fields/${editingField.id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fieldLabel: fieldFormData.fieldLabel,
              fieldType: fieldFormData.fieldType,
              description: fieldFormData.description || null,
              placeholder: fieldFormData.placeholder || null,
              isRequired: fieldFormData.isRequired,
              options: optionsArray,
              conditionalLogic: condLogic,
            }),
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update field');
      } else {
        // Create new field
        const keyFormatted = (fieldFormData.fieldKey || fieldFormData.fieldLabel)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .slice(0, 50);

        const res = await fetch(`/api/events/${eventSlug}/registration-forms/fields`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fieldKey: keyFormatted,
            fieldLabel: fieldFormData.fieldLabel,
            fieldType: fieldFormData.fieldType,
            description: fieldFormData.description || null,
            placeholder: fieldFormData.placeholder || null,
            isRequired: fieldFormData.isRequired,
            options: optionsArray,
            conditionalLogic: condLogic,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create field');
      }

      setShowFieldModal(false);
      fetchForm();
    } catch (err: unknown) {
      const e = err as Error;
      setFormError(e.message || 'Error saving field');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteField = async () => {
    if (!fieldToDelete) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/events/${eventSlug}/registration-forms/fields/${fieldToDelete.id}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete field');

      setFieldToDelete(null);
      toast.success('Field deleted');
      fetchForm();
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || 'Error deleting field');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMoveField = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;

    const newFields = [...fields];
    const temp = newFields[index];
    newFields[index] = newFields[targetIndex];
    newFields[targetIndex] = temp;

    const reorderPayload = newFields.map((f, i) => ({ id: f.id, displayOrder: i }));
    setFields(newFields);

    try {
      await fetch(`/api/events/${eventSlug}/registration-forms/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldOrders: reorderPayload }),
      });
    } catch (err) {
      console.error('Failed to sync reorder', err);
    }
  };

  const handleTogglePublish = async () => {
    if (!formMeta) return;
    setPublishSaving(true);
    try {
      const res = await fetch(`/api/events/${eventSlug}/registration-forms`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !formMeta.isPublished }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle publication');

      setFormMeta(data.form);
      toast.success(data.form?.isPublished ? 'Form published' : 'Form unpublished');
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || 'Error updating form status');
    } finally {
      setPublishSaving(false);
    }
  };

  // Evaluate conditional visibility for preview
  const isFieldVisibleInPreview = (field: FormField) => {
    if (!field.conditionalLogic) return true;
    const { dependsOnFieldKey, operator, value } = field.conditionalLogic;
    const answer = previewAnswers[dependsOnFieldKey];

    if (operator === 'equals') {
      return String(answer || '').toLowerCase() === String(value || '').toLowerCase();
    }
    if (operator === 'not_equals') {
      return String(answer || '').toLowerCase() !== String(value || '').toLowerCase();
    }
    if (operator === 'contains') {
      return String(answer || '').toLowerCase().includes(String(value || '').toLowerCase());
    }
    return true;
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
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Registration Form Builder</h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Customize attendee registration questions, custom dropdowns, file uploads, and conditional logic.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex items-center p-1 bg-slate-200 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setActiveTab('builder')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'builder'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Form Canvas
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === 'preview'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Live Preview
              </button>
            </div>

            <button
              onClick={handleTogglePublish}
              disabled={publishSaving}
              className={`px-4 py-2 font-semibold text-xs sm:text-sm rounded-xl transition flex items-center gap-1.5 shadow-md ${
                formMeta?.isPublished
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                  : 'bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {publishSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : formMeta?.isPublished ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {formMeta?.isPublished ? 'Published' : 'Draft Form'}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 text-xs sm:text-sm">
            {error}
          </div>
        )}

        {/* MAIN BUILDER VIEW */}
        {activeTab === 'builder' ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left: Component Palette */}
            <div className="lg:col-span-1 space-y-3">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Field Library (17 Types)
                </h3>
                <div className="grid grid-cols-1 gap-1.5 max-h-[600px] overflow-y-auto pr-1">
                  {PALETTE_FIELDS.map((p) => {
                    const Icon = FIELD_TYPE_ICONS[p.type] || AlignLeft;
                    return (
                      <button
                        key={p.type}
                        onClick={() => handleOpenAddField(p.type)}
                        className="flex items-center gap-2.5 p-2 text-left rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-200 dark:hover:border-blue-900 border border-transparent transition group"
                      >
                        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 text-slate-700 dark:text-slate-300 group-hover:text-blue-600">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600">
                            {p.label}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">{p.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Form Canvas */}
            <div className="lg:col-span-3 space-y-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                  <p className="text-sm text-slate-500">Loading form builder canvas...</p>
                </div>
              ) : fields.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <h3 className="text-base font-semibold">Form is currently empty</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                    Click any field type on the left to add your first question to the registration form.
                  </p>
                  <button
                    onClick={() => handleOpenAddField('text')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl transition"
                  >
                    Add Full Name Field
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, idx) => {
                    const Icon = FIELD_TYPE_ICONS[field.fieldType] || AlignLeft;
                    const isCore = ['name', 'email'].includes(field.fieldKey);

                    return (
                      <div
                        key={field.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3">
                          {/* Reordering buttons */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => handleMoveField(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 text-slate-300 hover:text-slate-600 disabled:opacity-20"
                              title="Move up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveField(idx, 'down')}
                              disabled={idx === fields.length - 1}
                              className="p-1 text-slate-300 hover:text-slate-600 disabled:opacity-20"
                              title="Move down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            <Icon className="w-4 h-4" />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {field.fieldLabel}
                              </span>
                              {field.isRequired && (
                                <span className="text-[10px] font-semibold text-red-500 bg-red-500/10 px-1.5 py-0.2 rounded">
                                  Required
                                </span>
                              )}
                              {field.conditionalLogic && (
                                <span className="text-[10px] font-semibold text-purple-600 bg-purple-500/10 px-1.5 py-0.2 rounded border border-purple-500/20">
                                  Conditional
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              key: {field.fieldKey} • type: {field.fieldType}
                              {field.options && ` • (${field.options.length} options)`}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDuplicateField(field)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Duplicate Field"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditField(field)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Edit Field"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {!isCore && (
                            <button
                              onClick={() => setFieldToDelete(field)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Delete Field"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* LIVE PREVIEW TAB */
          <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-md">
            <div className="pb-4 mb-6 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Attendee Registration Preview
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
                {formMeta?.title || 'Event Registration'}
              </h2>
              {formMeta?.description && (
                <p className="text-xs sm:text-sm text-slate-500 mt-1">{formMeta.description}</p>
              )}
            </div>

            {previewSubmitted ? (
              <div className="p-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="text-lg font-bold">Registration Form Validated!</h3>
                <p className="text-xs text-slate-500">
                  This preview confirms your custom fields, options, and conditional visibility logic are functioning smoothly.
                </p>
                <button
                  onClick={() => {
                    setPreviewSubmitted(false);
                    setPreviewAnswers({});
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-medium rounded-xl hover:bg-slate-200"
                >
                  Reset Preview
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setPreviewSubmitted(true);
                }}
                className="space-y-4 text-xs sm:text-sm"
              >
                {fields
                  .filter((f) => f.isVisible && isFieldVisibleInPreview(f))
                  .map((field) => {
                    if (field.fieldType === 'section') {
                      return (
                        <div key={field.id} className="pt-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                          <h4 className="font-bold text-base text-slate-900 dark:text-white">{field.fieldLabel}</h4>
                          {field.description && <p className="text-xs text-slate-400">{field.description}</p>}
                        </div>
                      );
                    }

                    if (field.fieldType === 'info') {
                      return (
                        <div
                          key={field.id}
                          className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-xl text-blue-700 dark:text-blue-300 text-xs"
                        >
                          {field.fieldLabel}
                        </div>
                      );
                    }

                    return (
                      <div key={field.id} className="space-y-1">
                        <label className="block font-medium text-slate-700 dark:text-slate-300">
                          {field.fieldLabel} {field.isRequired && <span className="text-red-500">*</span>}
                        </label>

                        {field.fieldType === 'textarea' ? (
                          <textarea
                            rows={3}
                            required={field.isRequired}
                            placeholder={field.placeholder || ''}
                            value={String(previewAnswers[field.fieldKey] || '')}
                            onChange={(e) =>
                              setPreviewAnswers({ ...previewAnswers, [field.fieldKey]: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                          />
                        ) : field.fieldType === 'dropdown' ? (
                          <select
                            required={field.isRequired}
                            value={String(previewAnswers[field.fieldKey] || '')}
                            onChange={(e) =>
                              setPreviewAnswers({ ...previewAnswers, [field.fieldKey]: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                          >
                            <option value="">Select an option...</option>
                            {field.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : field.fieldType === 'radio' ? (
                          <div className="space-y-1.5 pt-1">
                            {field.options?.map((opt) => (
                              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={field.fieldKey}
                                  value={opt.value}
                                  checked={previewAnswers[field.fieldKey] === opt.value}
                                  onChange={(e) =>
                                    setPreviewAnswers({ ...previewAnswers, [field.fieldKey]: e.target.value })
                                  }
                                  className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-slate-700 dark:text-slate-300">{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        ) : field.fieldType === 'consent' ? (
                          <label className="flex items-start gap-2 pt-1 cursor-pointer">
                            <input
                              type="checkbox"
                              required={field.isRequired}
                              checked={!!previewAnswers[field.fieldKey]}
                              onChange={(e) =>
                                setPreviewAnswers({ ...previewAnswers, [field.fieldKey]: e.target.checked })
                              }
                              className="w-4 h-4 text-blue-600 rounded-sm mt-0.5"
                            />
                            <span className="text-slate-700 dark:text-slate-300 leading-tight">
                              {field.fieldLabel}
                            </span>
                          </label>
                        ) : (
                          <input
                            type={field.fieldType === 'number' ? 'number' : field.fieldType === 'date' ? 'date' : 'text'}
                            required={field.isRequired}
                            placeholder={field.placeholder || ''}
                            value={String(previewAnswers[field.fieldKey] || '')}
                            onChange={(e) =>
                              setPreviewAnswers({ ...previewAnswers, [field.fieldKey]: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                          />
                        )}

                        {field.description && (
                          <p className="text-[11px] text-slate-400">{field.description}</p>
                        )}
                      </div>
                    );
                  })}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-md shadow-blue-600/20 mt-4"
                >
                  Test Submit Registration
                </button>
              </form>
            )}
          </div>
        )}

        {/* FIELD CONFIGURATION MODAL */}
        {showFieldModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingField ? 'Configure Field Properties' : 'Add New Registration Field'}
                </h3>
                <button
                  onClick={() => setShowFieldModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 text-xs">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveField} className="space-y-3.5 mt-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Field Question / Label *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Medical Council Registration Number"
                    value={fieldFormData.fieldLabel}
                    onChange={(e) => setFieldFormData({ ...fieldFormData, fieldLabel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  />
                </div>

                {!editingField && (
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Internal Key (Optional, auto-generated if blank)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. medical_council_no"
                      value={fieldFormData.fieldKey}
                      onChange={(e) =>
                        setFieldFormData({
                          ...fieldFormData,
                          fieldKey: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                        })
                      }
                      className="w-full font-mono px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Field Type
                    </label>
                    <select
                      value={fieldFormData.fieldType}
                      onChange={(e) => setFieldFormData({ ...fieldFormData, fieldType: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                    >
                      {PALETTE_FIELDS.map((p) => (
                        <option key={p.type} value={p.type}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Placeholder Text
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Type your response..."
                      value={fieldFormData.placeholder}
                      onChange={(e) => setFieldFormData({ ...fieldFormData, placeholder: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                    />
                  </div>
                </div>

                {['dropdown', 'radio', 'checkbox'].includes(fieldFormData.fieldType) && (
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Choices / Options (One per line) *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Vegetarian&#10;Non-Vegetarian&#10;Vegan"
                      value={fieldFormData.optionsText}
                      onChange={(e) => setFieldFormData({ ...fieldFormData, optionsText: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden font-mono text-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Helper Guidance / Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Required by State Medical Council for CME credits"
                    value={fieldFormData.description}
                    onChange={(e) => setFieldFormData({ ...fieldFormData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isRequired"
                    checked={fieldFormData.isRequired}
                    onChange={(e) => setFieldFormData({ ...fieldFormData, isRequired: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded-sm"
                  />
                  <label htmlFor="isRequired" className="text-slate-700 dark:text-slate-300 font-medium">
                    This question is mandatory to register
                  </label>
                </div>

                {/* Conditional Visibility Logic */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="hasCondition"
                      checked={fieldFormData.hasCondition}
                      onChange={(e) => setFieldFormData({ ...fieldFormData, hasCondition: e.target.checked })}
                      className="w-4 h-4 text-purple-600 rounded-sm"
                    />
                    <label htmlFor="hasCondition" className="text-purple-600 dark:text-purple-400 font-semibold">
                      Enable Conditional Visibility (Show based on another answer)
                    </label>
                  </div>

                  {fieldFormData.hasCondition && (
                    <div className="grid grid-cols-3 gap-2 p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 rounded-xl">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">Depends on</label>
                        <select
                          value={fieldFormData.conditionFieldKey}
                          onChange={(e) => setFieldFormData({ ...fieldFormData, conditionFieldKey: e.target.value })}
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border rounded-lg text-xs"
                        >
                          <option value="">Select field...</option>
                          {fields
                            .filter((f) => f.id !== editingField?.id)
                            .map((f) => (
                              <option key={f.fieldKey} value={f.fieldKey}>
                                {f.fieldLabel}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">Condition</label>
                        <select
                          value={fieldFormData.conditionOperator}
                          onChange={(e) =>
                            setFieldFormData({
                              ...fieldFormData,
                              conditionOperator: e.target.value as 'equals' | 'not_equals' | 'contains',
                            })
                          }
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border rounded-lg text-xs"
                        >
                          <option value="equals">Equals</option>
                          <option value="not_equals">Does not equal</option>
                          <option value="contains">Contains</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">Value match</label>
                        <input
                          type="text"
                          placeholder="e.g. Student"
                          value={fieldFormData.conditionValue}
                          onChange={(e) => setFieldFormData({ ...fieldFormData, conditionValue: e.target.value })}
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowFieldModal(false)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingField ? 'Save Field' : 'Add to Form'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!fieldToDelete}
          title="Delete Form Field"
          description={`Are you sure you want to remove '${fieldToDelete?.fieldLabel}' from the registration form?`}
          confirmLabel="Delete Field"
          variant="destructive"
          onConfirm={handleDeleteField}
          onCancel={() => setFieldToDelete(null)}
        />
      </div>
    </div>
  );
}
