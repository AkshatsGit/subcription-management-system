import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none rounded-md select-none cursor-pointer';

    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-500 shadow-xs active:scale-[0.99]',
      secondary: 'bg-[#131B2E] text-slate-200 hover:bg-[#1A253F] border border-[#1E2D4A]',
      outline: 'border border-[#1E293B] bg-transparent hover:bg-[#111827] text-slate-200',
      danger: 'bg-rose-600 text-white hover:bg-rose-500 shadow-xs',
      ghost: 'hover:bg-[#111827] text-slate-300 hover:text-white',
      link: 'text-blue-400 underline-offset-4 hover:underline p-0 h-auto',
    };

    const sizeClasses = {
      sm: 'h-7 px-2.5 text-xs gap-1.5',
      md: 'h-8 px-3.5 text-xs gap-2',
      lg: 'h-10 px-5 text-sm gap-2.5',
      icon: 'h-8 w-8 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(clsx(baseClasses, variantClasses[variant], sizeClasses[size], className))}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-1.5">
            <svg
              className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Processing...
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';
