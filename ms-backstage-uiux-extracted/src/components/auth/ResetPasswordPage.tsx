import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../navigation/BackButton';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const { navigate, addToast } = useApp();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const hasLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const match = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasLength || !hasNumber || !match) {
      addToast({ type: 'error', title: 'Invalid Password', message: 'Ensure password meets criteria.' });
      return;
    }

    addToast({
      type: 'success',
      title: 'Password Updated',
      message: 'Your account credentials have been successfully updated. Please sign in.'
    });
    navigate('signin');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <BackButton label="Back to Sign In" targetRoute="signin" className="mb-4" />

        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 shadow-2xl">
          <h1 className="text-2xl font-bold tracking-tight text-white text-center">Set New Password</h1>
          <p className="mt-1 text-xs text-slate-400 text-center mb-6">
            Choose a strong, unique password for your MS Backstage organizer profile.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 text-[11px]">
              <div className={`flex items-center gap-1.5 ${hasLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>At least 8 characters long</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Contains a numeric digit</span>
              </div>
              <div className={`flex items-center gap-1.5 ${match ? 'text-emerald-400' : 'text-slate-500'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Passwords match identically</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg active:scale-95"
            >
              Update Password & Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
