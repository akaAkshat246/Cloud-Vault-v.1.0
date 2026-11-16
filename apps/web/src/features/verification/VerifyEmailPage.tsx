import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  IconMail,
  IconSmartphone,
  IconShieldCheck,
  IconAlertCircle,
  IconClock,
} from '../../components/ui/Icons.js';
import { authApi } from '../../api/auth.api.js';
import { BrandSquircle } from '../../components/ui/BrandSquircle.js';

export const VerifyEmailPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'email' | 'phone'>('email');
  const [targetEmail] = useState('you@example.com');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(272);
  const [verifying, setVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleDigitChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = clean;
    setDigits(newDigits);

    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = digits.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setVerifying(true);
    setError(null);
    try {
      await authApi.verifyEmail(code);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Verification failed. Please check the code.');
    } finally {
      setVerifying(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-lg p-6 sm:p-8 text-center space-y-6">
        <div className="flex justify-center">
          <BrandSquircle size={48} />
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-100">Verify Your Account</h1>
          <p className="text-xs text-slate-400 mt-1">
            Zero-knowledge account authorization code
          </p>
        </div>

        {/* Tab Controls */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 border border-slate-800 rounded-md">
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'email'
                ? 'bg-slate-800 text-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <IconMail size={14} />
            <span>Email Code</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('phone')}
            className={`py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'phone'
                ? 'bg-slate-800 text-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <IconSmartphone size={14} />
            <span>SMS Code</span>
          </button>
        </div>

        <p className="text-xs text-slate-300">
          We sent a 6-digit security token to <span className="font-mono text-sky-400">{targetEmail}</span>
        </p>

        {/* 6-Digit PIN input boxes */}
        <div className="flex justify-center gap-2">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-10 h-12 text-center text-lg font-mono font-bold bg-slate-950 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
            />
          ))}
        </div>

        {error && (
          <div className="p-2.5 rounded bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-center gap-2 justify-center">
            <IconAlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {isSuccess && (
          <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2 justify-center">
            <IconShieldCheck size={14} />
            <span>Email verified successfully. You may proceed to your vault.</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1.5">
            <IconClock size={13} />
            <span>Expires in {formatTimer(timeLeft)}</span>
          </div>
          <button
            type="button"
            onClick={() => setTimeLeft(300)}
            className="text-sky-400 hover:underline"
          >
            Resend Code
          </button>
        </div>

        <button
          type="button"
          onClick={handleVerify}
          disabled={verifying || isSuccess}
          className="w-full py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 rounded-md transition-colors"
        >
          {verifying ? 'Verifying...' : 'Submit Verification Token'}
        </button>

        <div className="text-center pt-2">
          <Link to="/login" className="text-xs text-slate-400 hover:text-slate-200">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};
