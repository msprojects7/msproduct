import React from 'react';
import { Attendee } from '../../types';
import { X, CheckCircle2, AlertCircle, Clock, CreditCard, Mail, Phone, Building2, Briefcase, FileBadge } from 'lucide-react';

interface AttendeeDetailModalProps {
  attendee: Attendee | null;
  onClose: () => void;
  onEdit: (attendee: Attendee) => void;
  onPrintBadge: (attendee: Attendee) => void;
}

export const AttendeeDetailModal: React.FC<AttendeeDetailModalProps> = ({
  attendee,
  onClose,
  onEdit,
  onPrintBadge
}) => {
  if (!attendee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md" onClick={onClose} />

      <div 
        role="dialog" 
        aria-modal="true"
        className="relative w-full max-w-lg rounded-3xl glass-popover p-6 shadow-2xl border border-slate-700/80 text-slate-100 z-10 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                {attendee.registrationNumber}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-200">
                {attendee.category}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                attendee.attendanceStatus === 'Checked In' 
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' 
                  : attendee.attendanceStatus === 'Checked Out' 
                  ? 'bg-amber-950/60 text-amber-400' 
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {attendee.attendanceStatus}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-2">{attendee.fullName}</h2>
            {attendee.designation && (
              <p className="text-xs text-slate-300 mt-0.5">{attendee.designation} {attendee.company ? `at ${attendee.company}` : ''}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl transition-colors -mr-1 -mt-1"
            aria-label="Close detail modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Grid */}
        <div className="py-4 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>Email Address</span>
              </span>
              <p className="font-medium text-white truncate">{attendee.email || 'Not specified'}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                <Phone className="w-3.5 h-3.5 text-indigo-400" />
                <span>Mobile Number</span>
              </span>
              <p className="font-medium text-white truncate">{attendee.mobile || 'Not specified'}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                <span>Payment Status</span>
              </span>
              <p className="font-semibold text-emerald-400">{attendee.paymentStatus}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                <FileBadge className="w-3.5 h-3.5 text-indigo-400" />
                <span>Registration Mode</span>
              </span>
              <p className="font-medium text-white">{attendee.registrationType}</p>
            </div>
          </div>

          {/* Medical council number if present */}
          {attendee.medicalCouncilNumber && (
            <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-800/40 text-xs">
              <span className="text-sky-300 font-semibold">Medical Council Reg Number:</span>{' '}
              <span className="font-mono text-white">{attendee.medicalCouncilNumber}</span>
            </div>
          )}

          {/* Timestamps */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Registered On:</span>
              <span className="font-mono text-white">{new Date(attendee.registeredAt).toLocaleString()}</span>
            </div>
            {attendee.checkInTime && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Last Check-In:</span>
                <span className="font-mono text-emerald-400">{new Date(attendee.checkInTime).toLocaleTimeString()}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Badge Print Count:</span>
              <span className="font-mono text-white">{attendee.printCount} prints</span>
            </div>
          </div>

          {/* QR payload preview */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px]">
            <span className="text-slate-400 block mb-1">Scannable QR Payload:</span>
            <code className="text-indigo-300 font-mono break-all">{attendee.qrCodeData}</code>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={() => onEdit(attendee)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Edit Record
          </button>
          <button
            onClick={() => onPrintBadge(attendee)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md active:scale-95 flex items-center gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Print Badge</span>
          </button>
        </div>
      </div>
    </div>
  );
};
