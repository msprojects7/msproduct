import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

interface CaptchaChallengeProps {
  onVerify: (isValid: boolean) => void;
  isVerified: boolean;
}

export const CaptchaChallenge: React.FC<CaptchaChallengeProps> = ({ onVerify, isVerified }) => {
  const [num1, setNum1] = useState<number>(4);
  const [num2, setNum2] = useState<number>(7);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const generateChallenge = () => {
    const a = Math.floor(Math.random() * 8) + 2;
    const b = Math.floor(Math.random() * 9) + 1;
    setNum1(a);
    setNum2(b);
    setUserAnswer('');
    setHasError(false);
    onVerify(false);
  };

  useEffect(() => {
    generateChallenge();
  }, []);

  const handleValidate = (val: string) => {
    setUserAnswer(val);
    const parsed = parseInt(val.trim(), 10);
    if (!isNaN(parsed)) {
      if (parsed === num1 + num2) {
        setIsChecking(true);
        setTimeout(() => {
          setIsChecking(false);
          setHasError(false);
          onVerify(true);
        }, 150);
      } else if (val.trim().length >= (num1 + num2).toString().length) {
        setHasError(true);
        onVerify(false);
      } else {
        setHasError(false);
        onVerify(false);
      }
    } else {
      setHasError(false);
      onVerify(false);
    }
  };

  return (
    <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-slate-200">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
        <span className="flex items-center gap-1.5 font-medium text-slate-300">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          Security Verification
        </span>
        <button
          type="button"
          onClick={generateChallenge}
          disabled={isVerified}
          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors disabled:opacity-40"
          title="Regenerate security challenge"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>New problem</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Challenge Box with distorted background pattern */}
        <div className="relative px-3.5 py-2 rounded-lg bg-slate-950/80 border border-slate-700/80 font-mono text-sm font-semibold tracking-wider text-indigo-300 select-none shadow-inner flex items-center justify-center min-w-[100px]">
          <span className="relative z-10">{num1} + {num2} = ?</span>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-transparent to-sky-500/10 pointer-events-none rounded-lg" />
        </div>

        {/* Answer Input */}
        <div className="relative flex-1">
          <input
            type="text"
            inputMode="numeric"
            value={userAnswer}
            onChange={(e) => handleValidate(e.target.value)}
            disabled={isVerified || isChecking}
            placeholder="Type answer"
            className={`w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-950/60 border ${
              isVerified
                ? 'border-emerald-500 text-emerald-300 bg-emerald-950/20'
                : hasError
                ? 'border-rose-500 text-rose-300 bg-rose-950/20'
                : 'border-slate-700 text-white focus:border-indigo-500'
            } focus:outline-none transition-colors`}
          />
          {isVerified && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
          {hasError && !isVerified && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-rose-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
        {isVerified ? (
          <span className="text-emerald-400 font-medium">Human verification confirmed</span>
        ) : hasError ? (
          <span className="text-rose-400">Incorrect arithmetic answer. Try again.</span>
        ) : (
          <span>Calculate the sum to continue</span>
        )}
        <span className="text-slate-500 font-mono text-[10px]">Self-hosted challenge</span>
      </div>
    </div>
  );
};
