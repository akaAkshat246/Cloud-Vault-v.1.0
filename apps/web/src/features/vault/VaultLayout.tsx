import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  IconFolderLock,
  IconSettings,
  IconLogOut,
  IconMenu,
  IconX,
  IconUpload,
  IconFolderPlus,
  IconGrid,
  IconList,
  IconSearch,
  IconHardDrive,
} from '../../components/ui/Icons.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useVault } from '../../hooks/useVault.js';
import { useUpload } from '../../hooks/useUpload.js';
import { Button } from '../../components/ui/Button.js';
import { BrandSquircle } from '../../components/ui/BrandSquircle.js';
import { StorageDonutRing } from '../../components/ui/StorageDonutRing.js';
import { CreateFolderModal } from '../folders/CreateFolderModal.js';
import { UploadZone } from '../upload/UploadZone.js';
import { UploadManager } from '../upload/UploadManager.js';

function formatBytes(bytes: number | string): string {
  const b = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (!b || b === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export interface VaultLayoutProps {
  children?: React.ReactNode;
}

export const VaultLayout: React.FC<VaultLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const {
    breadcrumbs,
    currentFolderId,
    searchTerm,
    viewMode,
    setSearchTerm,
    setViewMode,
    refreshVault,
    navigateToFolder,
  } = useVault();
  const { uploadFile } = useUpload();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const usedBytes = user?.storage_used_bytes || 0;
  const quotaBytes = user?.storage_quota_bytes || 5368709120; // 5 GB
  const usagePct = Math.min(100, Math.round((Number(usedBytes) / Number(quotaBytes)) * 100));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      for (const file of files) {
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        className="hidden"
      />

      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-3.5 bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <BrandSquircle size={32} />
          <span className="font-bold text-sm text-slate-100">CloudVault</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          className="p-1.5 rounded text-slate-400 hover:text-white bg-slate-800 border border-slate-700"
        >
          {isMobileMenuOpen ? <IconX size={18} /> : <IconMenu size={18} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 md:static md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <BrandSquircle size={36} />
          <div>
            <h1 className="font-bold text-sm text-slate-100 tracking-tight">CloudVault</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-mono">
              Zero-Knowledge
            </p>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="p-3.5">
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <IconUpload size={16} />
            <span>Upload File</span>
          </Button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto text-xs">
          <Link
            to="/vault"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md font-medium transition-colors ${
              location.pathname === '/vault'
                ? 'bg-slate-800 text-sky-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <IconFolderLock size={16} />
            <span>Encrypted Vault</span>
          </Link>

          <Link
            to="/settings"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md font-medium transition-colors ${
              location.pathname === '/settings'
                ? 'bg-slate-800 text-sky-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <IconSettings size={16} />
            <span>Settings & Sessions</span>
          </Link>
        </nav>

        {/* Storage Allocation Widget */}
        <div className="p-3.5 m-3 rounded-lg bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <IconHardDrive size={13} className="text-sky-400" />
              <span>Quota</span>
            </span>
            <span className="text-xs font-mono font-semibold text-sky-400">{usagePct}%</span>
          </div>

          <div className="flex justify-center py-1">
            <StorageDonutRing
              percentage={usagePct}
              usedText={formatBytes(usedBytes)}
              totalText={formatBytes(quotaBytes)}
              size={96}
              strokeWidth={8}
            />
          </div>

          <div className="mt-1.5 text-center">
            <p className="text-[10px] text-slate-400">Total: {formatBytes(quotaBytes)} Quota</p>
          </div>
        </div>

        {/* User Account & Logout */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-sky-400 shrink-0">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="truncate">
              <div className="font-semibold text-slate-200 truncate text-xs" title={user?.email}>
                {user?.email?.split('@')[0]}
              </div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Vault Unlocked</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Lock Vault & Sign Out"
            aria-label="Sign out"
            className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
          >
            <IconLogOut size={15} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Action Header */}
        <header className="p-3 sm:px-6 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Breadcrumbs Navigation */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 overflow-x-auto py-1">
            <button
              onClick={() => navigateToFolder(null)}
              className={`hover:text-slate-100 font-medium transition-colors ${
                currentFolderId === null ? 'text-white font-semibold' : ''
              }`}
            >
              Root Vault
            </button>
            {breadcrumbs.map((crumb) => (
              <React.Fragment key={crumb.id || 'root'}>
                <span className="text-slate-600">/</span>
                <button
                  onClick={() =>
                    crumb.id
                      ? navigateToFolder({
                          id: crumb.id,
                          name: crumb.name,
                          parentId: null,
                          isTrashed: false,
                          createdAt: '',
                          updatedAt: '',
                        })
                      : navigateToFolder(null)
                  }
                  className="hover:text-slate-100 truncate max-w-[120px] transition-colors"
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Search & Actions Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
                <IconSearch size={14} />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search encrypted files..."
                className="w-full bg-slate-950 border border-slate-700 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNewFolderOpen(true)}
              title="Create Encrypted Folder"
            >
              <IconFolderPlus size={14} />
              <span className="hidden sm:inline">New Folder</span>
            </Button>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-md bg-slate-950 border border-slate-800 p-0.5 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-slate-800 text-sky-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <IconGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                aria-label="List view"
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-slate-800 text-sky-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <IconList size={14} />
              </button>
            </div>
          </div>
        </header>

        {/* Drag & Drop Upload Zone Body */}
        <UploadZone>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </UploadZone>

        {/* Global Upload Manager Queue Tray */}
        <UploadManager />

        {/* Modals */}
        <CreateFolderModal
          isOpen={isNewFolderOpen}
          onClose={() => setIsNewFolderOpen(false)}
        />
      </div>
    </div>
  );
};
