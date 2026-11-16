import React, { useEffect, useRef } from 'react';
import {
  IconUpload,
  IconShieldCheck,
  IconLock,
} from '../../components/ui/Icons.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useVault } from '../../hooks/useVault.js';
import { useUpload } from '../../hooks/useUpload.js';
import { FileList } from '../files/FileList.js';
import { StorageDonutRing } from '../../components/ui/StorageDonutRing.js';
import { Button } from '../../components/ui/Button.js';

function formatBytes(bytes: number | string): string {
  const b = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (!b || b === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export const VaultDashboard: React.FC = () => {
  const { user } = useAuth();
  const { files, refreshVault, currentFolderId } = useVault();
  const { uploadFile } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refreshVault();
  }, [refreshVault]);

  const userStoredBytes = Number(user?.storage_used_bytes) || 0;
  const filesTotalBytes = files.reduce((acc, f) => acc + (Number(f.sizeBytes) || 0), 0);
  const usedBytes = Math.max(userStoredBytes, filesTotalBytes);
  const quotaBytes = Number(user?.storage_quota_bytes) || 5368709120; // 5 GB

  // Real percentage with precision
  const rawPct = quotaBytes > 0 ? (usedBytes / quotaBytes) * 100 : 0;
  const usagePct = Math.min(100, rawPct);
  const formattedPct = usagePct === 0
    ? '0%'
    : usagePct < 0.1
      ? '<0.1%'
      : usagePct < 10
        ? `${usagePct.toFixed(1)}%`
        : `${Math.round(usagePct)}%`;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      for (const file of selected) {
        try {
          await uploadFile(file, currentFolderId);
        } catch (err) {
          console.error('Upload failed:', err);
        }
      }
      await refreshVault();
      e.target.value = '';
    }
  };

  const displayName = user?.email?.split('@')[0] || 'User';

  return (
    <div className="flex-1 flex flex-col space-y-6 relative text-slate-100 font-sans">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        className="hidden"
      />

      {/* Welcome Banner (NO emojis) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">
            Vault Overview: {displayName}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Zero-knowledge client-side encryption active. Direct-to-S3 chunk streaming enabled.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0"
        >
          <IconUpload size={15} />
          <span>Upload File</span>
        </Button>
      </div>

      {/* Top Metrics Cards Row (2 Structured Cards, NOT 3 in a row) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Storage Allocation Card with Dynamic Bar */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex-1 space-y-3 w-full">
            <div>
              <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block mb-1">
                Storage Allocation
              </span>
              <h3 className="text-lg font-bold text-slate-100 flex items-baseline gap-2">
                <span>{formatBytes(usedBytes)}</span>
                <span className="text-xs font-normal text-slate-400">used ({formattedPct})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Out of {formatBytes(quotaBytes)} quota. Raw ciphertext stored on private S3.
              </p>
            </div>

            {/* Storage Progress Bar */}
            <div className="w-full max-w-sm space-y-1.5 pt-0.5">
              <div className="w-full bg-slate-950 border border-slate-800 rounded-full h-2.5 overflow-hidden p-0.5">
                <div
                  className="bg-sky-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(usedBytes > 0 ? 3 : 0, usagePct)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>{formatBytes(usedBytes)} used</span>
                <span className="text-sky-400 font-semibold">{formattedPct}</span>
                <span>{formatBytes(quotaBytes)} quota</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-xs font-medium text-emerald-400">
                <IconShieldCheck size={13} />
                <span>Zero Plaintext Stored</span>
              </span>
            </div>
          </div>

          <div className="shrink-0 self-center sm:self-auto pr-2">
            <StorageDonutRing
              percentage={usagePct}
              usedText={usedBytes > 0 ? formatBytes(usedBytes) : '0%'}
              totalText={formatBytes(quotaBytes)}
              subText="allocated"
              size={104}
              strokeWidth={9}
            />
          </div>
        </div>

        {/* Encrypted Items Summary Card */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg flex flex-col justify-between space-y-3">
          <div>
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block mb-1">
              Encrypted Vault Items
            </span>
            <h3 className="text-2xl font-bold text-slate-100 mt-1">
              {files.length}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Each file is protected with a unique 256-bit File Encryption Key (FEK).
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Algorithm:</span>
            <span className="font-mono text-slate-200 text-xs flex items-center gap-1">
              <IconLock size={12} className="text-sky-400" />
              <span>AES-256-GCM / XChaCha20</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Files Browser Section */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-200 tracking-tight">Vault Explorer</h3>
        </div>
        <FileList onUploadClick={() => fileInputRef.current?.click()} />
      </div>
    </div>
  );
};
