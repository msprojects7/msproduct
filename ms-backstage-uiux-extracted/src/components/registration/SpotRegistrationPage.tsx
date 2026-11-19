import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../navigation/BackButton';
import { Attendee, PaymentStatus } from '../../types';
import { 
  UserPlus, 
  Printer, 
  CheckCircle2, 
  ArrowRight, 
  RotateCcw, 
  Eye, 
  Zap, 
  CreditCard,
  Building2,
  Stethoscope
} from 'lucide-react';

export const SpotRegistrationPage: React.FC = () => {
  const { 
    currentEvent, 
    addAttendee, 
    navigate, 
    addToast,
    setSelectedBadgeAttendee 
  } = useApp();

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Form Fields (Full Name is only mandatory)
  const [fullName, setFullName] = useState('');
  const [category, setCategory] = useState(currentEvent.categories[0] || 'Delegate');
  const [company, setCompany] = useState('');
  const [designation, setDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [medicalCouncilNumber, setMedicalCouncilNumber] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | 'Prefer not to say'>('Prefer not to say');
  const [mealPreference, setMealPreference] = useState<'Vegetarian' | 'Non-Vegetarian' | 'Vegan' | 'Jain' | 'None'>('Vegetarian');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid');
  const [notes, setNotes] = useState('');

  // Success summary modal state
  const [registeredAttendee, setRegisteredAttendee] = useState<Attendee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Focus name input on mount
  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  // Compute next sequential registration number preview
  const nextSeq = (currentEvent.currentNumber + 1).toString().padStart(currentEvent.numberPadding, '0');
  const nextRegPreview = `${currentEvent.prefix}${nextSeq}`;

  const resetForm = () => {
    setFullName('');
    setCompany('');
    setDesignation('');
    setEmail('');
    setMobile('');
    setMedicalCouncilNumber('');
    setNotes('');
    setRegisteredAttendee(null);
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      addToast({ type: 'warning', title: 'Full Name Required', message: 'Attendee Full Name is mandatory.' });
      nameInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    const newAttendee = addAttendee({
      fullName: fullName.trim(),
      category,
      company: company.trim(),
      designation: designation.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      medicalCouncilNumber: medicalCouncilNumber.trim(),
      gender,
      mealPreference,
      paymentStatus,
      registrationType: 'On-spot',
      notes: notes.trim()
    });

    setIsSubmitting(false);
    setRegisteredAttendee(newAttendee);
    addToast({
      type: 'success',
      title: 'Attendee Registered!',
      message: `${newAttendee.fullName} assigned ${newAttendee.registrationNumber}.`
    });
  };

  const handlePrintImmediately = () => {
    if (registeredAttendee) {
      setSelectedBadgeAttendee(registeredAttendee);
      navigate('print-preview');
    }
  };

  return (
    <div className="w-full pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <BackButton label="Back to Dashboard" targetRoute="dashboard" />
            <div className="pt-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Fast Counter Terminal</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">On-Spot Registration</h1>
              <p className="text-xs text-slate-400">
                {currentEvent.name} · Next sequential ID: <span className="font-mono text-indigo-400 font-bold">{nextRegPreview}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
              Enter ↵ to Submit
            </span>
          </div>
        </div>

        {/* REGISTRATION FORM CONTAINER */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* SECTION 1: MANDATORY FULL NAME */}
            <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span>Attendee Full Name</span>
                  <span className="text-rose-400">*</span>
                </label>
                <span className="text-[11px] text-indigo-300 font-mono">Only Mandatory Field</span>
              </div>
              <input
                ref={nameInputRef}
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Type delegate's full name (e.g. Dr. Jane Smith)"
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-indigo-500/50 text-base font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 shadow-inner"
              />
            </div>

            {/* SECTION 2: CATEGORY & PAYMENT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Delegate Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 text-xs"
                >
                  {currentEvent.categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Counter Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 text-xs"
                >
                  <option value="Paid">Paid (Cash / POS Machine)</option>
                  <option value="Complimentary">Complimentary / VIP</option>
                  <option value="Pending">Payment Pending</option>
                </select>
              </div>
            </div>

            {/* SECTION 3: COMPANY & DESIGNATION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Company / Organization</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Apollo Healthcare / Vanguard Partners"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Designation / Department</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Senior Consultant / Managing Director"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* SECTION 4: CONTACT & MEDICAL COUNCIL (OPTIONAL) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Mobile Phone (Optional)</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+91 98000 00000"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Email Address (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="delegate@hospital.org"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Medical Council # (Optional)</label>
                <input
                  type="text"
                  value={medicalCouncilNumber}
                  onChange={(e) => setMedicalCouncilNumber(e.target.value)}
                  placeholder="e.g. DMC-89201"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* SECTION 5: MEAL & GENDER */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Meal Preference</label>
                <select
                  value={mealPreference}
                  onChange={(e) => setMealPreference(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 text-xs"
                >
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Jain">Jain Meal</option>
                  <option value="Vegan">Vegan</option>
                  <option value="None">None / Not required</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Gender (Optional)</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 text-xs"
                >
                  <option value="Prefer not to say">Prefer not to say</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* SUBMIT ACTIONS */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Form</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-950/50 active:scale-95 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Register & Generate Badge ID</span>
              </button>
            </div>
          </form>
        </div>

        {/* REGISTRATION SUCCESS SUMMARY MODAL */}
        {registeredAttendee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md" onClick={resetForm} />

            <div 
              role="dialog"
              aria-modal="true"
              className="relative w-full max-w-md rounded-3xl glass-popover p-6 sm:p-7 shadow-2xl border border-emerald-500/40 text-slate-100 z-10 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Registration Complete!</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Sequential ID generated and attendee saved to {currentEvent.name}.
                </p>
              </div>

              {/* Summary Card */}
              <div className="my-5 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Assigned Reg #</span>
                  <span className="font-mono text-base font-extrabold text-indigo-400">
                    {registeredAttendee.registrationNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Full Name:</span>
                  <span className="font-semibold text-white">{registeredAttendee.fullName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-semibold text-indigo-300">{registeredAttendee.category}</span>
                </div>
                {registeredAttendee.company && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Affiliation:</span>
                    <span className="text-slate-200">{registeredAttendee.company}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Payment:</span>
                  <span className="text-emerald-400 font-semibold">{registeredAttendee.paymentStatus}</span>
                </div>
                <div className="pt-2 text-[11px] text-slate-400 font-mono text-center">
                  Scannable QR: {registeredAttendee.qrCodeData}
                </div>
              </div>

              {/* Three Actions Required by Spec: Register Another, View Attendee, Print Badge */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handlePrintImmediately}
                  className="w-full py-3 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-950/60 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Badge Immediately</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Register Another</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('attendees')}
                    className="py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View in Directory</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
