import React from 'react';
import { clsx } from 'clsx';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className, label }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2.5',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <div className={clsx('flex flex-col items-center justify-center p-4 gap-3', className)}>
      <div
        className={clsx(
          'rounded-full border-teal-500/20 border-t-teal-400 animate-spin',
          sizes[size]
        )}
      />
      {label && <p className="text-xs text-slate-400 animate-pulse">{label}</p>}
    </div>
  );
};

