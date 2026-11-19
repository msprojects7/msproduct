import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../navigation/BackButton';
import { CaptchaChallenge } from '../ui/CaptchaChallenge';
import { Layers, Eye, EyeOff, Lock, Mail, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

export const SignInPage: React.FC = () => {
  const { navigate, addToast, setCurrentRole } = useApp();
  const [email, setEmail] = useState('suryakumar56394@gmail.com');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaVerified) {
      addToast({
        type: 'warning',
        title: 'CAPTCHA Required',
        message: 'Please complete the arithmetic verification challenge to sign in.'
      });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      addToast({
        type: 'success',
        title: 'Welcome Back, Surya!',
        message: 'Signed in successfully to Apex Worldwide Events.'
      });
      navigate('dashboard');
    }, 400);
  };

  const handleDemoSignIn = (role: 'Organization Owner' | 'Registration Staff') => {
    setCurrentRole(role);
    if (role === 'Registration Staff') {
      setEmail('arjun.counter1@apexevents.com');
    } else {
      setEmail('suryakumar56394@gmail.com');
    }
    setCaptchaVerified(true);
    addToast({
      type: 'info',
      title: `Demo Credentials Applied`,
      message: `Role set to ${role}. Signing into live workspace...`
    });
    setTimeout(() => {
      navigate('dashboard');
    }, 250);
  };

  const handleGoogleSignIn = () => {
    addToast({
      type: 'info',
      title: 'Google Sign-In Integration Point',
      message: 'Client-side OAuth boundary ready for production client ID configuration.'
    });
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <BackButton label="Back to Homepage" targetRoute="home" className="mb-4" />

        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
          {/* Brand Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-0.5 mx-auto mb-3 shadow-lg shadow-indigo-950/50 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Layers className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Sign In to MS Backstage</h1>
            <p className="mt-1 text-xs text-slate-400">
              Access your events, attendee records, and on-site scanners
            </p>
          </div>

          {/* Quick Demo Credentials Banner */}
          <div className="mb-6 p-3 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-indigo-300 mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant Prototype Sign-In</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-tight mb-2">
              Bypass form entry to preview different authorized roles immediately:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoSignIn('Organization Owner')}
                className="py-1.5 px-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-[11px] font-medium text-center transition-colors"
              >
                Sign In as Owner
              </button>
              <button
                type="button"
                onClick={() => handleDemoSignIn('Registration Staff')}
                className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium text-center transition-colors"
              >
                Sign In as Staff
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => navigate('forgot-password')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
              />
              <label htmlFor="remember-me" className="ml-2 text-xs text-slate-300 select-none cursor-pointer">
                Remember this device for 30 days
              </label>
            </div>

            {/* Visible Self-Hosted CAPTCHA Challenge */}
            <div className="pt-1">
              <CaptchaChallenge onVerify={setCaptchaVerified} isVerified={captchaVerified} />
            </div>

            {/* Sign In CTA */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-950/60 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Verifying Credentials...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Social Sign-In (Google only as specified) */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-950/60 hover:bg-slate-900 border border-slate-800 flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google Workspace</span>
            </button>
            <p className="mt-2 text-center text-[10px] text-slate-400 font-mono">
              [OAuth client integration point — ready for Google credentials]
            </p>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an organization account?{' '}
            <button
              onClick={() => navigate('signup')}
              className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
