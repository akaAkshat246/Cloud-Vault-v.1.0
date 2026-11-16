import React, { useState } from 'react';
import {
  IconFileText,
  IconDownload,
  IconTrash,
  IconLock,
  IconEye,
} from '../../components/ui/Icons.js';
import { DecryptedFile } from '../../types/vault.types.js';
import { useDownload } from '../../hooks/useDownload.js';
import { useVault } from '../../hooks/useVault.js';
import { FilePreviewModal } from './FilePreviewModal.js';

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

export const FileItem: React.FC<FileItemProps> = ({ file, viewMode = 'grid' }) => {
  const { downloadFile } = useDownload();
  const { trashFile } = useVault();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleDownload = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsDownloading(true);
    try {
      await downloadFile(file);
    } catch (e) {
      console.error('Download error:', e);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await trashFile(file.id);
    } catch (e) {
      console.error('Trash error:', e);
    }
  };

  if (viewMode === 'list') {
    return (
      <>
        <div
          onClick={() => setIsPreviewOpen(true)}
          className="flex items-center justify-between p-3 rounded-lg bg-slate-900 hover:bg-slate-800/80 border border-slate-800 transition-colors group select-none cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 rounded bg-slate-800 border border-slate-700 text-sky-400 shrink-0">
              <IconFileText size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-slate-100 truncate group-hover:text-sky-300 transition-colors">
                {file.name}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{formatBytes(file.sizeBytes)}</span>
                <span>•</span>
                <span>{new Date(file.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsPreviewOpen(true)}
              aria-label={`Preview ${file.name}`}
              title="Preview File"
              className="p-1.5 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors"
            >
              <IconEye size={15} />
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              aria-label={`Download ${file.name}`}
              title="Download Decrypted File"
              className="p-1.5 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors"
            >
              <IconDownload size={15} />
            </button>
            <button
              onClick={handleDelete}
              aria-label={`Delete ${file.name}`}
              title="Move to Trash"
              className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
            >
              <IconTrash size={15} />
            </button>
          </div>
        </div>

        {isPreviewOpen && (
          <FilePreviewModal
            file={file}
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
          />
        )}
      </>
    );
  }

  // Grid Mode Card
  return (
    <>
      <div
        onClick={() => setIsPreviewOpen(true)}
        className="p-3.5 rounded-lg bg-slate-900 hover:bg-slate-800/80 border border-slate-800 transition-colors flex flex-col justify-between h-40 select-none cursor-pointer group"
      >
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 group-hover:border-sky-500/40 transition-colors">
            <IconFileText size={20} />
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsPreviewOpen(true)}
              aria-label={`Preview ${file.name}`}
              title="Preview File"
              className="p-1.5 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors"
            >
              <IconEye size={14} />
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              aria-label={`Download ${file.name}`}
              title="Download Decrypted File"
              className="p-1.5 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors"
            >
              <IconDownload size={14} />
            </button>
            <button
              onClick={handleDelete}
              aria-label={`Delete ${file.name}`}
              title="Move to Trash"
              className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
            >
              <IconTrash size={14} />
            </button>
          </div>
        </div>

        <div>
          <div
            className="text-xs font-semibold text-slate-100 truncate mb-1 group-hover:text-sky-300 transition-colors"
            title={file.name}
          >
            {file.name}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{formatBytes(file.sizeBytes)}</span>
            <span className="flex items-center gap-1 text-sky-400">
              <IconLock size={11} />
              <span>Encrypted</span>
            </span>
          </div>
        </div>
      </div>

      {isPreviewOpen && (
        <FilePreviewModal
          file={file}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </>
  );
};
