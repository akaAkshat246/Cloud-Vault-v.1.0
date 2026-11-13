import React from 'react';
import { Folder } from 'lucide-react';
import { Button } from '../ui/Button.js';

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
      {/* 3D Pedestal and Floating Folder with glow */}
      <div className="relative w-44 h-44 flex items-center justify-center mb-6">
        {/* Soft cosmic diffuse shadow */}
        <div className="absolute bottom-2 w-36 h-10 bg-[#B090F0]/25 rounded-[100%] blur-md" />

        {/* 3D Oval Pedestal disc */}
        <div className="absolute bottom-4 w-32 h-9 bg-gradient-to-r from-[#9070E0]/60 via-[#B090F0]/50 to-[#9070E0]/60 rounded-[100%] border border-[#B090F0]/40 shadow-inner" />

        {/* Elevated 3D Folder Icon */}
        <div className="relative z-10 transform -translate-y-3 transition-transform hover:-translate-y-5 duration-300">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#B090F0] to-[#8F6BFF] flex items-center justify-center shadow-lg shadow-purple-900/60 border border-white/20">
            <Folder size={44} className="text-white fill-white/20" />
          </div>
        </div>
      </div>

      <h3 className="text-xl font-bold text-white mb-2 tracking-tight">No files uploaded yet</h3>
      <p className="text-sm text-[#A3A1BD] max-w-sm mb-6 leading-relaxed">
        Your secure zero-knowledge cloud space is ready. All files are encrypted client-side before leaving your browser.
      </p>

      {onUploadClick && (
        <Button variant="primary" size="md" onClick={onUploadClick}>
          Upload Your First File
        </Button>
      )}
    </div>
  );
};

