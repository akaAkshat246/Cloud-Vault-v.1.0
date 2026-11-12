import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import { authApi } from '../../api/auth.api.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resend form
  const [resendEmail, setResendEmail] = useState('');
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (token) {
      setVerifying(true);
      authApi
        .verifyEmail(token)
        .then(() => {
          setSuccess(true);
          setError(null);
        })
        .catch((err) => {
          setError(err?.response?.data?.error || 'Invalid or expired verification token');
        })
        .finally(() => {
          setVerifying(false);
        });
    }
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    setResendLoading(true);
    setResendMessage(null);
    try {
      const res = await authApi.resendVerification(resendEmail);
      setResendMessage(res.message);
    } catch (err: any) {
      setResendMessage('If an unverified account exists, a link has been dispatched.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-teal-500/30 selection:text-teal-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-800 flex items-center justify-center shadow-lg shadow-teal-900/30 border border-teal-400/30">
            <ShieldCheck size={22} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">CloudVault</span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-white">Email Address Verification</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="glass-panel py-8 px-6 sm:px-8 rounded-2xl border border-slate-700/60 shadow-2xl text-center">
          {verifying ? (
            <div className="py-6 space-y-3">
              <RefreshCw size={36} className="text-teal-400 animate-spin mx-auto" />
              <p className="text-sm text-slate-300">Verifying your email token...</p>
            </div>
          ) : success ? (
            <div className="py-6 space-y-4">
              <CheckCircle2 size={48} className="text-teal-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Email Verified Successfully!</h3>
              <p className="text-xs text-slate-400">
                Your email address is now verified. You have full access to all CloudVault features.
              </p>
              <div className="pt-2">
                <Link to="/vault">
                  <Button variant="primary" className="w-full">
                    Go to My Vault
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-left">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                  <Mail size={16} className="text-teal-400" />
                  <span>Resend Verification Link</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Enter your email address to receive a fresh verification link.
                </p>
              </div>

              {resendMessage && (
                <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/30 text-xs text-teal-300">
                  {resendMessage}
                </div>
              )}

              <form onSubmit={handleResend} className="space-y-3">
                <Input
                  label="Registered Email"
                  type="email"
                  placeholder="you@domain.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  required
                />
                <Button type="submit" variant="primary" size="sm" className="w-full" isLoading={resendLoading}>
                  Dispatch Verification Email
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

