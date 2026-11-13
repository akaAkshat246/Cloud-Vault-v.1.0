import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { cryptoBridge } from '../../crypto/crypto-bridge.js';
import { RecoveryModal } from './RecoveryModal.js';
import { BrandSquircle } from '../../components/ui/BrandSquircle.js';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recovery Kit State
  const [mnemonic, setMnemonic] = useState('');
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  const handleStartRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || !confirmPassword) {
      setError('All required fields must be filled');
      return;
    }

    if (password.length < 12) {
      setError('Password must be at least 12 characters long for zero-knowledge security');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreeTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate 24-word BIP-39 mnemonic
      const phrase = await cryptoBridge.generateMnemonic();
      setMnemonic(phrase);
      setShowRecoveryModal(true);
    } catch (err: any) {
      setError('Failed to generate recovery mnemonic');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecoveryConfirmed = async () => {
    setShowRecoveryModal(false);
    setIsSubmitting(true);
    try {
      await register(email, password, mnemonic);
      navigate('/vault');
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EDE7F6] flex items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans selection:bg-[#B388FF]/30 selection:text-[#5E35B1] animate-fade-in">
      {/* ======================================================== */}
      {/* Background Cosmic Atmosphere with floating celestial bodies */}
      {/* ======================================================== */}
      
      {/* Large Soft Lilac Planet with Ring (Bottom Left) with gentle float */}
      <div className="absolute -bottom-24 -left-28 w-96 h-96 rounded-full bg-gradient-to-tr from-[#D1C4E9] via-[#E1BEE7] to-[#EDE7F6] opacity-80 blur-[2px] pointer-events-none animate-float-slow" />
      <div className="absolute -bottom-16 -left-32 w-[30rem] h-28 border-4 border-[#D1C4E9]/50 rounded-[100%] transform -rotate-[22deg] pointer-events-none animate-float-slow" />

      {/* Saturn-like Ringed Planet (Top Right) */}
      <div className="absolute top-12 right-12 sm:right-24 w-32 h-32 rounded-full bg-gradient-to-b from-[#E1BEE7] to-[#D1C4E9] opacity-90 pointer-events-none shadow-sm animate-float" />
      <div className="absolute top-20 right-4 sm:right-16 w-52 h-16 border-2 border-[#D1C4E9]/60 rounded-[100%] transform -rotate-[24deg] pointer-events-none animate-float" />

      {/* Orbiting Moons / Small Spheres */}
      <div className="absolute top-28 left-20 w-8 h-8 rounded-full bg-[#D1C4E9] opacity-75 pointer-events-none animate-pulse-glow" />
      <div className="absolute top-44 left-36 w-10 h-10 rounded-full bg-[#CE93D8] opacity-70 pointer-events-none animate-float" />
      <div className="absolute top-64 left-32 w-7 h-7 rounded-full bg-[#B39DDB] opacity-70 pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-24 right-28 w-14 h-14 rounded-full bg-[#D1C4E9] opacity-80 pointer-events-none animate-float-slow" />
      <div className="absolute bottom-28 right-20 w-32 h-10 border-2 border-[#D1C4E9]/50 rounded-[100%] transform -rotate-[22deg] pointer-events-none" />

      {/* Ambient Celestial Nebula Swirl */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.7)_0%,_rgba(237,231,246,0.3)_60%,_rgba(209,196,233,0.4)_100%)] pointer-events-none" />

      {/* ======================================================== */}
      {/* Light Frosted Card Container (Exact Match of Image 1)     */}
      {/* ======================================================== */}
      <div className="relative z-10 w-full max-w-[430px] rounded-[2.2rem] bg-white/75 backdrop-blur-xl border border-white/80 p-8 sm:p-10 shadow-[0_20px_60px_rgba(149,117,205,0.22)] animate-fade-in-up transition-all duration-300 hover:shadow-[0_24px_70px_rgba(149,117,205,0.3)]">
        
        {/* Top Centered Brand Squircle with hover transform */}
        <div className="flex flex-col items-center mb-6">
          <div className="transform hover:scale-105 transition-transform duration-300 mb-4 inline-block">
            <BrandSquircle size={58} className="shadow-[0_8px_20px_rgba(149,117,205,0.35)]" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#2E1A47] tracking-tight">
            Create your account
          </h2>
          <p className="mt-1 text-xs text-[#7E699B] font-medium">
            Sign up to get started with CloudVault
          </p>
        </div>

        {/* Error Alert with fade-in */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2 text-xs text-red-600 animate-fade-in">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Inputs mirroring Image 1 with interactive transitions */}
        <form onSubmit={handleStartRegistration} className="space-y-3.5">
          {/* Username Input */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9575CD] group-focus-within:text-[#673AB7] transition-colors">
              <UserIcon size={16} />
            </div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#F5F1FB] border border-[#E1D5F2] hover:border-[#B39DDB] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#2E1A47] placeholder-[#A594BD] focus:outline-none focus:ring-2 focus:ring-[#9575CD]/40 focus:border-[#9575CD] transition-all duration-200"
            />
          </div>

          {/* Email Input */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9575CD] group-focus-within:text-[#673AB7] transition-colors">
              <Mail size={16} />
            </div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#F5F1FB] border border-[#E1D5F2] hover:border-[#B39DDB] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#2E1A47] placeholder-[#A594BD] focus:outline-none focus:ring-2 focus:ring-[#9575CD]/40 focus:border-[#9575CD] transition-all duration-200"
              required
            />
          </div>

          {/* Password Input */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9575CD] group-focus-within:text-[#673AB7] transition-colors">
              <Lock size={16} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#F5F1FB] border border-[#E1D5F2] hover:border-[#B39DDB] rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-[#2E1A47] placeholder-[#A594BD] focus:outline-none focus:ring-2 focus:ring-[#9575CD]/40 focus:border-[#9575CD] transition-all duration-200"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#A594BD] hover:text-[#7E57C2] transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Confirm Password Input */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9575CD] group-focus-within:text-[#673AB7] transition-colors">
              <Lock size={16} />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#F5F1FB] border border-[#E1D5F2] hover:border-[#B39DDB] rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-[#2E1A47] placeholder-[#A594BD] focus:outline-none focus:ring-2 focus:ring-[#9575CD]/40 focus:border-[#9575CD] transition-all duration-200"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#A594BD] hover:text-[#7E57C2] transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Terms and Privacy Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2 text-[11px] text-[#7E699B] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-[#D1C4E9] text-[#7E57C2] focus:ring-[#7E57C2]"
              />
              <span className="leading-snug">
                I agree to the{' '}
                <a href="#" className="text-[#673AB7] hover:underline font-semibold">Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="text-[#673AB7] hover:underline font-semibold">Privacy Policy</a>
              </span>
            </label>
          </div>

          {/* Lavender/Violet Gradient "Sign Up" Button with hover lift and press effect */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#B388FF] via-[#9575CD] to-[#7E57C2] hover:from-[#C5CAE9] hover:to-[#673AB7] text-white font-bold text-sm shadow-[0_6px_20px_rgba(149,117,205,0.4)] transition-all duration-300 hover:shadow-[0_8px_25px_rgba(149,117,205,0.55)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Generating Zero-Knowledge Keys...</span>
              </span>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        {/* Divider "or" */}
        <div className="relative flex items-center justify-center my-5">
          <div className="border-t border-[#E1D5F2] w-full" />
          <span className="bg-white/80 px-3 text-[10px] font-medium text-[#A594BD] uppercase tracking-wider">
            or
          </span>
        </div>

        {/* Already have an account? Log in with smooth transition */}
        <div className="text-center text-xs text-[#7E699B]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#673AB7] hover:underline font-bold transition-colors">
            Log in
          </Link>
        </div>
      </div>

      {/* 24-word Recovery Kit Modal */}
      {showRecoveryModal && (
        <RecoveryModal
          mnemonic={mnemonic}
          isOpen={showRecoveryModal}
          onConfirm={handleRecoveryConfirmed}
          onClose={() => setShowRecoveryModal(false)}
        />
      )}
    </div>
  );
};
