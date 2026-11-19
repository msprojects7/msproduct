'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/app/components/ui/Toast';
import { SelfHostedCaptcha, CaptchaHandle } from '@/app/components/captcha/SelfHostedCaptcha';
import BackButton from '@/app/components/ui/BackButton';
import { ThemeToggle } from '@/app/components/theme/ThemeToggle';
import { useTheme } from '@/app/components/theme/ThemeProvider';
import { Eye, EyeOff, ShieldCheck, Mail, Lock, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { theme } = useTheme();

  // Steps: 'email' | 'otp' | 'password' | 'success'
  const [step, setStep] = useState<'email' | 'otp' | 'password' | 'success'>('email');

  // Form states
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [grantToken, setGrantToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const [captchaAnswer, setCaptchaAnswer] = useState<string>('');
  const [honeypot, setHoneypot] = useState('');
  const captchaRef = useRef<CaptchaHandle>(null);

  // Status & timing
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpCountdown, setOtpCountdown] = useState(300); // 5 minutes

  // Countdown timers
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, otpCountdown]);

  // Step 1: Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading) return;
    setError(null);

    const isDev = process.env.NODE_ENV !== 'production';
    const isDevTestAccount =
      isDev && (email.endsWith('@msbackstage.internal') || email.endsWith('@apexevents.internal') || email.endsWith('@example.com'));

    if (!isDevTestAccount && (!captchaToken || !captchaAnswer.trim())) {
      const msg = 'Please solve the security verification challenge before continuing.';
      setError(msg);
      toast.warning(msg);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(captchaToken ? { 'x-captcha-token': captchaToken } : {}),
          ...(captchaAnswer ? { 'x-captcha-answer': captchaAnswer } : {}),
          ...(honeypot ? { 'x-honeypot': honeypot } : {}),
        },
        body: JSON.stringify({
          email,
          captchaToken,
          captchaAnswer,
          website_hp: honeypot,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.error || 'Failed to send verification code.';
        setError(msg);
        toast.error(msg);
        captchaRef.current?.reset();
        setCaptchaToken('');
        setCaptchaAnswer('');
        setLoading(false);
        return;
      }

      setStep('otp');
      setResendCooldown(60);
      setOtpCountdown(300);
      setSuccessMsg('Verification code sent to your email.');
      toast.success('Verification code sent! Please check your inbox.');
      setLoading(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error sending verification code.';
      setError(msg);
      toast.error(msg);
      captchaRef.current?.reset();
      setCaptchaToken('');
      setCaptchaAnswer('');
      setLoading(false);
    }
  };

  // Step 2 & 3: Handle OTP input and verification
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance focus to next field
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split('');
      setOtp(digits);
      const lastInput = document.getElementById('otp-input-5');
      lastInput?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      const msg = 'Please enter all 6 digits of your verification code.';
      setError(msg);
      toast.warning(msg);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: fullOtp }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.error || 'Invalid verification code.';
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      setGrantToken(data.grantToken);
      setStep('password');
      setSuccessMsg('Email verified! Please choose your password.');
      toast.success('Email verified! Please set your account password.');
      setLoading(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error verifying code.';
      setError(msg);
      toast.error(msg);
      setLoading(false);
    }
  };

  // Step 4: Finalize registration with password
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    if (password !== confirmPassword) {
      const msg = 'Passwords do not match.';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (password.length < 8) {
      const msg = 'Password must be at least 8 characters long.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          grantToken,
          password,
          confirmPassword,
          name: name.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.error || 'Failed to complete registration.';
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      setStep('success');
      toast.success('Account created successfully! Welcome to MS Backstage.');
      setLoading(false);
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error creating account.';
      setError(msg);
      toast.error(msg);
      setLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative font-sans transition-colors duration-200">
      {/* Top Left Navigation Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <BackButton href="/auth/sign-in" label="Back to Sign In" />
      </div>

      {/* Top Right Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 mb-3">
            <img
              src="/msfav.png"
              alt="MS Backstage Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Create an Account
          </h1>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">
            {step === 'email' && 'Verify your email to get started with MS Backstage'}
            {step === 'otp' && `Enter the 6-digit code sent to ${email}`}
            {step === 'password' && 'Choose a strong password for your account'}
            {step === 'success' && 'Account setup complete! Redirecting...'}
          </p>
        </div>

        {/* macOS Translucent Glass Card */}
        <div className="bg-white/90 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/80 rounded-3xl p-7 sm:p-9 shadow-2xl relative overflow-hidden">
          {error && (
            <div
              role="alert"
              className="p-3.5 mb-5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-700 dark:text-red-400 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && step !== 'email' && (
            <div
              role="status"
              className="p-3.5 mb-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: Email & CAPTCHA */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Your Full Name <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Jane Doe"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Work Email Address
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm outline-none transition"
                />
              </div>

              {/* Self-Hosted Cryptographic Visual CAPTCHA */}
              <div className="pt-1">
                <SelfHostedCaptcha
                  ref={captchaRef}
                  theme={theme === 'light' ? 'light' : 'dark'}
                  onChallengeChange={(token, answer) => {
                    setCaptchaToken(token);
                    setCaptchaAnswer(answer);
                    setError(null);
                  }}
                />
              </div>

              {/* Honeypot */}
              <div className="hidden" aria-hidden="true">
                <input
                  type="text"
                  name="website_hp"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <button
                type="submit"
                id="sign-up-send-otp-btn"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-xs sm:text-sm rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{loading ? 'Sending Code...' : 'Send Verification Code'}</span>
              </button>

              <div className="text-center pt-2 text-xs text-slate-600 dark:text-slate-400">
                Already have an account?{' '}
                <Link href="/auth/sign-in" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-semibold transition">
                  Sign in
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: Enter 6-digit OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                <span>Code expires in: <strong className="text-slate-900 dark:text-white font-mono">{formatTime(otpCountdown)}</strong></span>
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={resendCooldown > 0 || loading}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 disabled:text-slate-400 dark:disabled:text-slate-600 transition"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>

              <div className="flex justify-between gap-2 on-paste" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-12 text-center text-lg font-bold font-mono rounded-xl bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white outline-none transition"
                  />
                ))}
              </div>

              <button
                type="submit"
                id="sign-up-verify-otp-btn"
                disabled={loading || otp.join('').length !== 6}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-xs sm:text-sm rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{loading ? 'Verifying...' : 'Verify Code & Continue'}</span>
              </button>

              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full text-center text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
              >
                ← Change email address
              </button>
            </form>
          )}

          {/* STEP 3: Set Password */}
          {step === 'password' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Choose a Password (minimum 8 characters)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm outline-none transition"
                />
              </div>

              <button
                type="submit"
                id="sign-up-finalize-btn"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-xs sm:text-sm rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
              </button>
            </form>
          )}

          {/* STEP 4: Success */}
          {step === 'success' && (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Welcome aboard!</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Your account is ready. Redirecting to your event console...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
