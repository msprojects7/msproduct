import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../navigation/BackButton';
import { CaptchaChallenge } from '../ui/CaptchaChallenge';
import { Layers, User, Mail, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';

export const SignUpPage: React.FC = () => {
  const { navigate, addToast } = useApp();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Info
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);

  // Step 2: OTP
  const [otpCode, setOtpCode] = useState('');
  const [resendTimer, setResendTimer] = useState(45);

  // Step 3: Password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Password validations
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleStep1Continue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      addToast({ type: 'error', title: 'Missing Information', message: 'Please enter your full name and work email.' });
      return;
    }
    if (!captchaVerified) {
      addToast({ type: 'warning', title: 'Complete Verification', message: 'Please calculate the security CAPTCHA answer.' });
      return;
    }
    setStep(2);
    addToast({
      type: 'info',
      title: 'Verification Code Dispatched',
      message: `A 6-digit one-time passcode was generated for ${email}.`
    });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) {
      addToast({ type: 'error', title: 'Invalid Code', message: 'Please enter the 6-digit verification code.' });
      return;
    }
    setStep(3);
    addToast({
      type: 'success',
      title: 'Email Verified',
      message: 'Now create a secure password to protect your account.'
    });
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasMinLength || !hasNumber || !passwordsMatch) {
      addToast({ type: 'error', title: 'Password Incomplete', message: 'Ensure password meets all security rules.' });
      return;
    }

    addToast({
      type: 'success',
      title: 'Account Initialized!',
      message: `Welcome to MS Backstage, ${fullName}. Launching workspace...`
    });
    navigate('dashboard');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <BackButton label="Back to Sign In" targetRoute="signin" className="mb-4" />

        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 shadow-2xl relative">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-0.5 mx-auto mb-3 shadow-lg shadow-indigo-950/50 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Layers className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Create MS Backstage Account</h1>
            <p className="mt-1 text-xs text-slate-400">
              {step === 1 && 'Step 1 of 3: Provide Organizer Details'}
              {step === 2 && 'Step 2 of 3: Verify Your Email Address'}
              {step === 3 && 'Step 3 of 3: Set Account Password'}
            </p>

            {/* Stepper Dots */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className={`h-1.5 rounded-full transition-all ${step >= 1 ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-800'}`} />
              <div className={`h-1.5 rounded-full transition-all ${step >= 2 ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-800'}`} />
              <div className={`h-1.5 rounded-full transition-all ${step >= 3 ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-800'}`} />
            </div>
          </div>

          {/* STEP 1: Full Name, Email, CAPTCHA */}
          {step === 1 && (
            <form onSubmit={handleStep1Continue} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Jane Smith"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Official Work Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane.smith@institution.org"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-1">
                <CaptchaChallenge onVerify={setCaptchaVerified} isVerified={captchaVerified} />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-950/60 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Continue to Email Verification</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* STEP 2: Email OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-slate-300">
                <p>We sent a 6-digit passcode to <span className="font-semibold text-white">{email}</span>.</p>
                <button
                  type="button"
                  onClick={() => setOtpCode('749201')}
                  className="mt-2 text-indigo-400 hover:text-indigo-300 font-medium underline block text-left"
                >
                  Quick-fill simulated OTP: 749201
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">6-Digit Passcode</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="749201"
                    className="w-full pl-9 pr-3 py-2.5 text-base tracking-widest font-mono rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-center"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Didn't receive code?</span>
                <button
                  type="button"
                  onClick={() => {
                    addToast({ type: 'info', title: 'New OTP Dispatched', message: 'Simulated OTP code resent.' });
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Resend Code
                </button>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md"
                >
                  Confirm Passcode
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Password & Confirm Password */}
          {step === 3 && (
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Create Secure Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Password Requirements Checklist */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 text-[11px]">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>At least 8 characters long</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Contains at least one number</span>
                </div>
                <div className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Passwords match identically</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-950/60 active:scale-95"
              >
                Complete Registration & Launch Workspace
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <button
              onClick={() => navigate('signin')}
              className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
