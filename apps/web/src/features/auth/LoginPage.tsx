import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Lock,
  Cloud,
  Zap,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
  Mail,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { BrandSquircle } from '../../components/ui/BrandSquircle.js';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide your email and master password');
      return;
    }

    setIsSubmitting(true);
    try {
      setStatusMessage('Deriving zero-knowledge keys with Argon2id...');
      await login(email, password);
      setStatusMessage('Vault unlocked! Redirecting...');
      navigate('/vault');
    } catch (err: any) {
      setStatusMessage(null);
      setError(
        err?.response?.data?.error ||
        err?.message ||
        'Authentication failed. Please verify your credentials.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = isLoading || isSubmitting;

  return (
    <div className="min-h-screen bg-[#07050E] flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans selection:bg-[#B026FF]/30 selection:text-[#E0B0FF] animate-fade-in">
      {/* Outer Rounded Container mirroring Image 2 (WhatsApp Image 8.12.19 PM) with slide up transition */}
      <div className="w-full max-w-6xl rounded-[2.5rem] bg-[#0E0A1A] border border-[#271E42] shadow-[0_20px_70px_rgba(0,0,0,0.8)] overflow-hidden grid grid-cols-1 lg:grid-cols-2 animate-fade-in-up transition-all duration-500">
        
        {/* ======================================================== */}
        {/* LEFT PANE: Branding, Tagline, 3D Pedestal, 3 Feature Badges */}
        {/* ======================================================== */}
        <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#201838] relative overflow-hidden bg-gradient-to-b from-[#140D26] via-[#0E0A1A] to-[#0A0714]">
          {/* Subtle Ambient Cosmic Glows with pulse animation */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#8F2BF7]/15 rounded-full blur-[100px] pointer-events-none animate-pulse-glow" />
          <div className="absolute bottom-10 left-10 w-60 h-60 bg-[#D946EF]/10 rounded-full blur-[90px] pointer-events-none animate-pulse-glow animate-delay-200" />

          {/* Top Header Logo & Headline */}
          <div className="relative z-10">
            <div className="mb-6 transform hover:scale-105 transition-transform duration-300 inline-block">
              <BrandSquircle size={54} />
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
              Your files, always{' '}
              <span className="block text-[#C084FC]">safe and accessible.</span>
            </h1>

            <p className="mt-4 text-xs sm:text-sm text-[#9D94B8] max-w-md leading-relaxed">
              CloudVault is end-to-end encrypted cloud storage that puts your privacy first.
            </p>
          </div>

          {/* Center 3D Pedestal & Elevated Vault Emblem with Floating Animation */}
          <div className="relative z-10 my-10 sm:my-14 flex items-center justify-center">
            {/* Triangular surrounding feature nodes (Secure, Store, Access) */}
            <div className="relative w-72 h-64 flex items-center justify-center">
              {/* Secure Node (Top-Left) with hover transition */}
              <div className="absolute -top-1 -left-2 flex flex-col items-center text-center w-24 group transition-transform duration-300 hover:-translate-y-1">
                <div className="w-11 h-11 rounded-full bg-[#1C1433] border border-[#3D2C68] group-hover:border-[#D946EF] flex items-center justify-center text-[#D946EF] shadow-md shadow-purple-950/40 mb-1.5 transition-all duration-300 group-hover:scale-110">
                  <ShieldCheck size={20} />
                </div>
                <span className="text-xs font-bold text-white tracking-wide">Secure</span>
                <span className="text-[10px] text-[#8C82A8] leading-tight">Your data is always protected</span>
              </div>

              {/* Store Node (Top-Right) with hover transition */}
              <div className="absolute -top-1 -right-2 flex flex-col items-center text-center w-24 group transition-transform duration-300 hover:-translate-y-1">
                <div className="w-11 h-11 rounded-full bg-[#1C1433] border border-[#3D2C68] group-hover:border-[#D946EF] flex items-center justify-center text-[#D946EF] shadow-md shadow-purple-950/40 mb-1.5 transition-all duration-300 group-hover:scale-110">
                  <Cloud size={20} />
                </div>
                <span className="text-xs font-bold text-white tracking-wide">Store</span>
                <span className="text-[10px] text-[#8C82A8] leading-tight">Store files safely in the cloud</span>
              </div>

              {/* Access Node (Bottom-Center) with hover transition */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center text-center w-28 group transition-transform duration-300 hover:translate-y-1">
                <div className="w-11 h-11 rounded-full bg-[#1C1433] border border-[#3D2C68] group-hover:border-[#D946EF] flex items-center justify-center text-[#D946EF] shadow-md shadow-purple-950/40 mb-1.5 transition-all duration-300 group-hover:scale-110">
                  <Zap size={20} />
                </div>
                <span className="text-xs font-bold text-white tracking-wide">Access</span>
                <span className="text-[10px] text-[#8C82A8] leading-tight">Access anytime, anywhere</span>
              </div>

              {/* Central 3D Elliptical Pedestal Platform */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Outer pedestal diffuse shadow */}
                <div className="absolute w-44 h-14 bg-[#A855F7]/25 rounded-[100%] blur-md -bottom-1 animate-pulse-glow" />
                {/* 3D Tier 1 cylinder step */}
                <div className="absolute w-40 h-10 bg-gradient-to-b from-[#2A1D4A] to-[#160E2E] rounded-[100%] border border-[#4E397E] translate-y-2 shadow-inner" />
                {/* 3D Tier 2 top platform disc */}
                <div className="absolute w-36 h-9 bg-gradient-to-r from-[#3B2568] via-[#543396] to-[#3B2568] rounded-[100%] border border-[#7C3AED]/70 -translate-y-1 shadow-[0_0_20px_rgba(168,85,247,0.35)]" />
              </div>

              {/* Elevated Vault Squircle on Pedestal with Gentle Floating Animation */}
              <div className="relative z-20 animate-float">
                <BrandSquircle size={88} className="shadow-[0_12px_40px_rgba(168,85,247,0.5)] border-2 border-purple-400/40 transition-transform duration-300 hover:scale-105 cursor-pointer" />
              </div>
            </div>
          </div>

          {/* Bottom 3 Feature Detail Cards Row with interactive scale */}
          <div className="relative z-10 grid grid-cols-3 gap-3 pt-4 border-t border-[#201838]">
            <div className="flex flex-col p-2 rounded-xl transition-all duration-200 hover:bg-[#1C1433]/50">
              <div className="flex items-center gap-1.5 mb-1 text-[#D946EF]">
                <ShieldCheck size={14} />
                <span className="text-[11px] font-bold text-white">End-to-End Encrypted</span>
              </div>
              <p className="text-[10px] text-[#8C82A8] leading-tight">
                Your files are encrypted on your device before they are uploaded.
              </p>
            </div>

            <div className="flex flex-col p-2 rounded-xl transition-all duration-200 hover:bg-[#1C1433]/50">
              <div className="flex items-center gap-1.5 mb-1 text-[#D946EF]">
                <Lock size={14} />
                <span className="text-[11px] font-bold text-white">Private by Design</span>
              </div>
              <p className="text-[10px] text-[#8C82A8] leading-tight">
                We never see your data. Nobody does.
              </p>
            </div>

            <div className="flex flex-col p-2 rounded-xl transition-all duration-200 hover:bg-[#1C1433]/50">
              <div className="flex items-center gap-1.5 mb-1 text-[#D946EF]">
                <Cloud size={14} />
                <span className="text-[11px] font-bold text-white">Access Anywhere</span>
              </div>
              <p className="text-[10px] text-[#8C82A8] leading-tight">
                Access your files anytime, from any device.
              </p>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT PANE: Log In Form (Exact Reproduction of Image 2)  */}
        {/* ======================================================== */}
        <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-[#0C0817] relative">
          <div className="max-w-md w-full mx-auto">
            
            {/* Top Centered Brand Logo & Title with gentle float */}
            <div className="flex flex-col items-center mb-7">
              <div className="transform hover:scale-105 transition-transform duration-300 mb-4 inline-block">
                <BrandSquircle size={52} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Log in to your account
              </h2>
            </div>

            {/* OAuth Social Buttons with smooth hover effect */}
            <div className="space-y-3 mb-6">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-[#140D26] hover:bg-[#1C1433] hover:border-[#6B21A8]/60 border border-[#2D224D] text-xs font-semibold text-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-[#140D26] hover:bg-[#1C1433] hover:border-[#6B21A8]/60 border border-[#2D224D] text-xs font-semibold text-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
              >
                <svg className="w-4 h-4" viewBox="0 0 21 21">
                  <path fill="#F25022" d="M1 1h9v9H1z"/>
                  <path fill="#00A4EF" d="M1 11h9v9H1z"/>
                  <path fill="#7FBA00" d="M11 1h9v9h-9z"/>
                  <path fill="#FFB900" d="M11 11h9v9h-9z"/>
                </svg>
                <span>Continue with Microsoft</span>
              </button>

              <button
                type="button"
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-[#140D26] hover:bg-[#1C1433] hover:border-[#6B21A8]/60 border border-[#2D224D] text-xs font-semibold text-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
              >
                <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.98.6-2.62 1.35-.57.65-1.06 1.72-.93 2.74 1.01.08 2.03-.51 2.63-1.24z"/>
                </svg>
                <span>Continue with Apple</span>
              </button>
            </div>

            {/* Divider "or" */}
            <div className="relative flex items-center justify-center mb-6">
              <div className="border-t border-[#251B3D] w-full" />
              <span className="bg-[#0C0817] px-3 text-[11px] font-medium text-[#7A7094] uppercase tracking-wider">
                or
              </span>
            </div>

            {/* Error & Status Alert Banners with transitions */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300 animate-fade-in">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {statusMessage && (
              <div className="mb-4 p-3 rounded-xl bg-[#9333EA]/15 border border-[#A855F7]/30 flex items-center gap-2.5 text-xs text-[#D8B4FE] animate-pulse">
                <Lock size={14} className="text-[#C084FC]" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Form Inputs matching Image 2 with smooth focus transition */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Input */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A7094] group-focus-within:text-[#C084FC] transition-colors">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#140D26] border border-[#2D224D] focus:border-[#A855F7] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-[#7A7094] focus:outline-none focus:ring-2 focus:ring-[#A855F7]/30 transition-all duration-200"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A7094] group-focus-within:text-[#C084FC] transition-colors">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#140D26] border border-[#2D224D] focus:border-[#A855F7] rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-[#7A7094] focus:outline-none focus:ring-2 focus:ring-[#A855F7]/30 transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#7A7094] hover:text-[#C084FC] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <Link
                  to="/verify-email"
                  className="text-xs text-[#A855F7] hover:text-[#C084FC] font-medium transition-colors hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>

              {/* Log In Button matching Image 2 magenta gradient with scale transition */}
              <button
                type="submit"
                disabled={isBusy}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#9333EA] via-[#A855F7] to-[#C026D3] hover:from-[#A855F7] hover:to-[#D946EF] text-white font-bold text-sm shadow-[0_4px_25px_rgba(168,85,247,0.4)] transition-all duration-300 hover:shadow-[0_6px_30px_rgba(168,85,247,0.6)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-50"
              >
                {isBusy ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Deriving Argon2id Keys...</span>
                  </span>
                ) : (
                  'Log In'
                )}
              </button>
            </form>

            {/* Bottom Footer Switcher */}
            <div className="mt-8 text-center text-xs text-[#8C82A8]">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#C084FC] hover:underline font-semibold transition-colors">
                Create an account
              </Link>
            </div>

            {/* Help Center footer query */}
            <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-[#7A7094]">
              <HelpCircle size={14} />
              <span>Need help? Visit our <a href="#" className="text-[#8C82A8] hover:text-white underline transition-colors">Help Center</a></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
