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
  size = 140,
  strokeWidth = 14,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clampedPct / 100) * circumference;

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center shrink-0 ${className}`}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A784FF" />
            <stop offset="100%" stopColor="#8F6BFF" />
          </linearGradient>
        </defs>

        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2D234D"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Active Value Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
        <span className="text-xl font-bold text-white tracking-tight">{usedText}</span>
        <span className="text-xs text-[#A3A1BD]">of {totalText}</span>
      </div>
    </div>
  );
};

