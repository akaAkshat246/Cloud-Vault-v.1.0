import React from 'react';
import { IconFolder } from './Icons.js';
import { Button } from './Button.js';

export interface EmptyVaultPedestalProps {
  onUploadClick?: () => void;
  className?: string;
}

export const EmptyVaultPedestal: React.FC<EmptyVaultPedestalProps> = ({
  onUploadClick,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center select-none ${className}`}>
      {/* Structured Solid Icon Container (No blur orbs, No drop shadows) */}
      <div className="w-16 h-16 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 mb-5">
        <IconFolder size={32} />
      </div>

      <h3 className="text-base font-semibold text-slate-100 mb-1 tracking-tight">No files uploaded yet</h3>
      <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
        Your encrypted vault is empty. Files are segmented into 5 MiB chunks and encrypted in client memory before storage.
      </p>

      {onUploadClick && (
        <Button variant="primary" size="md" onClick={onUploadClick}>
          Upload File
        </Button>
      )}
    </div>
  );
};
