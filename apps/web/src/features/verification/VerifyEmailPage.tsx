import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Smartphone,
  ShieldCheck,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { authApi } from '../../api/auth.api.js';
import { BrandSquircle } from '../../components/ui/BrandSquircle.js';

export const VerifyEmailPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'email' | 'phone'>('email');
  const [targetEmail] = useState('you@example.com');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(272); // 04:32 countdown
  const [verifying, setVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '').slice(-1);
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

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setVerifying(true);
    setError(null);
    try {
      await authApi.verifyEmail(code);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Invalid or expired code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07050E] flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans selection:bg-[#B026FF]/30 selection:text-[#E0B0FF] animate-fade-in">
      {/* Outer Cosmic Card mirroring Image 3 with fade-in-up */}
      <div className="w-full max-w-xl rounded-[2.5rem] bg-[#0E0A1A] border border-[#271E42] shadow-[0_20px_70px_rgba(0,0,0,0.85)] p-8 sm:p-12 relative overflow-hidden flex flex-col items-center text-center animate-fade-in-up transition-all duration-300 hover:shadow-[0_25px_80px_rgba(147,51,234,0.3)]">
        
        {/* Subtle Ambient Nebula Glows with pulsing animation */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#8F2BF7]/15 rounded-full blur-[100px] pointer-events-none animate-pulse-glow" />

        {/* Top Centered Brand Logo with smooth hover transform */}
        <div className="mb-6 relative z-10 transform hover:scale-105 transition-transform duration-300 inline-block cursor-pointer">
          <BrandSquircle size={56} />
        </div>

        {/* Title: "Forgot your password?" */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight relative z-10">
          Forgot your <span className="text-[#C084FC]">password?</span>
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#9D94B8] max-w-sm leading-relaxed relative z-10">
          No worries! Verify your identity and we'll send you a code to reset your password.
        </p>

        {/* Tab Switcher: "Verify with Email" vs "Verify with Phone" with smooth pill transition */}
        <div className="mt-6 p-1 rounded-2xl bg-[#140D26] border border-[#2D224D] flex items-center w-full max-w-xs relative z-10">
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-300 ${
              activeTab === 'email'
                ? 'bg-[#2A1C4D] text-white border border-[#6B21A8]/50 shadow-sm scale-[1.02]'
                : 'text-[#8C82A8] hover:text-white'
            }`}
          >
            <Mail size={14} />
            <span>Verify with Email</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('phone')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-300 ${
              activeTab === 'phone'
                ? 'bg-[#2A1C4D] text-white border border-[#6B21A8]/50 shadow-sm scale-[1.02]'
                : 'text-[#8C82A8] hover:text-white'
            }`}
          >
            <Smartphone size={14} />
            <span>Verify with Phone</span>
          </button>
        </div>

        {/* 3D Envelope Illustration & Pedestal with Gentle Floating Animation */}
        <div className="relative my-8 sm:my-10 w-64 h-36 flex items-center justify-center z-10">
          {/* Oval Pedestal Base */}
          <div className="absolute bottom-0 w-52 h-10 bg-gradient-to-r from-[#2A1D4A] via-[#3B2568] to-[#2A1D4A] rounded-[100%] border border-[#4E397E] shadow-[0_0_25px_rgba(168,85,247,0.3)] animate-pulse-glow" />

          {/* 3D Envelope Card Container with float animation */}
          <div className="relative z-10 transform -translate-y-2 flex flex-col items-center animate-float">
            {/* White Digit Card Popping out of envelope */}
            <div className="w-40 py-2 px-3 bg-white/95 rounded-xl border border-purple-200 shadow-md flex items-center justify-center gap-1.5 transform -translate-y-2 transition-transform duration-300 hover:-translate-y-4">
              {['4', '8', '7', '2', '1', '3'].map((sampleDigit, idx) => (
                <span
                  key={idx}
                  className="w-5 h-6 rounded bg-[#2E1A47] text-white text-[11px] font-bold flex items-center justify-center font-mono shadow-sm transition-transform hover:scale-110"
                >
                  {sampleDigit}
                </span>
              ))}
            </div>

            {/* Purple Envelope Body */}
            <div className="w-48 h-20 bg-gradient-to-b from-[#6B21A8] to-[#4C1D95] rounded-b-2xl border-x border-b border-purple-400/40 shadow-lg -mt-3 flex items-center justify-center relative">
              {/* Center Security Shield on Envelope */}
              <div className="w-8 h-8 rounded-full bg-[#1C1433] border border-[#A855F7]/50 flex items-center justify-center text-[#D946EF] shadow-md transition-transform hover:scale-110">
                <ShieldCheck size={18} />
              </div>
            </div>

            {/* Right Shield Badge */}
            <div className="absolute right-0 bottom-2 w-7 h-7 rounded-full bg-[#1C1433] border border-[#A855F7]/50 flex items-center justify-center text-[#D946EF] shadow-md transition-transform hover:scale-110">
              <ShieldCheck size={14} />
            </div>
          </div>
        </div>

        {/* Explanatory Message */}
        <p className="text-xs text-[#8C82A8] relative z-10">
          We've sent a 6-digit verification code to
        </p>
        <p className="text-xs font-semibold text-[#C084FC] mt-0.5 relative z-10">
          {targetEmail}
        </p>

        {/* Success Alert */}
        {isSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center gap-2 text-xs text-emerald-300 relative z-10 animate-fade-in">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Identity verified successfully! Redirecting...</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-300 relative z-10 animate-fade-in">
            <AlertCircle size={14} className="text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* 6 Individual Digit Inputs matching Image 3 with interactive transitions */}
        <form onSubmit={handleVerify} className="w-full max-w-sm mt-5 space-y-5 relative z-10">
          <div className="flex items-center justify-center gap-2.5 sm:gap-3">
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
                className="w-11 h-12 sm:w-12 sm:h-14 rounded-2xl bg-[#140D26] border border-[#2D224D] focus:border-[#C084FC] focus:ring-2 focus:ring-[#A855F7]/40 text-center text-lg sm:text-xl font-bold text-white focus:outline-none transition-all duration-200 shadow-inner hover:border-[#6B21A8]/60 focus:scale-105"
              />
            ))}
          </div>

          {/* Expiry Countdown */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#8C82A8]">
            <Clock size={13} className="text-[#C084FC]" />
            <span>Code expires in {formatTimer(timeLeft)}</span>
          </div>

          {/* Verify Code Magenta Gradient CTA Button with hover lift and press effect */}
          <button
            type="submit"
            disabled={verifying}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#9333EA] via-[#A855F7] to-[#C026D3] hover:from-[#A855F7] hover:to-[#D946EF] text-white font-bold text-sm shadow-[0_4px_25px_rgba(168,85,247,0.45)] hover:shadow-[0_8px_30px_rgba(168,85,247,0.6)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-300 disabled:opacity-50"
          >
            {verifying ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Verifying...</span>
              </span>
            ) : (
              'Verify Code'
            )}
          </button>
        </form>

        {/* Security Priority Bottom Card with hover feedback */}
        <div className="mt-8 p-3.5 rounded-2xl bg-[#120B22] hover:bg-[#180E2E] border border-[#271E42] hover:border-[#6B21A8]/40 transition-colors flex items-center gap-3 w-full max-w-sm text-left relative z-10">
          <div className="w-9 h-9 rounded-xl bg-[#1C1433] border border-[#3D2C68] flex items-center justify-center text-[#D946EF] shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Your security is our priority</h4>
            <p className="text-[10px] text-[#8C82A8] leading-tight">We'll never share your information with anyone.</p>
          </div>
        </div>

        {/* Back to Login */}
        <div className="mt-5 text-center relative z-10">
          <Link to="/login" className="text-xs text-[#8C82A8] hover:text-[#C084FC] transition-colors">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};
