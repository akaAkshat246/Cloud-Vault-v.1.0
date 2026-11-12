import React, { useState, useRef } from 'react';
import { UploadCloud } from 'lucide-react';
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
        <div className="absolute inset-0 z-50 rounded-2xl bg-teal-950/80 backdrop-blur-md border-2 border-dashed border-teal-400 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 mb-3 shadow-lg">
            <UploadCloud size={32} />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Drop files to encrypt and upload</h3>
          <p className="text-xs text-teal-300">Files will be encrypted with AES-256-GCM before leaving your device</p>
        </div>
      )}

      {children}
    </div>
  );
};

