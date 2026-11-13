import React, { useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  isPassword?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, isPassword = false, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const actualType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-[#A3A1BD] mb-1.5 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            type={actualType}
            className={twMerge(
              clsx(
                'w-full bg-[#161226] border border-[#352C55] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#8D8DA5]',
                'focus:outline-none focus:ring-2 focus:ring-[#8F6BFF]/40 focus:border-[#8F6BFF] transition-all',
                isPassword && 'pr-11',
                error && 'border-red-500 focus:ring-red-500/50 focus:border-red-500',
                className
              )
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8D8DA5] hover:text-[#B090F0] transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error ? (
          <p className="mt-1.5 text-xs text-red-400">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 text-xs text-[#8D8DA5]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
