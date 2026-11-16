import React from 'react';

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
}) => {
  return (
    <div
      style={{ width, height }}
      className={`animate-pulse bg-slate-800/80 rounded-md ${className}`}
      aria-hidden="true"
    />
  );
};

export const FileListSkeleton: React.FC = () => {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3.5 bg-slate-900 border border-slate-800 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-md bg-slate-800" />
            <div className="space-y-1.5">
              <Skeleton className="w-48 h-4 rounded bg-slate-800" />
              <Skeleton className="w-24 h-3 rounded bg-slate-800/60" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-3 rounded bg-slate-800" />
            <Skeleton className="w-6 h-6 rounded bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
};

