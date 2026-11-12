import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'teal' | 'blue' | 'purple' | 'amber' | 'red' | 'slate';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'teal', children, ...props }) => {
  const variants = {
    teal: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    blue: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    slate: 'bg-slate-700/30 text-slate-400 border-slate-700/50',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border select-none',
          variants[variant],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
};

