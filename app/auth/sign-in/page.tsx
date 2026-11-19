'use client';

import React, { useState, useEffect, useRef } from 'react';
import { authClient } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/app/components/ui/Toast';
import { DemoLoginModal, DemoAccount } from '@/app/components/auth/DemoLoginModal';
import { SelfHostedCaptcha, CaptchaHandle } from '@/app/components/captcha/SelfHostedCaptcha';
import BackButton from '@/app/components/ui/BackButton';
import { ThemeToggle } from '@/app/components/theme/ThemeToggle';
import { useTheme } from '@/app/components/theme/ThemeProvider';
import { Eye, EyeOff, ShieldCheck, KeyRound, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const [captchaAnswer, setCaptchaAnswer] = useState<string>('');
  const captchaRef = useRef<CaptchaHandle>(null);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [authenticatingDemoRole, setAuthenticatingDemoRole] = useState<string | null>(null);
  const [isDevEnvironment, setIsDevEnvironment] = useState(
    process.env.NODE_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS === 'true'
  );
  const [loggedOutMessage, setLoggedOutMessage] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  // Check if Google OAuth is configured
  const isGoogleConfigured = Boolean(
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true' ||
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  );

  useEffect(() => {
    const isDev =
      process.env.NODE_ENV !== 'production' ||
      process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS === 'true';
    setIsDevEnvironment(isDev);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('logged_out') === 'true') {
        setLoggedOutMessage(true);
      }
    }
  }, []);

  const handleSubmit = async (e?: React.FormEvent, customCredentials?: { email: string; password: string }) => {
    if (e) e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    const targetEmail = customCredentials ? customCredentials.email : email;
    const targetPassword = customCredentials ? customCredentials.password : password;

    const isDevDemo =
      isDevEnvironment &&
      (targetEmail.endsWith('@msbackstage.internal') || targetEmail.endsWith('@apexevents.internal'));

    if (!isDevDemo && (!captchaToken || !captchaAnswer.trim())) {
      const msg = 'Please solve the security verification challenge before signing in.';
      setError(msg);
      toast.warning(msg);
      setLoading(false);
      return;
    }

    try {
      const { data, error: signInError } = await authClient.signIn.email({
        email: targetEmail,
        password: targetPassword,
        fetchOptions: {
          headers: {
            ...(captchaToken ? { 'x-captcha-token': captchaToken } : {}),
            ...(captchaAnswer ? { 'x-captcha-answer': captchaAnswer } : {}),
            ...(honeypot ? { 'x-honeypot': honeypot } : {}),
          },
        },
      });

      if (signInError) {
        const msg = signInError.message || 'Failed to sign in. Please check your credentials.';
        setError(msg);
        toast.error(msg);
        captchaRef.current?.reset();
        setCaptchaToken('');
        setCaptchaAnswer('');
        setLoading(false);
        return;
      }

      toast.success('Signed in successfully! Redirecting...');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(msg);
      toast.error(msg);
      captchaRef.current?.reset();
      setCaptchaToken('');
      setCaptchaAnswer('');
      setLoading(false);
    }
  };

  const handleSelectDemoAccount = async (account: DemoAccount, autoSubmit = false) => {
    setEmail(account.email);
    setPassword(account.password);
    setError(null);

    if (autoSubmit) {
      setAuthenticatingDemoRole(account.roleKey);
      toast.info(`Authenticating as ${account.roleName}...`);
      try {
        const { error: signInError } = await authClient.signIn.email({
          email: account.email,
          password: account.password,
        });

        if (signInError) {
          const msg = signInError.message || 'Failed to sign in with demo credentials.';
          setError(msg);
          toast.error(msg);
          setAuthenticatingDemoRole(null);
          return;
        }

        toast.success(`Signed in as ${account.roleName}! Redirecting...`);
        setDemoModalOpen(false);
        router.push(account.landingPage || '/dashboard');
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unexpected error during demo sign in';
        setError(msg);
        toast.error(msg);
        setAuthenticatingDemoRole(null);
      }
    } else {
      setDemoModalOpen(false);
      toast.info(`Populated ${account.roleName} credentials. Review details and click Sign In.`);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSocialLoading('google');
    try {
      if (!isGoogleConfigured) {
        toast.info(
          'Google OAuth is awaiting NEXT_PUBLIC_GOOGLE_CLIENT_ID / Neon Auth configuration.'
        );
        setError('Google OAuth provider is not yet configured. Please configure it in Neon Auth.');
        setSocialLoading(null);
        return;
      }

      if (typeof authClient?.signIn?.social === 'function') {
        const result = await authClient.signIn.social({
          provider: 'google',
          callbackURL: `${window.location.origin}/dashboard`,
        });
        if (result?.error) {
          setError(
            result.error.message ||
              'Google sign-in requires credentials configured in Neon Auth.'
          );
        }
      } else {
        setError(
          'Google sign-in is awaiting OAuth provider registration in the Neon Auth console.'
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to initiate Google sign-in. Verify client credentials in environment.'
      );
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative font-sans transition-colors duration-200">
      {/* Top Left Navigation Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <BackButton href="/" label="Back to Home" />
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
            MS Backstage
          </h1>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">
            Event Operations &amp; Console Access
          </p>
        </div>

        {/* macOS Translucent Glass Card */}
        <div className="bg-white/90 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/80 rounded-3xl p-7 sm:p-9 shadow-2xl relative overflow-hidden">
          {loggedOutMessage && (
            <div
              role="status"
              className="p-3.5 mb-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                <strong className="font-semibold">Signed out successfully.</strong> Select a demo account or sign in with your credentials.
              </span>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="p-3.5 mb-5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-700 dark:text-red-400 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-In Button */}
          <div className="mb-5">
            <button
              type="button"
              id="google-sign-in-btn"
              disabled={Boolean(socialLoading || loading)}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 active:bg-slate-200 dark:active:bg-white/15 border border-slate-300 dark:border-white/10 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-white transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{socialLoading === 'google' ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            <div className="flex items-center my-5 gap-3">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                or email &amp; password
              </span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
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

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
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

            {/* Honeypot field */}
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
              id="sign-in-submit-btn"
              disabled={loading || Boolean(socialLoading)}
              className="w-full py-3 px-5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-xs sm:text-sm rounded-full transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98]"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Authenticating...' : 'Sign In to Console'}</span>
            </button>

            <div className="text-center pt-2 text-xs text-slate-600 dark:text-slate-400">
              Don&apos;t have an account?{' '}
              <Link href="/auth/sign-up" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-semibold transition">
                Create an account
              </Link>
            </div>
          </form>

          {/* Local Developer Acceptance Testing Tool */}
          {isDevEnvironment && (
            <div className="mt-6 pt-5 border-t border-dashed border-slate-200 dark:border-slate-800">
              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                    Dev Fast Logins
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    DEV ONLY
                  </span>
                </div>
                <p className="text-[11.5px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Switch between 5 verified test roles (Platform Admin, Org Owner, Event Manager, Desk Staff, Scanner).
                </p>
                <button
                  type="button"
                  id="demo-logins-trigger-btn"
                  onClick={() => setDemoModalOpen(true)}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full text-xs font-semibold transition shadow-md shadow-blue-600/20 hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Select Test Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Demo Logins Dialog */}
      <DemoLoginModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        onSelectAccount={handleSelectDemoAccount}
        authenticatingRole={authenticatingDemoRole}
      />
    </div>
  );
}
