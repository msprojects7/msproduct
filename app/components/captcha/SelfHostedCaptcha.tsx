'use client';

import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { RefreshCw, ShieldCheck, Loader2 } from 'lucide-react';

export interface CaptchaHandle {
  reset: () => void;
  getToken: () => string;
  getAnswer: () => string;
}

interface SelfHostedCaptchaProps {
  onChallengeChange?: (token: string, answer: string) => void;
  className?: string;
  theme?: 'dark' | 'light';
}

export const SelfHostedCaptcha = forwardRef<CaptchaHandle, SelfHostedCaptchaProps>(
  ({ onChallengeChange, className = '', theme = 'dark' }, ref) => {
    const [token, setToken] = useState<string>('');
    const [svg, setSvg] = useState<string>('');
    const [answer, setAnswer] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const onChallengeChangeRef = React.useRef(onChallengeChange);
    React.useEffect(() => {
      onChallengeChangeRef.current = onChallengeChange;
    }, [onChallengeChange]);

    const fetchChallenge = useCallback(async () => {
      setLoading(true);
      setError(null);
      setAnswer('');
      if (onChallengeChangeRef.current) onChallengeChangeRef.current('', '');

      try {
        const res = await fetch('/api/captcha', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load security challenge');
        const data = await res.json();
        setToken(data.token);
        setSvg(data.svg);
      } catch {
        setError('Could not load security verification. Click refresh to retry.');
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      fetchChallenge();
    }, [fetchChallenge]);

    useImperativeHandle(ref, () => ({
      reset: () => {
        fetchChallenge();
      },
      getToken: () => token,
      getAnswer: () => answer,
    }));

    const handleAnswerChange = (val: string) => {
      const clean = val.toUpperCase().replace(/[^2-9A-Z]/g, '').slice(0, 5);
      setAnswer(clean);
      if (onChallengeChangeRef.current) {
        onChallengeChangeRef.current(token, clean);
      }
    };

    const isDark = theme === 'dark';

    return (
      <div
        className={`rounded-2xl p-4 border transition-all ${
          isDark
            ? 'bg-slate-900/60 border-slate-800 text-slate-200'
            : 'bg-slate-50/80 border-slate-200 text-slate-800'
        } ${className}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            <span>Security Verification</span>
          </div>
          <button
            type="button"
            onClick={fetchChallenge}
            disabled={loading}
            className={`inline-flex items-center gap-1 text-[11px] font-medium transition ${
              isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Get new security challenge"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {error ? (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 text-center space-y-2">
            <p>{error}</p>
            <button
              type="button"
              onClick={fetchChallenge}
              className="px-3 py-1 bg-red-600 text-white rounded-lg text-[11px] font-semibold"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* SVG Visual Challenge Display */}
            <div className="flex items-center justify-center p-2 rounded-xl bg-white border border-slate-200 shadow-2xs overflow-hidden min-h-[58px]">
              {loading ? (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  Generating challenge…
                </div>
              ) : (
                <div
                  dangerouslySetInnerHTML={{ __html: svg }}
                  className="flex items-center justify-center select-none"
                  aria-label="Security verification code image"
                />
              )}
            </div>

            {/* Answer Input */}
            <div>
              <input
                type="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck="false"
                required
                value={answer}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Enter the 5 characters above"
                maxLength={5}
                className={`w-full px-3.5 py-2 text-xs font-mono font-bold tracking-widest text-center rounded-xl border outline-none transition uppercase ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
);

SelfHostedCaptcha.displayName = 'SelfHostedCaptcha';
export default SelfHostedCaptcha;
