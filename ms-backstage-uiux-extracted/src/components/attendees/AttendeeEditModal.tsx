import React, { useState } from 'react';
import { Attendee, PaymentStatus, AttendanceStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Save } from 'lucide-react';

interface AttendeeEditModalProps {
  attendee: Attendee | null;
  onClose: () => void;
  onSave: (updated: Partial<Attendee>) => void;
}

export const AttendeeEditModal: React.FC<AttendeeEditModalProps> = ({
  attendee,
  onClose,
  onSave
}) => {
  const { currentEvent } = useApp();

  if (!attendee) return null;

  const [fullName, setFullName] = useState(attendee.fullName);
  const [category, setCategory] = useState(attendee.category);
  const [email, setEmail] = useState(attendee.email || '');
  const [mobile, setMobile] = useState(attendee.mobile || '');
  const [company, setCompany] = useState(attendee.company || '');
  const [designation, setDesignation] = useState(attendee.designation || '');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(attendee.paymentStatus);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>(attendee.attendanceStatus);
  const [medicalCouncilNumber, setMedicalCouncilNumber] = useState(attendee.medicalCouncilNumber || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      fullName,
      category,
      email,
      mobile,
      company,
      designation,
      paymentStatus,
      attendanceStatus,
      medicalCouncilNumber
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md" onClick={onClose} />

      <div 
        role="dialog" 
        aria-modal="true"
        className="relative w-full max-w-lg rounded-3xl glass-popover p-6 shadow-2xl border border-slate-700/80 text-slate-100 z-10"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="font-mono text-xs text-indigo-400 font-bold">{attendee.registrationNumber}</span>
            <h2 className="text-lg font-bold text-white tracking-tight">Edit Attendee Record</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Full Name (Mandatory)</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              >
                {currentEvent.categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Paid">Paid</option>
                <option value="Complimentary">Complimentary</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Mobile Phone</label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Organization / Institute</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Designation</label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Medical Council Reg # (Optional)</label>
              <input
                type="text"
                value={medicalCouncilNumber}
                onChange={(e) => setMedicalCouncilNumber(e.target.value)}
                placeholder="e.g. MCI-12345"
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Attendance Status</label>
              <select
                value={attendanceStatus}
                onChange={(e) => setAttendanceStatus(e.target.value as AttendanceStatus)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Not Arrived">Not Arrived</option>
                <option value="Checked In">Checked In</option>
                <option value="Checked Out">Checked Out</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
