import React, { useState, useRef } from 'react';
import { IconUploadCloud } from '../../components/ui/Icons.js';
import { useUpload } from '../../hooks/useUpload.js';
import { useVault } from '../../hooks/useVault.js';

export interface UploadZoneProps {
  children?: React.ReactNode;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ children }) => {
  const { uploadFile } = useUpload();
  const { currentFolderId, refreshVault } = useVault();
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      for (const file of filesArray) {
        try {
          await uploadFile(file, currentFolderId);
        } catch (err) {
          console.error('File upload failed:', err);
        }
      }
      await refreshVault();
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="relative min-h-[400px] flex-1 flex flex-col"
    >
      {/* Visual Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 rounded-lg bg-slate-950/90 border-2 border-dashed border-sky-400 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-lg bg-slate-900 border border-sky-500/40 flex items-center justify-center text-sky-400 mb-3">
            <IconUploadCloud size={28} />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">Drop files to encrypt and upload</h3>
          <p className="text-xs text-slate-400">Files are chunked and encrypted with unique FEKs before transmission</p>
        </div>
      )}

      {children}
    </div>
  );
};

