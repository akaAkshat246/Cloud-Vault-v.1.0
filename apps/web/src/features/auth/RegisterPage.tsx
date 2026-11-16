import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  IconMail,
  IconLock,
  IconEye,
  IconEyeOff,
  IconAlertCircle,
  IconShield,
} from '../../components/ui/Icons.js';
import { useAuth } from '../../hooks/useAuth.js';
import { cryptoBridge } from '../../crypto/crypto-bridge.js';
import { RecoveryModal } from './RecoveryModal.js';
import { BrandSquircle } from '../../components/ui/BrandSquircle.js';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [ageConsent, setAgeConsent] = useState(false);
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
      setError('All required fields must be filled.');
      return;
    }

    if (password.length < 12) {
      setError('Password must be at least 12 characters long for cryptographic security.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    if (!ageConsent) {
      setError('You must confirm that you meet the age requirement (18+ or parental consent).');
      return;
    }

    setIsSubmitting(true);
    try {
      const phrase = await cryptoBridge.generateMnemonic();
      setMnemonic(phrase);
      setShowRecoveryModal(true);
    } catch (err: any) {
      setError('Failed to generate recovery mnemonic in client memory.');
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
      setError(err?.response?.data?.error?.message || err?.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-lg p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <BrandSquircle size={48} className="mb-3" />
          <h1 className="text-xl font-bold text-slate-100">Create Encrypted Vault</h1>
          <p className="text-xs text-slate-400 mt-1">
            Zero-knowledge client-side encryption. Keys derived in local memory.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-center gap-2">
            <IconAlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleStartRegistration} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Account Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <IconMail size={15} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-md pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Master Password (Min 12 Characters)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <IconLock size={15} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-md pl-9 pr-9 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <IconEyeOff size={15} /> : <IconEye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Confirm Master Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <IconLock size={15} />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-md pl-9 pr-9 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
              >
                {showConfirmPassword ? <IconEyeOff size={15} /> : <IconEye size={15} />}
              </button>
            </div>
          </div>

          {/* Compliance & Consent Checkboxes */}
          <div className="space-y-2 pt-1 border-t border-slate-800 text-xs text-slate-300">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded bg-slate-950 border-slate-700 text-sky-600 focus:ring-sky-500"
              />
              <span>
                I agree to the{' '}
                <Link to="/terms" className="text-sky-400 hover:underline">Terms of Service</Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-sky-400 hover:underline">Privacy Policy</Link>.
              </span>
            </label>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={ageConsent}
                onChange={(e) => setAgeConsent(e.target.checked)}
                className="mt-0.5 rounded bg-slate-950 border-slate-700 text-sky-600 focus:ring-sky-500"
              />
              <span>I confirm that I am at least 18 years old or possess parental consent.</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 rounded-md transition-colors flex items-center justify-center gap-2"
          >
            <IconShield size={15} />
            <span>{isSubmitting ? 'Generating Keys...' : 'Generate 24-Word Recovery Kit'}</span>
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-800 text-xs text-slate-400">
          Already have an encrypted vault?{' '}
          <Link to="/login" className="text-sky-400 hover:underline font-medium">
            Sign In
          </Link>
        </div>
      </div>

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
