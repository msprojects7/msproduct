'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { useToast } from '@/app/components/ui/Toast';
import { Button } from '@/app/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import { EmptyState } from '@/app/components/ui/EmptyState';
import BackButton from '@/app/components/ui/BackButton';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  Download,
  Users,
  Clock,
  RefreshCw,
} from 'lucide-react';

interface PreviewRow {
  rowNum: number;
  name: string;
  registrationNumber: string;
  category: string;
  phoneNumber?: string;
  email?: string;
  foodPreference?: string;
  paymentStatus?: string;
  gender?: string;
  medicalCouncilNumber?: string;
  valid: boolean;
  validationError?: string;
}

interface ImportBatchRecord {
  id: string;
  fileName: string;
  rowCount: number;
  importedCount: number;
  rejectedCount: number;
  createdAt: string;
}

export default function ExcelImportPage() {
  const params = useParams();
  const eventSlug = params.eventSlug as string;
  const router = useRouter();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'upload' | 'history'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    batchId: string;
    totalRows: number;
    importedCount: number;
    rejectedCount: number;
    errors: Array<{ rowNumber: number; reason: string }>;
  } | null>(null);

  // History state
  const [batches, setBatches] = useState<ImportBatchRecord[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load past batches
  const loadBatches = async () => {
    setLoadingBatches(true);
    try {
      const res = await fetch(`/api/events/${eventSlug}/import`);
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches || []);
      }
    } catch {
      // Silent error for optional history
    } finally {
      setLoadingBatches(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadBatches();
    }
  }, [activeTab]);

  // Clean and sanitize string
  const cleanVal = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    return String(val).trim();
  };

  // Find column in row with fuzzy matching
  const findCol = (row: Record<string, unknown>, keys: string[]): string => {
    const rowKeys = Object.keys(row);
    for (const k of keys) {
      const match = rowKeys.find(
        (rk) => rk.toLowerCase().replace(/[^a-z0-9]/g, '') === k.toLowerCase().replace(/[^a-z0-9]/g, '')
      );
      if (match && row[match] !== undefined) {
        return cleanVal(row[match]);
      }
    }
    return '';
  };

  const handleFileProcess = async (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      toast.error('Only Excel (.xlsx, .xls) and CSV (.csv) files are supported.');
      return;
    }

    if (selectedFile.size > 15 * 1024 * 1024) {
      toast.error('File size exceeds 15MB limit.');
      return;
    }

    setFile(selectedFile);
    setParsing(true);
    setImportResult(null);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const rawJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

      if (rawJson.length === 0) {
        toast.warning('The uploaded sheet is empty.');
        setPreviewRows([]);
        setParsing(false);
        return;
      }

      const rows: PreviewRow[] = rawJson.map((row, idx) => {
        const name = findCol(row, ['name', 'fullname', 'delegatename', 'attendee', 'attendeename']);
        const regNo = findCol(row, ['registrationnumber', 'regno', 'regnumber', 'barcode', 'id']);
        const category = findCol(row, ['category', 'delegatetype', 'type', 'tickettype']) || 'Delegate';
        const phone = findCol(row, ['phone', 'phonenumber', 'mobile', 'contact']);
        const email = findCol(row, ['email', 'emailaddress']);
        const food = findCol(row, ['food', 'foodpreference', 'diet']) || 'Not Specified';
        const payment = findCol(row, ['payment', 'paymentstatus', 'status']) || 'Paid';
        const gender = findCol(row, ['gender', 'sex']);
        const council = findCol(row, ['medicalcouncilnumber', 'councilno', 'regcouncil']);

        let valid = true;
        let validationError = '';

        if (!name) {
          valid = false;
          validationError = 'Name is required';
        } else if (!category) {
          valid = false;
          validationError = 'Category is required';
        }

        return {
          rowNum: idx + 1,
          name,
          registrationNumber: regNo || `AUTO-${idx + 1}`,
          category,
          phoneNumber: phone,
          email,
          foodPreference: food,
          paymentStatus: payment,
          gender,
          medicalCouncilNumber: council,
          valid,
          validationError,
        };
      });

      setPreviewRows(rows);
      toast.info(`Parsed ${rows.length} rows from ${selectedFile.name}`);
    } catch (err) {
      toast.error('Failed to parse spreadsheet. Please ensure the file is not corrupted.');
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleExecuteImport = async () => {
    if (!previewRows.length) return;
    setImporting(true);

    try {
      const payloadRows = previewRows.map((r) => ({
        name: r.name,
        registrationNumber: r.registrationNumber.startsWith('AUTO-') ? undefined : r.registrationNumber,
        category: r.category,
        phoneNumber: r.phoneNumber,
        email: r.email,
        foodPreference: r.foodPreference,
        paymentStatus: r.paymentStatus,
        gender: r.gender,
        medicalCouncilNumber: r.medicalCouncilNumber,
      }));

      const res = await fetch(`/api/events/${eventSlug}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file?.name || 'import.xlsx',
          rows: payloadRows,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to complete import.');
        setImporting(false);
        return;
      }

      setImportResult({
        batchId: data.batch?.id || '',
        totalRows: data.summary?.totalRows || payloadRows.length,
        importedCount: data.summary?.importedCount || 0,
        rejectedCount: data.summary?.rejectedCount || 0,
        errors: data.errors || [],
      });

      toast.success(
        `Successfully imported ${data.summary?.importedCount} attendees! (${data.summary?.rejectedCount} skipped)`
      );
    } catch {
      toast.error('Network error during import.');
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleTemplate = () => {
    const sample = [
      {
        'Full Name': 'Dr. Sarah Jenkins',
        'Registration Number': 'REG-1001',
        Category: 'Faculty',
        Email: 'sarah.jenkins@hospital.org',
        Phone: '+919876543210',
        'Food Preference': 'Vegetarian',
        'Payment Status': 'Paid',
        Gender: 'Female',
        'Medical Council No': 'MCI-88219',
      },
      {
        'Full Name': 'Dr. Robert Chen',
        'Registration Number': 'REG-1002',
        Category: 'Delegate',
        Email: 'robert.chen@clinic.com',
        Phone: '+919876543211',
        'Food Preference': 'Non-Vegetarian',
        'Payment Status': 'Paid',
        Gender: 'Male',
        'Medical Council No': 'MCI-88220',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendees Template');
    XLSX.writeFile(wb, 'MS_Backstage_Attendee_Import_Template.xlsx');
  };

  const validCount = previewRows.filter((r) => r.valid).length;
  const invalidCount = previewRows.length - validCount;

  return (
    <div className="pb-16 font-sans">
      {/* Top Action Bar with Top-Left Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-slate-200 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <BackButton
              href={`/events/${eventSlug}`}
              label="Back to Event"
            />
            <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-800" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Excel &amp; CSV Attendee Import
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={downloadSampleTemplate} leftIcon={<Download className="w-3.5 h-3.5" />}>
              Download Template
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 px-6">
        <div className="flex gap-6 max-w-6xl mx-auto">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Upload &amp; Import
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Import History
          </button>
        </div>
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        {activeTab === 'upload' ? (
          <>
            {/* Step 1: Upload Dropzone if no file or result */}
            {!importResult && (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-900/60 rounded-xl p-8 text-center cursor-pointer transition-all duration-150"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileProcess(e.target.files[0]);
                  }}
                />
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                  {file ? file.name : 'Choose a spreadsheet or drag & drop here'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-3">
                  Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv). Automatic header detection for name, category, registration number, phone, email, and preferences.
                </p>
                <div className="inline-flex items-center gap-2">
                  <span className="text-xs text-blue-600 font-medium">Browse Computer</span>
                  <span className="text-xs text-slate-300">•</span>
                  <span className="text-xs text-slate-400">Max file size 15MB</span>
                </div>
              </div>
            )}

            {/* Parsing Indicator */}
            {parsing && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 text-center">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">Reading and validating spreadsheet data...</p>
              </div>
            )}

            {/* Step 2: Preview Table */}
            {!importResult && previewRows.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Parsed Attendees Preview ({previewRows.length} Total)</CardTitle>
                    <CardDescription>
                      Review mapped columns and row validation before committing to the database.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="success">{validCount} Ready</Badge>
                    {invalidCount > 0 && <Badge variant="danger">{invalidCount} Invalid</Badge>}
                    <Button
                      variant="primary"
                      size="sm"
                      loading={importing}
                      onClick={handleExecuteImport}
                      disabled={validCount === 0}
                    >
                      Import {validCount} Attendees
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3 font-semibold text-slate-600">Row</th>
                          <th className="py-2.5 px-3 font-semibold text-slate-600">Status</th>
                          <th className="py-2.5 px-3 font-semibold text-slate-600">Reg No</th>
                          <th className="py-2.5 px-3 font-semibold text-slate-600">Full Name</th>
                          <th className="py-2.5 px-3 font-semibold text-slate-600">Category</th>
                          <th className="py-2.5 px-3 font-semibold text-slate-600">Phone</th>
                          <th className="py-2.5 px-3 font-semibold text-slate-600">Email</th>
                          <th className="py-2.5 px-3 font-semibold text-slate-600">Payment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {previewRows.slice(0, 100).map((r) => (
                          <tr key={r.rowNum} className={r.valid ? 'hover:bg-slate-50/50' : 'bg-rose-50/40'}>
                            <td className="py-2 px-3 text-slate-400 font-mono">{r.rowNum}</td>
                            <td className="py-2 px-3">
                              {r.valid ? (
                                <Badge variant="success" size="sm">Valid</Badge>
                              ) : (
                                <span className="text-rose-600 font-medium" title={r.validationError}>
                                  {r.validationError}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-700">{r.registrationNumber}</td>
                            <td className="py-2 px-3 font-medium text-slate-900">{r.name}</td>
                            <td className="py-2 px-3">
                              <Badge variant="neutral" size="sm">{r.category}</Badge>
                            </td>
                            <td className="py-2 px-3 text-slate-600">{r.phoneNumber || '—'}</td>
                            <td className="py-2 px-3 text-slate-600">{r.email || '—'}</td>
                            <td className="py-2 px-3 text-slate-600">{r.paymentStatus || 'Paid'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {previewRows.length > 100 && (
                    <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
                      Showing first 100 rows. All {previewRows.length} rows will be processed upon import.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 3: Success & Error Summary */}
            {importResult && (
              <div className="space-y-6">
                <Card className="border-emerald-200 bg-emerald-50/30">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-slate-900">
                          Import Completed Successfully
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Batch ID: <span className="font-mono text-slate-800">{importResult.batchId}</span>
                        </p>
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div className="p-3 bg-white rounded-lg border border-slate-200">
                            <span className="text-xs text-slate-500 block">Total In File</span>
                            <span className="text-lg font-bold text-slate-900">{importResult.totalRows}</span>
                          </div>
                          <div className="p-3 bg-white rounded-lg border border-emerald-200">
                            <span className="text-xs text-emerald-700 block">Successfully Added</span>
                            <span className="text-lg font-bold text-emerald-600">{importResult.importedCount}</span>
                          </div>
                          <div className="p-3 bg-white rounded-lg border border-slate-200">
                            <span className="text-xs text-slate-500 block">Skipped / Duplicates</span>
                            <span className="text-lg font-bold text-slate-700">{importResult.rejectedCount}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-5">
                          <Link href={`/events/${eventSlug}/attendees`}>
                            <Button variant="primary" size="sm" leftIcon={<Users className="w-4 h-4" />}>
                              View Attendees List
                            </Button>
                          </Link>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setFile(null);
                              setPreviewRows([]);
                              setImportResult(null);
                            }}
                          >
                            Import Another File
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {importResult.errors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-rose-700 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        Skipped Records ({importResult.errors.length})
                      </CardTitle>
                      <CardDescription>
                        The following rows could not be added due to validation failures or duplicate registration numbers.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="max-h-64 overflow-y-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-4 font-semibold text-slate-600">Row</th>
                              <th className="py-2.5 px-4 font-semibold text-slate-600">Reason</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {importResult.errors.map((err, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="py-2 px-4 font-mono text-slate-500">Row {err.rowNumber}</td>
                                <td className="py-2 px-4 text-rose-600 font-medium">{err.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </>
        ) : (
          /* History Tab */
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Batch Import History</CardTitle>
                <CardDescription>Past spreadsheet uploads recorded for this event.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={loadBatches} loading={loadingBatches} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loadingBatches ? (
                <div className="p-8 text-center text-xs text-slate-500">Loading import history...</div>
              ) : batches.length === 0 ? (
                <EmptyState
                  icon={<FileSpreadsheet className="w-6 h-6" />}
                  title="No Import Batches Yet"
                  description="When you import attendees using Excel or CSV spreadsheets, the history will appear here."
                />
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold text-slate-600">Date &amp; Time</th>
                      <th className="py-3 px-4 font-semibold text-slate-600">File Name</th>
                      <th className="py-3 px-4 font-semibold text-slate-600">Total Rows</th>
                      <th className="py-3 px-4 font-semibold text-slate-600">Imported</th>
                      <th className="py-3 px-4 font-semibold text-slate-600">Rejected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batches.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 text-slate-600 flex items-center gap-1.5 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(b.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">{b.fileName}</td>
                        <td className="py-3 px-4 text-slate-700">{b.rowCount}</td>
                        <td className="py-3 px-4 text-emerald-600 font-semibold">{b.importedCount}</td>
                        <td className="py-3 px-4 text-slate-500">{b.rejectedCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
