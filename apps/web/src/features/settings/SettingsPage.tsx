import React, { useState, useEffect } from 'react';
import {
  IconKey,
  IconLaptop,
  IconSmartphone,
  IconTrash,
  IconAlertTriangle,
  IconCheckCircle,
  IconLogOut,
} from '../../components/ui/Icons.js';
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
  const { user, changePassword, deleteAccount } = useAuth();
  const [sessions, setSessions] = useState<SessionItem[]>([]);

  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // GDPR Account Deletion State
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

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

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);

    if (confirmDeleteText !== 'DELETE MY ENCRYPTED VAULT') {
      setDeleteError('You must enter exact text "DELETE MY ENCRYPTED VAULT" to confirm erasure.');
      return;
    }

    setIsDeletingAccount(true);
    try {
      await deleteAccount(confirmDeleteText);
      // user will automatically be logged out and redirected by router
    } catch (err: any) {
      setDeleteError(
        err?.response?.data?.error || err?.message || 'Account deletion failed. Please try again.'
      );
      setIsDeletingAccount(false);
    }
  };

  const usedBytes = Number(user?.storage_used_bytes) || 0;
  const quotaBytes = Number(user?.storage_quota_bytes) || 5368709120;
  const rawPct = quotaBytes > 0 ? (usedBytes / quotaBytes) * 100 : 0;
  const usagePct = Math.min(100, rawPct);
  const formattedPct = usagePct === 0
    ? '0%'
    : usagePct < 0.1
      ? '<0.1%'
      : usagePct < 10
        ? `${usagePct.toFixed(1)}%`
        : `${Math.round(usagePct)}%`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Security & Settings</h2>
        <p className="text-xs text-slate-400 mt-1">
          Manage your zero-knowledge profile, master cryptographic keys, and active device sessions.
        </p>
      </div>

      {/* Account Info & Storage Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block mb-1">
              Zero-Knowledge Identity
            </span>
            <h3 className="text-lg font-bold text-slate-100">{user?.email}</h3>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={user?.is_email_verified ? 'emerald' : 'amber'}>
                {user?.is_email_verified ? 'Email Verified' : 'Unverified Email'}
              </Badge>
              <Badge variant="blue">Argon2id Protected</Badge>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <StorageDonutRing
              percentage={usagePct}
              usedText={usedBytes > 0 ? formatBytes(usedBytes) : '0%'}
              totalText={formatBytes(quotaBytes)}
              subText="allocated"
              size={100}
              strokeWidth={10}
            />
          </div>
        </div>

        <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-md bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 block mb-1">Used Storage ({formattedPct})</span>
            <span className="font-bold text-slate-100 text-sm">{formatBytes(usedBytes)}</span>
          </div>
          <div className="p-4 rounded-md bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 block mb-1">Total Vault Quota</span>
            <span className="font-bold text-slate-100 text-sm">{formatBytes(quotaBytes)}</span>
          </div>
        </div>
      </div>

      {/* Change Master Password (Zero Re-Encryption) */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 sm:p-8">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800 mb-6">
          <IconKey size={20} className="text-sky-400" />
          <div>
            <h3 className="text-base font-bold text-slate-100">Change Master Password</h3>
            <p className="text-xs text-slate-400">
              Updates your Argon2id AuthKey and re-encrypts your KEK. Files do not require re-uploading.
            </p>
          </div>
        </div>

        {passwordError && (
          <div className="mb-4 p-3.5 rounded-md bg-red-950/40 border border-red-800/60 flex items-start gap-2.5 text-xs text-red-300">
            <IconAlertTriangle size={16} className="shrink-0 mt-0.5 text-red-400" />
            <span>{passwordError}</span>
          </div>
        )}

        {passwordStatus && (
          <div className="mb-4 p-3.5 rounded-md bg-emerald-950/40 border border-emerald-800/60 flex items-start gap-2.5 text-xs text-emerald-300">
            <IconCheckCircle size={16} className="shrink-0 mt-0.5 text-emerald-400" />
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
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <IconLaptop size={20} className="text-sky-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">Active Device Sessions</h3>
              <p className="text-xs text-slate-400">
                All devices currently authenticated with your zero-knowledge vault.
              </p>
            </div>
          </div>

          {sessions.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogoutAllOther}
              className="text-red-400 border-red-800/60 hover:border-red-600 hover:text-red-300"
            >
              <IconLogOut size={14} />
              <span>Revoke All Other Sessions</span>
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className="flex items-center justify-between p-4 rounded-md bg-slate-950/60 border border-slate-800"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-md bg-slate-900 border border-slate-800 text-sky-400">
                  {sess.device_name?.toLowerCase().includes('phone') || sess.device_name?.toLowerCase().includes('android') ? (
                    <IconSmartphone size={18} />
                  ) : (
                    <IconLaptop size={18} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-100">
                      {sess.device_name || 'Web Browser'}
                    </span>
                    {sess.is_current && (
                      <Badge variant="blue">Current Device</Badge>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
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
                  className="p-2 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-colors"
                >
                  <IconTrash size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* GDPR Article 17: User Data Erasure / Permanent Deletion */}
      <div className="bg-slate-900 border border-red-900/40 rounded-lg p-6 sm:p-8">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800 mb-6">
          <IconAlertTriangle size={20} className="text-red-400" />
          <div>
            <h3 className="text-base font-bold text-red-200">GDPR Article 17: User Data Deletion</h3>
            <p className="text-xs text-slate-400">
              Exercise your legal Right to Erasure. Permanently delete all vault data, cryptographic envelopes, and active sessions.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-md bg-red-950/30 border border-red-900/60 mb-6 text-xs text-red-300 space-y-2">
          <p className="font-semibold text-red-200">
            Warning: This action is permanent and completely irreversible.
          </p>
          <p>
            Upon execution, CloudVault will permanently shred all encrypted file chunks in cloud object storage, delete all metadata and folder hierarchies, terminate all device sessions, and delete your user record. Because this is zero-knowledge, data cannot be recovered by anyone.
          </p>
        </div>

        {deleteError && (
          <div className="mb-4 p-3.5 rounded-md bg-red-950/50 border border-red-800 flex items-start gap-2.5 text-xs text-red-300">
            <IconAlertTriangle size={16} className="shrink-0 mt-0.5 text-red-400" />
            <span>{deleteError}</span>
          </div>
        )}

        <form onSubmit={handleDeleteAccount} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Type <span className="font-mono text-red-400 font-bold">DELETE MY ENCRYPTED VAULT</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmDeleteText}
              onChange={(e) => setConfirmDeleteText(e.target.value)}
              placeholder="DELETE MY ENCRYPTED VAULT"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500 font-mono"
              required
            />
          </div>

          <Button
            type="submit"
            variant="danger"
            size="md"
            isLoading={isDeletingAccount}
            disabled={confirmDeleteText !== 'DELETE MY ENCRYPTED VAULT'}
          >
            Permanently Erase Vault & Account
          </Button>
        </form>
      </div>
    </div>
  );
};
