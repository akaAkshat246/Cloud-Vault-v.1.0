import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Laptop,
  Smartphone,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { authApi } from '../../api/auth.api.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Badge } from '../../components/ui/Badge.js';
import { StorageDonutRing } from '../../components/ui/StorageDonutRing.js';
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
      setPasswordStatus('Master password updated successfully. KEK re-wrapped zero-knowledge.');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPasswordError(
        err?.response?.data?.error || err?.message || 'Failed to update password'
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const usedBytes = user?.storage_used_bytes || 0;
  const quotaBytes = user?.storage_quota_bytes || 5368709120;
  const usagePct = Math.min(100, Math.round((Number(usedBytes) / Number(quotaBytes)) * 100));

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Security & Settings</h2>
        <p className="text-xs text-[#A3A1BD] mt-1">
          Manage your zero-knowledge profile, master cryptographic keys, and active device sessions.
        </p>
      </div>

      {/* Account Info & Storage Overview Card */}
      <div className="cosmic-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-[#352C55] gap-4">
          <div>
            <span className="text-xs font-semibold text-[#8F6BFF] uppercase tracking-wider block mb-1">
              Zero-Knowledge Identity
            </span>
            <h3 className="text-lg font-bold text-white">{user?.email}</h3>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={user?.is_email_verified ? 'green' : 'amber'}>
                {user?.is_email_verified ? 'Email Verified' : 'Unverified Email'}
              </Badge>
              <Badge variant="purple">Argon2id Protected</Badge>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <StorageDonutRing
              percentage={usagePct}
              usedText={`${usagePct}%`}
              totalText={formatBytes(quotaBytes)}
              size={100}
              strokeWidth={10}
            />
          </div>
        </div>

        <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#0D0B18] border border-[#352C55]">
            <span className="text-[#8D8DA5] block mb-1">Used Storage</span>
            <span className="font-bold text-white text-sm">{formatBytes(usedBytes)}</span>
          </div>
          <div className="p-4 rounded-xl bg-[#0D0B18] border border-[#352C55]">
            <span className="text-[#8D8DA5] block mb-1">Total Vault Quota</span>
            <span className="font-bold text-white text-sm">{formatBytes(quotaBytes)}</span>
          </div>
        </div>
      </div>

      {/* Change Master Password (Zero Re-Encryption) */}
      <div className="cosmic-card p-6 sm:p-8">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#352C55] mb-6">
          <KeyRound size={20} className="text-[#8F6BFF]" />
          <div>
            <h3 className="text-base font-bold text-white">Change Master Password</h3>
            <p className="text-xs text-[#A3A1BD]">
              Updates your Argon2id AuthKey and re-encrypts your KEK. Files do NOT need re-uploading.
            </p>
          </div>
        </div>

        {passwordError && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-400" />
            <span>{passwordError}</span>
          </div>
        )}

        {passwordStatus && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
            <span>{passwordStatus}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <Input
            label="Current Master Password"
            isPassword
            placeholder="••••••••••••"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />

          <Input
            label="New Master Password"
            isPassword
            placeholder="Minimum 12 characters"
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

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isChangingPassword}
            className="mt-2"
          >
            Update Master Password
          </Button>
        </form>
      </div>

      {/* Active Device Sessions */}
      <div className="cosmic-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#352C55] gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <Laptop size={20} className="text-[#8F6BFF]" />
            <div>
              <h3 className="text-base font-bold text-white">Active Device Sessions</h3>
              <p className="text-xs text-[#A3A1BD]">
                All devices currently authenticated with your zero-knowledge vault.
              </p>
            </div>
          </div>

          {sessions.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogoutAllOther}
              className="text-red-400 border-red-500/30 hover:border-red-400"
            >
              <LogOut size={14} />
              <span>Revoke All Other Sessions</span>
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className="flex items-center justify-between p-4 rounded-xl bg-[#0D0B18] border border-[#352C55]"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-lg bg-[#161226] border border-[#352C55] text-[#B090F0]">
                  {sess.device_name?.toLowerCase().includes('phone') || sess.device_name?.toLowerCase().includes('android') ? (
                    <Smartphone size={18} />
                  ) : (
                    <Laptop size={18} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {sess.device_name || 'Web Browser'}
                    </span>
                    {sess.is_current && (
                      <Badge variant="purple">Current Device</Badge>
                    )}
                  </div>
                  <div className="text-xs text-[#8D8DA5] flex items-center gap-2 mt-0.5">
                    <span>IP: {sess.ip_address}</span>
                    <span>•</span>
                    <span>Active: {new Date(sess.last_used_at || sess.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {!sess.is_current && (
                <button
                  onClick={() => handleRevokeSession(sess.id)}
                  title="Revoke session"
                  className="p-2 rounded-lg text-[#8D8DA5] hover:text-red-400 hover:bg-[#161226] transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
