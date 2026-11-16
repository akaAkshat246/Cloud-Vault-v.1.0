import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  IconLock,
  IconEye,
  IconEyeOff,
  IconAlertCircle,
  IconMail,
  IconShieldCheck,
  IconKey,
} from '../../components/ui/Icons.js';
import { useAuth } from '../../hooks/useAuth.js';
import { authStore } from '../../store/auth.store.js';
import { BrandSquircle } from '../../components/ui/BrandSquircle.js';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    authStore.setLoading(false);
  }, []);

  const handleQuickFill = () => {
    setEmail('akshat@cloudvault.internal');
    setPassword('Password123!');
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide your email and master password.');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('Deriving zero-knowledge keys with Argon2id...');
    try {
      await login(email, password);
      setStatusMessage('Vault unlocked. Redirecting...');
      navigate('/vault');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(
        err?.response?.data?.error?.message ||
        err?.message ||
        'Authentication failed. Please verify your email and password.'
      );
      setStatusMessage(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        {/* Left: Cryptographic Security Summary (2-Column structure, NO 3 cards) */}
        <div className="p-8 bg-slate-950/60 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <BrandSquircle size={40} />
              <div>
                <span className="font-bold text-slate-100 tracking-tight text-sm">CloudVault</span>
                <span className="block text-[11px] text-slate-400 font-mono">Zero-Knowledge Storage</span>
              </div>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-100 mb-3">
              Client-Side Authenticated Cloud Storage
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Your password never leaves your browser. Keys are derived in local memory using Argon2id and individual files are encrypted with unique AES-256-GCM / XChaCha20 keys.
            </p>

            <div className="space-y-3 pt-4 border-t border-slate-800/80 text-xs">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-md space-y-1">
                <div className="flex items-center gap-2 text-sky-400 font-semibold">
                  <IconShieldCheck size={15} />
                  <span>Mathematical Zero-Knowledge</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  No plaintext, passwords, or unwrapped encryption keys are ever transmitted or stored on CloudVault servers.
                </p>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-md space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <IconKey size={15} />
                  <span>Envelope Encryption (ADR-004)</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Each file is encrypted with a dedicated File Encryption Key (FEK) wrapped by your 256-bit Master Key.
                </p>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span>GDPR & CCPA Compliant</span>
            <div className="flex items-center gap-3">
              <Link to="/terms" className="hover:text-slate-300">Terms</Link>
              <Link to="/privacy" className="hover:text-slate-300">Privacy</Link>
            </div>
          </div>
        </div>

        {/* Right: Sign-in Form */}
        <div className="p-8 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Unlock Vault</h2>
                <p className="text-xs text-slate-400">Enter your credentials to unwrap your master key</p>
              </div>
              <button
                type="button"
                onClick={handleQuickFill}
                className="text-[11px] font-medium text-sky-400 hover:text-sky-300 bg-sky-950/60 border border-sky-800 px-2.5 py-1 rounded"
              >
                Demo Account
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-center gap-2">
                <IconAlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {statusMessage && (
              <div className="mb-4 p-3 rounded bg-sky-950/40 border border-sky-800 text-xs text-sky-300 flex items-center gap-2 font-mono">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                <span>{statusMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
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
                    placeholder="akshat@cloudvault.internal"
                    className="w-full bg-slate-950 border border-slate-700 rounded-md pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Master Password
                  </label>
                </div>
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
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <IconEyeOff size={15} /> : <IconEye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 rounded-md transition-colors flex items-center justify-center gap-2"
              >
                <IconKey size={14} />
                <span>{isSubmitting ? 'Deriving Keys & Unlocking...' : 'Unlock Encrypted Vault'}</span>
              </button>
            </form>
          </div>

          <div className="text-center pt-4 border-t border-slate-800 text-xs text-slate-400">
            Need a zero-knowledge account?{' '}
            <Link to="/register" className="text-sky-400 hover:underline font-medium">
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
