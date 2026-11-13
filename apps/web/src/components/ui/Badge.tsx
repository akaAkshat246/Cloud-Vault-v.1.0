import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'purple' | 'cosmic' | 'lavender' | 'amber' | 'red' | 'green' | 'teal' | 'blue' | 'slate';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'purple', children, ...props }) => {
  const variants = {
    purple: 'bg-[#9070E0]/20 text-[#B090F0] border-[#9070E0]/40',
    cosmic: 'bg-[#221C38] text-[#A3A1BD] border-[#352C55]',
    lavender: 'bg-[#C0B0F0]/15 text-[#C0B0F0] border-[#C0B0F0]/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    teal: 'bg-[#9070E0]/20 text-[#B090F0] border-[#9070E0]/40',
    blue: 'bg-[#8F6BFF]/20 text-[#A890FF] border-[#8F6BFF]/30',
    slate: 'bg-[#161226] text-[#A3A1BD] border-[#352C55]',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border select-none',
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
