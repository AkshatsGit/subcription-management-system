import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, hint, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-[11px] font-mono font-medium text-slate-300">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={twMerge(
            clsx(
              'flex h-8 w-full rounded-md border border-[#1E293B] bg-[#070A11] px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-sans',
              error && 'border-rose-500 focus-visible:ring-rose-500',
              className
            )
          )}
          {...props}
        />
        {hint && !error && <p className="text-[10px] text-slate-400 font-mono">{hint}</p>}
        {error && <p className="text-[10px] font-medium text-rose-400 font-mono">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
