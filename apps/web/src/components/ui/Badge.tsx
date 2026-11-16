import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'sky' | 'slate' | 'emerald' | 'amber' | 'red' | 'purple' | 'cosmic' | 'teal' | 'blue';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'sky', children, ...props }) => {
  const variants: Record<string, string> = {
    sky: 'bg-sky-950/60 text-sky-400 border-sky-800/60',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
    emerald: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
    amber: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
    red: 'bg-red-950/60 text-red-400 border-red-800/60',
    // Fallback aliases mapped cleanly to compliant palette
    purple: 'bg-sky-950/60 text-sky-400 border-sky-800/60',
    cosmic: 'bg-slate-800 text-slate-300 border-slate-700',
    teal: 'bg-sky-950/60 text-sky-400 border-sky-800/60',
    blue: 'bg-sky-950/60 text-sky-400 border-sky-800/60',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border select-none',
          variants[variant] || variants.sky,
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
};
