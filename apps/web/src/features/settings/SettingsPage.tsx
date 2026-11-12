import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Laptop,
  Smartphone,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Lock,
  HardDrive,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { authApi } from '../../api/auth.api.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Badge } from '../../components/ui/Badge.js';
import { SessionItem } from '../../types/api.types.js';

function formatBytes(bytes: number | string): string {
  const b = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (!b || b === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const SettingsPage: React.FC = () => {
  const { user, changePassword } = useAuth();
  const [sessions, setSessions] = useState<SessionItem[]>([]);

  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const loadSessions = async () => {
    try {
      const list = await authApi.getSessions();
      setSessions(list);
    } catch (e) {
      console.error('Failed to load sessions:', e);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await authApi.revokeSession(sessionId);
      await loadSessions();
    } catch (e) {
      console.error('Revoke session failed:', e);
    }
  };

  const handleLogoutAllOther = async () => {
    try {
      await authApi.logoutAll();
      await loadSessions();
    } catch (e) {
      console.error('Logout all failed:', e);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordStatus(null);

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('All password fields are required');
      return;
    }

    if (newPassword.length < 12) {
      setPasswordError('New password must be at least 12 characters long');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(oldPassword, newPassword);
      setPasswordStatus('Master password updated successfully! Vault MasterKey was re-wrapped with zero file re-encryption.');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPasswordError(err?.response?.data?.error || err?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white mb-1">Account & Security Settings</h1>
        <p className="text-xs text-slate-400">
          Manage your zero-knowledge cryptographic credentials, active device sessions, and recovery settings.
        </p>
      </div>

      {/* 1. Account Profile Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <HardDrive size={16} className="text-teal-400" />
          <span>Account Overview</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-[#0a0f1a] rounded-xl border border-slate-800">
            <span className="text-slate-500 block mb-1">Registered Email</span>
            <span className="font-mono text-slate-200">{user?.email}</span>
          </div>
          <div className="p-3 bg-[#0a0f1a] rounded-xl border border-slate-800">
            <span className="text-slate-500 block mb-1">Email Verification</span>
            <span className="text-teal-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 size={13} />
              <span>{user?.is_email_verified ? 'Verified' : 'Pending Verification'}</span>
            </span>
          </div>
          <div className="p-3 bg-[#0a0f1a] rounded-xl border border-slate-800">
            <span className="text-slate-500 block mb-1">Storage Quota</span>
            <span className="font-mono text-slate-200">
              {formatBytes(user?.storage_used_bytes || 0)} used of {formatBytes(user?.storage_quota_bytes || 5368709120)}
            </span>
          </div>
          <div className="p-3 bg-[#0a0f1a] rounded-xl border border-slate-800">
            <span className="text-slate-500 block mb-1">Encryption Protocol</span>
            <span className="text-teal-400 font-semibold">Argon2id + AES-256-GCM v1.0</span>
          </div>
        </div>
      </div>

      {/* 2. Password Change Protocol (Zero File Re-Encryption) */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <KeyRound size={16} className="text-teal-400" />
            <span>Change Master Password</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Re-wraps your Vault MasterKey with a newly derived KEK. Your files do not need to be re-encrypted.
          </p>
        </div>

        {passwordStatus && (
          <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/30 text-xs text-teal-300 flex items-center gap-2">
            <CheckCircle2 size={15} />
            <span>{passwordStatus}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle size={15} />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
          <Input
            label="Current Master Password"
            isPassword
            placeholder="Current password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />
          <Input
            label="New Master Password"
            isPassword
            placeholder="Min. 12 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Input
            label="Confirm New Master Password"
            isPassword
            placeholder="Re-enter new password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
          />
          <Button type="submit" variant="primary" size="sm" isLoading={isChangingPassword}>
            <Lock size={14} />
            <span>Update Master Password</span>
          </Button>
        </form>
      </div>

      {/* 3. Active Sessions Management */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Laptop size={16} className="text-teal-400" />
              <span>Active Sessions & Refresh Tokens</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Authorized devices connected to your account with refresh token family tracking.
            </p>
          </div>
          {sessions.length > 1 && (
            <Button variant="danger" size="sm" onClick={handleLogoutAllOther}>
              Logout All Other Devices
            </Button>
          )}
        </div>

        <div className="divide-y divide-slate-800/80 bg-[#0a0f1a] rounded-xl border border-slate-800 overflow-hidden">
          {sessions.map((sess) => (
            <div key={sess.id} className="p-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-teal-400">
                  {sess.device_name?.toLowerCase().includes('mobile') || sess.device_name?.toLowerCase().includes('android') ? (
                    <Smartphone size={16} />
                  ) : (
                    <Laptop size={16} />
                  )}
                </div>
                <div>
                  <div className="font-medium text-slate-200 flex items-center gap-2">
                    <span>{sess.device_name || 'Web Browser'}</span>
                    {sess.is_current && <Badge variant="teal">Current Session</Badge>}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {sess.ip_address} • Last active {new Date(sess.last_used_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {!sess.is_current && (
                <button
                  onClick={() => handleRevokeSession(sess.id)}
                  title="Revoke Session"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Recovery & Grace Period Invariant Notice */}
      <div className="p-5 rounded-2xl bg-[#0e1726] border border-amber-500/20 space-y-3">
        <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
          <Clock size={15} className="text-amber-400" />
          <span>Account Recovery & 30-Day Grace Period Invariant</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          CloudVault enforces a 30-day grace period on account resets, preserving your previous key bundle in cold storage before permanent purging.
        </p>
        <div className="p-3 rounded-xl bg-[#0a0f1a] border border-slate-800 text-xs text-slate-400 leading-relaxed">
          <strong className="text-slate-200">Notice on In-Flight Recovery Restoration:</strong>{' '}
          In accordance with the M1–M4 architectural specification, active vault restoration within the 30-day grace period is labeled{' '}
          <span className="font-mono text-amber-300 font-semibold">NOT YET AVAILABLE</span> and will be released in an upcoming milestone.
        </div>
      </div>
    </div>
  );
};
