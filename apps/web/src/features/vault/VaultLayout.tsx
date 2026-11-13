import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
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
  ShieldCheck,
} from 'lucide-react';
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
  const quotaBytes = user?.storage_quota_bytes || 5368709120; // 5 GB default
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
    <div className="min-h-screen bg-[#0D0B18] text-white flex flex-col md:flex-row selection:bg-[#8F6BFF]/30 selection:text-[#C0B0F0]">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        className="hidden"
      />

      {/* Mobile Top Header Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#161226] border-b border-[#352C55] sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <BrandSquircle size={34} />
          <span className="font-bold text-lg text-white">CloudVault</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl text-[#A3A1BD] hover:text-white bg-[#221C38] border border-[#352C55]"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#161226] border-r border-[#352C55] flex flex-col transition-transform duration-300 md:static md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-[#352C55] flex items-center gap-3.5">
          <BrandSquircle size={44} />
          <div>
            <h1 className="font-bold text-lg text-white tracking-tight">CloudVault</h1>
            <p className="text-[11px] text-[#A3A1BD] uppercase tracking-wider font-semibold">
              Zero-Knowledge
            </p>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="p-4">
          <Button
            variant="primary"
            size="md"
            className="w-full shadow-glow-purple"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={18} />
            <span>Upload Encrypted File</span>
          </Button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
          <Link
            to="/vault"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              location.pathname === '/vault'
                ? 'bg-[#221C38] text-white border border-[#352C55] shadow-sm'
                : 'text-[#A3A1BD] hover:text-white hover:bg-[#221C38]/60'
            }`}
          >
            <FolderLock size={18} className={location.pathname === '/vault' ? 'text-[#8F6BFF]' : ''} />
            <span>My Files</span>
          </Link>

          <Link
            to="/settings"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              location.pathname === '/settings'
                ? 'bg-[#221C38] text-white border border-[#352C55] shadow-sm'
                : 'text-[#A3A1BD] hover:text-white hover:bg-[#221C38]/60'
            }`}
          >
            <Settings size={18} className={location.pathname === '/settings' ? 'text-[#8F6BFF]' : ''} />
            <span>Settings & Sessions</span>
          </Link>
        </nav>

        {/* Storage Widget - Donut Ring matching WhatsApp 8.12.28 & 8.12.29 */}
        <div className="p-4 m-4 rounded-2xl bg-[#0D0B18] border border-[#352C55]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive size={13} className="text-[#8F6BFF]" />
              <span>Storage</span>
            </span>
            <span className="text-xs font-semibold text-[#B090F0]">{usagePct}%</span>
          </div>

          <div className="flex justify-center py-2">
            <StorageDonutRing
              percentage={usagePct}
              usedText={formatBytes(usedBytes)}
              totalText={formatBytes(quotaBytes)}
              size={110}
              strokeWidth={10}
            />
          </div>

          <div className="mt-2 text-center">
            <p className="text-[10px] text-[#8D8DA5]">Free Tier • 5 GB Quota</p>
          </div>
        </div>

        {/* User Account & Logout */}
        <div className="p-4 border-t border-[#352C55] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#B090F0] flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-white truncate">{user?.email || 'Logged in'}</p>
              <p className="text-[10px] text-[#A3A1BD] flex items-center gap-1">
                <ShieldCheck size={11} className="text-emerald-400" />
                <span>Zero-Knowledge</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 rounded-lg text-[#8D8DA5] hover:text-red-400 hover:bg-[#221C38] transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Vault Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header & Search Bar */}
        <header className="p-4 sm:px-8 border-b border-[#352C55] bg-[#161226]/50 backdrop-blur-md sticky top-0 z-30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-2 text-xs text-[#A3A1BD] overflow-x-auto whitespace-nowrap py-1">
            <button
              onClick={() => navigateToFolder(null)}
              className="hover:text-white font-medium transition-colors hover:underline"
            >
              Vault Root
            </button>
            {breadcrumbs.map((b) => (
              <React.Fragment key={b.id || 'root'}>
                <ChevronRight size={14} className="text-[#8D8DA5] shrink-0" />
                <button
                  onClick={() => b.id ? navigateToFolder({ id: b.id, name: b.name } as any) : navigateToFolder(null)}
                  className="text-white hover:text-[#C084FC] font-semibold truncate max-w-[120px] transition-colors"
                >
                  {b.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Action Row: Search & Buttons */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8D8DA5]" />
              <input
                type="text"
                placeholder="Search encrypted files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#161226] border border-[#352C55] rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-[#8D8DA5] focus:outline-none focus:ring-2 focus:ring-[#8F6BFF]/40 focus:border-[#8F6BFF]"
              />
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsNewFolderOpen(true)}
              className="shrink-0"
            >
              <FolderPlus size={16} />
              <span className="hidden sm:inline">New Folder</span>
            </Button>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl bg-[#161226] border border-[#352C55] p-0.5 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-[#221C38] text-white' : 'text-[#8D8DA5] hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-[#221C38] text-white' : 'text-[#8D8DA5] hover:text-white'
                }`}
                title="List View"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Children / View */}
        <div className="flex-1 p-4 sm:p-8 flex flex-col">
          <UploadZone>
            {children}
          </UploadZone>
        </div>

        {/* Global Upload Manager Queue Tray */}
        <UploadManager />

        {/* Modals */}
        <CreateFolderModal
          isOpen={isNewFolderOpen}
          onClose={() => setIsNewFolderOpen(false)}
        />
      </main>
    </div>
  );
};
