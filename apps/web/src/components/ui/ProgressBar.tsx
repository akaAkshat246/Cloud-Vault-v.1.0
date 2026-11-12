import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ProgressBarProps {
  progress: number; // 0 to 100
  className?: string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className,
  size = 'md',
  showLabel = false,
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div className={twMerge('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
          <span>Progress</span>
          <span className="font-mono text-teal-400 font-medium">{clamped}%</span>
        </div>
      )}
      <div
        className={clsx(
          'w-full bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50',
          size === 'sm' ? 'h-1.5' : 'h-2.5'
        )}
      >
        <div
          className="h-full bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-400 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};

