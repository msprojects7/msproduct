import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../navigation/BackButton';
import { Mail, CheckCircle2, ArrowRight } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { navigate, addToast } = useApp();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    addToast({
      type: 'info',
      title: 'Reset Link Dispatched',
      message: `Password reset instructions sent to ${email} (simulated preview).`
    });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <BackButton label="Back to Sign In" targetRoute="signin" className="mb-4" />

        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 shadow-2xl">
          <h1 className="text-2xl font-bold tracking-tight text-white text-center">Reset Account Password</h1>
          <p className="mt-1 text-xs text-slate-400 text-center mb-6">
            Enter your registered email address to receive password recovery instructions.
          </p>

          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white">Check Your Inbox</p>
              <p className="text-xs text-slate-300 leading-relaxed">
                We've dispatched password recovery instructions to <span className="font-semibold text-white">{email}</span>.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('reset-password')}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-md"
                >
                  Proceed to Reset Password Screen (Demo Shortcut)
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registered Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Send Reset Link</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
