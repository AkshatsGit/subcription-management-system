import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: Array<{ label: string; value: string | number }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, children, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={selectId} className="block text-[11px] font-mono font-medium text-slate-300">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={twMerge(
            clsx(
              'flex h-8 w-full rounded-md border border-[#1E293B] bg-[#070A11] px-3 py-1.5 text-xs text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all cursor-pointer font-sans',
              error && 'border-rose-500 focus-visible:ring-rose-500',
              className
            )
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#0B0F19] text-white">
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <p className="text-[10px] font-medium text-rose-400 font-mono">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
