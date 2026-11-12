import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  FolderLock,
  Settings,
  LogOut,
  Menu,
  X,
  Upload,
  FolderPlus,
  LayoutGrid,
  List,
  Search,
  HardDrive,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { useVault } from '../../hooks/useVault.js';
import { useUpload } from '../../hooks/useUpload.js';
import { Button } from '../../components/ui/Button.js';
import { ProgressBar } from '../../components/ui/ProgressBar.js';
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
    <div className="min-h-screen bg-[#0a0f1a] text-slate-100 flex flex-col md:flex-row">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        className="hidden"
      />

      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0e1726] border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <span className="font-bold text-base text-white">CloudVault</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-[#0a0f1a] border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5">
          {/* Logo */}
          <div className="hidden md:flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-800 flex items-center justify-center shadow-lg shadow-teal-900/30 border border-teal-400/30">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight">CloudVault</span>
              <div className="text-[10px] text-teal-400 font-mono">Zero-Knowledge</div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1">
            <Link
              to="/vault"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                location.pathname === '/vault'
                  ? 'bg-teal-600/15 text-teal-300 border border-teal-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FolderLock size={18} />
              <span>My Vault</span>
            </Link>

            <Link
              to="/settings"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                location.pathname === '/settings'
                  ? 'bg-teal-600/15 text-teal-300 border border-teal-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Settings size={18} />
              <span>Settings & Sessions</span>
            </Link>
          </nav>
        </div>

        {/* Storage Quota & User Profile Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="flex items-center gap-1.5">
                <HardDrive size={13} className="text-teal-400" />
                <span>Storage</span>
              </span>
              <span className="font-mono text-[11px] text-slate-300">
                {formatBytes(usedBytes)} / {formatBytes(quotaBytes)}
              </span>
            </div>
            <ProgressBar progress={usagePct} size="sm" />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
            <div className="min-w-0 flex-1 mr-2">
              <div className="text-xs font-medium text-slate-200 truncate" title={user?.email}>
                {user?.email}
              </div>
              <div className="text-[10px] text-teal-400">Encrypted Session</div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header / Breadcrumb & Action Bar */}
        <header className="p-4 border-b border-slate-800/80 bg-[#0a0f1a] sticky top-0 z-20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 overflow-x-auto whitespace-nowrap scrollbar-none py-1">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.id || 'root'}>
                {idx > 0 && <ChevronRight size={13} className="text-slate-600 shrink-0" />}
                <span
                  className={idx === breadcrumbs.length - 1 ? 'font-semibold text-slate-100' : 'text-slate-400'}
                >
                  {crumb.name}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* Actions & Search */}
          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0d1424] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-slate-800 text-teal-400' : 'text-slate-400 hover:text-slate-200'}`}
                title="Grid View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-slate-800 text-teal-400' : 'text-slate-400 hover:text-slate-200'}`}
                title="List View"
              >
                <List size={15} />
              </button>
            </div>

            {/* New Folder Button */}
            <Button variant="secondary" size="sm" onClick={() => setIsNewFolderOpen(true)}>
              <FolderPlus size={14} />
              <span className="hidden sm:inline">New Folder</span>
            </Button>

            {/* Upload File Button */}
            <Button variant="primary" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload size={14} />
              <span className="hidden sm:inline">Upload</span>
            </Button>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="p-4 sm:p-6 flex-1 flex flex-col">
          <UploadZone>{children}</UploadZone>
        </main>
      </div>

      {/* Modals & Floating Managers */}
      <CreateFolderModal
        isOpen={isNewFolderOpen}
        onClose={() => setIsNewFolderOpen(false)}
      />
      <UploadManager />
    </div>
  );
};
