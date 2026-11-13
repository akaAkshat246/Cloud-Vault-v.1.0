import React from 'react';
import { Folder } from 'lucide-react';
import { FileItem } from './FileItem.js';
import { useVault } from '../../hooks/useVault.js';
import { EmptyVaultPedestal } from '../../components/ui/EmptyVaultPedestal.js';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner.js';

export interface FileListProps {
  onUploadClick?: () => void;
}

export const FileList: React.FC<FileListProps> = ({ onUploadClick }) => {
  const { files, folders, viewMode, isLoading, navigateToFolder } = useVault();

  if (isLoading) {
    return (
      <div className="py-24 flex justify-center">
        <LoadingSpinner size="lg" label="Decrypting folder metadata locally..." />
      </div>
    );
  }

  const isEmpty = folders.length === 0 && files.length === 0;

  if (isEmpty) {
    return (
      <EmptyVaultPedestal onUploadClick={onUploadClick} />
    );
  }

  return (
    <div className="space-y-6">
      {/* Folders Section */}
      {folders.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-[#A3A1BD] uppercase tracking-wider mb-3">Folders</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {folders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => navigateToFolder(folder)}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#161226] hover:bg-[#221C38] border border-[#352C55] hover:border-[#8F6BFF]/60 cursor-pointer transition-all duration-200 group shadow-sm"
              >
                <div className="p-2 rounded-xl bg-gradient-to-br from-[#7C3AED]/40 to-[#4C1D95]/40 border border-[#B090F0]/30 text-[#B090F0] group-hover:scale-105 transition-transform shrink-0">
                  <Folder size={18} />
                </div>
                <span className="text-xs font-semibold text-white truncate flex-1">{folder.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      {files.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-[#A3A1BD] uppercase tracking-wider mb-3">Files</h4>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {files.map((file) => (
                <FileItem key={file.id} file={file} viewMode="grid" />
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
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
