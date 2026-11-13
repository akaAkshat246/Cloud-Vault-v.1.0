import React, { useEffect, useRef } from 'react';
import { Plus, Upload, ShieldCheck } from 'lucide-react';
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

  const usedBytes = user?.storage_used_bytes || 0;
  const quotaBytes = user?.storage_quota_bytes || 5368709120; // 5 GB
  const usagePct = Math.min(100, Math.round((Number(usedBytes) / Number(quotaBytes)) * 100));

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
    <div className="flex-1 flex flex-col space-y-8 relative">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        className="hidden"
      />

      {/* Welcome Banner from WhatsApp 8.12.28 (1) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Welcome back, {displayName}! 👋
          </h2>
          <p className="text-xs text-[#A3A1BD] mt-1">
            Here's what's happening with your encrypted zero-knowledge vault today.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => fileInputRef.current?.click()}
          className="shadow-glow-purple shrink-0"
        >
          <Upload size={16} />
          <span>Upload File</span>
        </Button>
      </div>

      {/* Top Metrics Cards Row matching WhatsApp 8.12.28 (1) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Storage Card with Donut Ring */}
        <div className="cosmic-card p-6 flex items-center justify-between gap-4 md:col-span-2">
          <div className="flex flex-col justify-between h-full">
            <div>
              <span className="text-xs font-semibold text-[#8F6BFF] uppercase tracking-wider block mb-1">
                Storage Allocation
              </span>
              <h3 className="text-xl font-bold text-white">
                {formatBytes(usedBytes)} <span className="text-sm font-normal text-[#A3A1BD]">used</span>
              </h3>
              <p className="text-xs text-[#A3A1BD] mt-1">
                Out of {formatBytes(quotaBytes)} total quota. Zero plaintext leaks to cloud storage.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#221C38] border border-[#352C55] text-xs font-semibold text-emerald-400">
                <ShieldCheck size={13} />
                <span>Encrypted direct-to-S3</span>
              </span>
            </div>
          </div>

          <div className="shrink-0 pr-2">
            <StorageDonutRing
              percentage={usagePct}
              usedText={`${usagePct}%`}
              totalText="100%"
              size={120}
              strokeWidth={12}
            />
          </div>
        </div>

        {/* Quick File Count Card */}
        <div className="cosmic-card p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-[#8F6BFF] uppercase tracking-wider block mb-1">
              Encrypted Items
            </span>
            <h3 className="text-3xl font-extrabold text-white mt-1">
              {files.length}
            </h3>
            <p className="text-xs text-[#A3A1BD] mt-2">
              Protected by unique File Encryption Keys (FEK).
            </p>
          </div>

          <div className="pt-4 border-t border-[#352C55] flex items-center justify-between text-xs text-[#A3A1BD]">
            <span>Algorithm:</span>
            <span className="font-mono text-white text-[11px]">XChaCha20-Poly1305</span>
          </div>
        </div>
      </div>

      {/* Main Files Browser Section */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white tracking-tight">Vault Explorer</h3>
        </div>
        <FileList onUploadClick={() => fileInputRef.current?.click()} />
      </div>

      {/* Floating Upload FAB from WhatsApp 8.12.28 */}
      <div className="fixed bottom-8 right-8 z-40">
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Upload Encrypted File"
          className="w-14 h-14 rounded-full bg-gradient-to-b from-[#B090F0] to-[#8F6BFF] text-white flex items-center justify-center shadow-glow-fab hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20"
        >
          <Plus size={28} />
        </button>
      </div>
    </div>
  );
};
