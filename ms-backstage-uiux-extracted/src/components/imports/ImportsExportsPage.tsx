import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../navigation/BackButton';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Check, 
  ArrowRight,
  RefreshCw,
  Clock
} from 'lucide-react';

export const ImportsExportsPage: React.FC = () => {
  const { currentEvent, attendees, addAttendee, addToast, addAuditLog } = useApp();

  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importPreviewRows, setImportPreviewRows] = useState<any[]>([]);
  const [importSummary, setImportSummary] = useState<{ total: number; valid: number; duplicates: number } | null>(null);

  // Field mapping state
  const [nameCol, setNameCol] = useState('full_name');
  const [categoryCol, setCategoryCol] = useState('category');
  const [emailCol, setEmailCol] = useState('email');
  const [phoneCol, setPhoneCol] = useState('phone');
  const [companyCol, setCompanyCol] = useState('organization');

  // Simulated CSV sample data
  const sampleImportData = [
    { full_name: 'Dr. Alistair Finch', category: 'Speaker', email: 'a.finch@oxford.edu', phone: '+44 7911 123456', organization: 'Oxford Nanopore Labs', status: 'Valid' },
    { full_name: 'Meenakshi Sundaram', category: 'Delegate', email: 'meenakshi@tcs.com', phone: '+91 98401 23456', organization: 'Tata Consultancy Services', status: 'Valid' },
    { full_name: 'David Miller', category: 'Delegate', email: 'david.miller@vanguardfin.co.uk', phone: '+44 7700 900341', organization: 'Vanguard Capital', status: 'Duplicate' },
    { full_name: 'Dr. Tariq Mansoor', category: 'Faculty', email: 'tariq.m@amu.ac.in', phone: '+91 94120 77654', organization: 'Aligarh Muslim University', status: 'Valid' },
    { full_name: 'Zoe Deschanel', category: 'Press', email: 'z.deschanel@bloomberg.com', phone: '+1 415 555 8899', organization: 'Bloomberg Technology', status: 'Valid' }
  ];

  const handleSimulateUpload = (fileName: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      setUploadedFile(fileName);
      setImportPreviewRows(sampleImportData);
      setImportSummary({ total: 5, valid: 4, duplicates: 1 });
      setIsProcessing(false);
      addToast({
        type: 'info',
        title: 'File Parsed Successfully',
        message: '5 attendee rows extracted. 1 existing duplicate detected.'
      });
    }, 350);
  };

  const handleCommitImport = () => {
    if (importPreviewRows.length === 0) return;
    const validRows = importPreviewRows.filter(r => r.status === 'Valid');
    validRows.forEach(r => {
      addAttendee({
        fullName: r.full_name,
        category: r.category,
        email: r.email,
        mobile: r.phone,
        company: r.organization,
        registrationType: 'Pre-registered'
      });
    });
    addAuditLog('CSV_IMPORT', `${validRows.length} attendees`, 'Import', `Imported ${validRows.length} pre-registered attendees.`);
    addToast({
      type: 'success',
      title: 'Batch Import Complete',
      message: `${validRows.length} new delegates added to ${currentEvent.name}.`
    });
    setUploadedFile(null);
    setImportPreviewRows([]);
    setImportSummary(null);
  };

  const handleDownloadTemplate = () => {
    const csvContent = 'data:text/csv;charset=utf-8,Full Name,Category,Email,Mobile Phone,Company,Designation,Medical Council Number\nDr. Sample Name,Delegate,sample@company.com,+91 90000 00000,Apex Technologies,Senior Director,MCI-12345';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'MS_Backstage_Attendee_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast({ type: 'success', title: 'Template Downloaded', message: 'CSV template saved to your downloads.' });
  };

  const handleExportData = (format: 'CSV' | 'XLSX') => {
    const eventAttendees = attendees.filter(a => a.eventId === currentEvent.id);
    const headers = ['Registration Number', 'Full Name', 'Category', 'Email', 'Mobile', 'Company', 'Attendance Status', 'Payment Status'];
    const rows = eventAttendees.map(a => [
      a.registrationNumber,
      `"${a.fullName}"`,
      a.category,
      a.email || '',
      a.mobile || '',
      `"${a.company || ''}"`,
      a.attendanceStatus,
      a.paymentStatus
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${currentEvent.slug}_Attendees_Export.${format.toLowerCase()}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast({ type: 'success', title: 'Export Generated', message: `Exported ${eventAttendees.length} records in ${format} format.` });
  };

  return (
    <div className="w-full pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <BackButton label="Back to Attendees" targetRoute="attendees" />
            <div className="pt-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Data Imports & Exports</h1>
              <p className="text-xs text-slate-400">
                Bulk pre-registration ingestion, duplicate reconciliation, and roster exports for {currentEvent.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV Template</span>
            </button>
          </div>
        </div>

        {/* 2-SECTION SPLIT: IMPORT WORKFLOW & EXPORT WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* IMPORT CARD (COL 1-7) */}
          <div className="lg:col-span-7 rounded-3xl glass-panel p-6 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                <span>Upload Attendee Batch (CSV / Excel)</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Max 10,000 rows</span>
            </div>

            {/* Drag & Drop Simulation Dropzone */}
            <div className="p-8 rounded-2xl border-2 border-dashed border-slate-700/80 hover:border-indigo-500/80 bg-slate-950/40 text-center transition-colors">
              <Upload className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-white">Drag & drop your CSV or XLSX file here</p>
              <p className="text-xs text-slate-400 mt-1">Supports UTF-8 encoded files with column headers</p>

              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulateUpload('delegates_batch_nov2026.csv')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md active:scale-95 transition-all"
                >
                  Load Sample Batch (5 rows)
                </button>
              </div>
            </div>

            {/* PREVIEW & FIELD MAPPING */}
            {uploadedFile && (
              <div className="space-y-4 pt-2 animate-in fade-in">
                <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white block">{uploadedFile}</span>
                    <span className="text-slate-400 text-[11px]">
                      {importSummary?.total} rows · {importSummary?.valid} valid · {importSummary?.duplicates} duplicate flagged
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 font-mono text-[10px]">
                    READY TO MAP
                  </span>
                </div>

                {/* Column Mapping Selectors */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Verify Column Mapping
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Full Name</span>
                      <input
                        type="text"
                        value={nameCol}
                        onChange={(e) => setNameCol(e.target.value)}
                        className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Category</span>
                      <input
                        type="text"
                        value={categoryCol}
                        onChange={(e) => setCategoryCol(e.target.value)}
                        className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Email</span>
                      <input
                        type="text"
                        value={emailCol}
                        onChange={(e) => setEmailCol(e.target.value)}
                        className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Parsed Rows Preview Table */}
                <div className="rounded-xl border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
                      <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">Category</th>
                        <th className="p-2">Organization</th>
                        <th className="p-2 text-right">Validation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {importPreviewRows.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-900/40">
                          <td className="p-2 font-medium text-white">{r.full_name}</td>
                          <td className="p-2 font-mono text-indigo-300">{r.category}</td>
                          <td className="p-2 text-slate-400">{r.organization}</td>
                          <td className="p-2 text-right">
                            {r.status === 'Valid' ? (
                              <span className="text-emerald-400 text-[10px] font-mono">Valid</span>
                            ) : (
                              <span className="text-amber-400 text-[10px] font-mono">Duplicate</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Confirm Import Action */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => { setUploadedFile(null); setImportPreviewRows([]); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCommitImport}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md"
                  >
                    Commit {importSummary?.valid} Valid Attendees
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* EXPORT WORKSPACE & AUDIT (COL 8-12) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-400" />
                <span>Export Event Records</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Download attendee contact lists, payment tallies, and turnstile check-in timestamps.
              </p>

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => handleExportData('CSV')}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-white flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>Download Complete CSV Roster</span>
                  </span>
                  <span className="font-mono text-slate-400 text-[11px]">{attendees.filter(a => a.eventId === currentEvent.id).length} rows</span>
                </button>

                <button
                  onClick={() => handleExportData('XLSX')}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-white flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-sky-400" />
                    <span>Download Excel Workbook (.xlsx)</span>
                  </span>
                  <span className="font-mono text-slate-400 text-[11px]">{attendees.filter(a => a.eventId === currentEvent.id).length} rows</span>
                </button>
              </div>
            </div>

            {/* IMPORT LOGS */}
            <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Recent Import Operations</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-white block">pre_reg_delegates_batch_3.csv</span>
                    <span className="text-[10px] text-slate-400">Imported 340 delegates by Meera Nambiar</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">Success</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-white block">speakers_faculty_final.csv</span>
                    <span className="text-[10px] text-slate-400">Imported 48 speakers by Surya Kumar</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">Success</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
