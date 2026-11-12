import React, { useState } from 'react';
import {
  FileText,
  FileCode,
  FileArchive,
  Image as ImageIcon,
  Video,
  Music,
  Download,
  Trash2,
  MoreVertical,
  File,
  Lock,
} from 'lucide-react';
import { DecryptedFile } from '../../types/vault.types.js';
import { useDownload } from '../../hooks/useDownload.js';
import { useVault } from '../../hooks/useVault.js';

export interface FileItemProps {
  file: DecryptedFile;
  viewMode?: 'grid' | 'list';
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
    case 'doc':
    case 'docx':
    case 'txt':
    case 'md':
      return <FileText size={20} className="text-cyan-400" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
    case 'svg':
      return <ImageIcon size={20} className="text-teal-400" />;
    case 'mp4':
    case 'mov':
    case 'mkv':
    case 'avi':
      return <Video size={20} className="text-purple-400" />;
    case 'mp3':
    case 'wav':
    case 'flac':
      return <Music size={20} className="text-amber-400" />;
    case 'zip':
    case 'tar':
    case 'gz':
    case '7z':
      return <FileArchive size={20} className="text-emerald-400" />;
    case 'js':
    case 'ts':
    case 'tsx':
    case 'py':
    case 'json':
    case 'html':
    case 'css':
      return <FileCode size={20} className="text-blue-400" />;
    default:
      return <File size={20} className="text-slate-400" />;
  }
}

export const FileItem: React.FC<FileItemProps> = ({ file, viewMode = 'grid' }) => {
  const { downloadFile } = useDownload();
  const { trashFile } = useVault();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadFile(file);
    } catch (e) {
      console.error('Download error:', e);
    } finally {
      setIsDownloading(false);
      setIsMenuOpen(false);
    }
  };

  const handleDelete = async () => {
    try {
      await trashFile(file.id);
    } catch (e) {
      console.error('Trash error:', e);
    } finally {
      setIsMenuOpen(false);
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800/80 transition-colors group">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50 shrink-0">
            {getFileIcon(file.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-slate-200 truncate">{file.name}</div>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>{formatBytes(file.sizeBytes)}</span>
              <span>•</span>
              <span>{new Date(file.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            title="Download Decrypted File"
            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-slate-800 transition-colors"
          >
            <Download size={16} />
          </button>
          <button
            onClick={handleDelete}
            title="Move to Trash"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  }

  // Grid Mode Card
  return (
    <div className="relative group p-4 rounded-xl bg-slate-900/50 hover:bg-slate-800/70 border border-slate-800/80 hover:border-teal-500/30 transition-all flex flex-col justify-between h-44">
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center">
          {getFileIcon(file.name)}
        </div>
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <MoreVertical size={16} />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 top-7 w-36 bg-[#0e1726] border border-slate-700 rounded-lg shadow-xl py-1 z-20 text-xs">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full text-left px-3 py-2 flex items-center gap-2 text-slate-200 hover:bg-slate-800 hover:text-teal-300"
              >
                <Download size={14} />
                <span>Download</span>
              </button>
              <button
                onClick={handleDelete}
                className="w-full text-left px-3 py-2 flex items-center gap-2 text-red-400 hover:bg-slate-800 hover:text-red-300"
              >
                <Trash2 size={14} />
                <span>Move to Trash</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="text-sm font-medium text-slate-200 truncate mb-1" title={file.name}>
          {file.name}
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>{formatBytes(file.sizeBytes)}</span>
          <span className="flex items-center gap-1 text-teal-500/80">
            <Lock size={10} />
            <span>E2EE</span>
          </span>
        </div>
      </div>
    </div>
  );
};

