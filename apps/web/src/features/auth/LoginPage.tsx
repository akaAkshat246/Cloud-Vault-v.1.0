import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, AlertCircle } from 'lucide-react';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { useAuth } from '../../hooks/useAuth.js';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide your email and master password');
      return;
    }

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
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-teal-500/30 selection:text-teal-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-800 flex items-center justify-center shadow-lg shadow-teal-900/30 border border-teal-400/30 group-hover:scale-105 transition-transform">
            <ShieldCheck size={22} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">CloudVault</span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-white">Unlock your Encrypted Vault</h2>
        <p className="mt-1 text-xs text-slate-400">
          New to CloudVault?{' '}
          <Link to="/register" className="text-teal-400 hover:text-teal-300 font-medium">
            Create an account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="glass-panel py-8 px-6 sm:px-8 rounded-2xl border border-slate-700/60 shadow-2xl">
          <form className="space-y-4" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {statusMessage && (
              <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center gap-2.5 text-xs text-teal-300 animate-pulse">
                <Lock size={14} className="text-teal-400" />
                <span>{statusMessage}</span>
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Master Password"
              isPassword
              placeholder="Enter your master password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="pt-2">
              <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                <Lock size={16} />
                <span>Unlock Vault</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

