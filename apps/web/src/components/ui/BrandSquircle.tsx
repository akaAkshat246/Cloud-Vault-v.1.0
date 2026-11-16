import React from 'react';

export interface BrandSquircleProps {
  size?: number; // size in px
  className?: string;
}

export const BrandSquircle: React.FC<BrandSquircleProps> = ({ size = 40, className = '' }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center rounded-lg bg-slate-900 border border-slate-700 overflow-hidden shrink-0 select-none ${className}`}
    >
      <img
        src="/brand-logo.png"
        alt="CloudVault"
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
};
