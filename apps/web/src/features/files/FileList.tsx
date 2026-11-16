import React from 'react';
import { IconFolder } from '../../components/ui/Icons.js';
import { FileItem } from './FileItem.js';
import { useVault } from '../../hooks/useVault.js';
import { EmptyVaultPedestal } from '../../components/ui/EmptyVaultPedestal.js';
import { FileListSkeleton } from '../../components/ui/Skeleton.js';

export interface FileListProps {
  onUploadClick?: () => void;
}

export const FileList: React.FC<FileListProps> = ({ onUploadClick }) => {
  const { files, folders, viewMode, isLoading, navigateToFolder } = useVault();

  if (isLoading) {
    return <FileListSkeleton />;
  }

  const isEmpty = folders.length === 0 && files.length === 0;

  if (isEmpty) {
    return <EmptyVaultPedestal onUploadClick={onUploadClick} />;
  }

  return (
    <div className="space-y-6">
      {/* Folders Section */}
      {folders.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Folders</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {folders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => navigateToFolder(folder)}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors group select-none"
              >
                <div className="p-1.5 rounded bg-slate-800 border border-slate-700 text-sky-400 shrink-0">
                  <IconFolder size={16} />
                </div>
                <span className="text-xs font-medium text-slate-100 truncate flex-1">{folder.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      {files.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Files</h4>
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
