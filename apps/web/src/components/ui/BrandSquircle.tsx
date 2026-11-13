import React from 'react';

export interface BrandSquircleProps {
  size?: number; // size in px
  className?: string;
}

export const BrandSquircle: React.FC<BrandSquircleProps> = ({ size = 48, className = '' }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center rounded-[26%] bg-gradient-to-br from-[#7C3AED] to-[#4C1D95] shadow-lg shadow-purple-950/50 border border-purple-400/30 overflow-hidden shrink-0 select-none ${className}`}
    >
      <img
        src="/brand-logo.png"
        alt="CloudVault"
        className="w-full h-full object-cover"
        onError={(e) => {
          // Fallback if image fails to render
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
};

