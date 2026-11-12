import React from 'react';
import { Folder } from 'lucide-react';
import { FileItem } from './FileItem.js';
import { useVault } from '../../hooks/useVault.js';
import { EmptyState } from '../../components/feedback/EmptyState.js';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner.js';

export interface FileListProps {
  onUploadClick?: () => void;
}

export const FileList: React.FC<FileListProps> = ({ onUploadClick }) => {
  const { files, folders, viewMode, isLoading, navigateToFolder } = useVault();

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" label="Decrypting folder contents locally..." />
      </div>
    );
  }

  const isEmpty = folders.length === 0 && files.length === 0;

  if (isEmpty) {
    return (
      <EmptyState
        title="This folder is empty"
        description="Upload files or create subfolders. All data is encrypted in your browser before upload."
        actionLabel="Upload Files"
        onAction={onUploadClick}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Folders Section */}
      {folders.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Folders</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {folders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => navigateToFolder(folder)}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-teal-500/40 cursor-pointer transition-all group"
              >
                <div className="p-2 rounded-lg bg-teal-950/40 border border-teal-500/20 text-teal-400 group-hover:scale-105 transition-transform">
                  <Folder size={18} />
                </div>
                <span className="text-xs font-medium text-slate-200 truncate flex-1">{folder.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      {files.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Files</h3>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {files.map((file) => (
                <FileItem key={file.id} file={file} viewMode="grid" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <FileItem key={file.id} file={file} viewMode="list" />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
