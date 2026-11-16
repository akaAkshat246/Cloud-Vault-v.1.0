import React from 'react';

export interface StorageDonutRingProps {
  percentage: number;
  usedText: string;
  totalText: string;
  size?: number; // px size
  strokeWidth?: number;
  className?: string;
}

export const StorageDonutRing: React.FC<StorageDonutRingProps> = ({
  percentage,
  usedText,
  totalText,
  size = 120,
  strokeWidth = 10,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clampedPct / 100) * circumference;

  return (
    <div
      style={{ width: size, height: size }}
      title={`Storage: ${usedText} used of ${totalText}`}
      className={`relative flex items-center justify-center shrink-0 ${className}`}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1E293B"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Active Value Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#0284C7"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>

      {/* Centered Percentage Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-sm font-bold text-slate-100">{usedText}</span>
        <span className="text-[10px] text-slate-400">allocated</span>
      </div>
    </div>
  );
};
