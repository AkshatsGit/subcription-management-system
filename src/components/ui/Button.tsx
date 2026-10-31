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
      'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-lg select-none cursor-pointer';

    const variantClasses = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm active:scale-[0.99]',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      outline: 'border border-border bg-background hover:bg-muted text-foreground',
      danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
      ghost: 'hover:bg-muted text-foreground',
      link: 'text-primary underline-offset-4 hover:underline p-0 h-auto',
    };

    const sizeClasses = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-9 px-4 text-sm gap-2',
      lg: 'h-11 px-6 text-base gap-2.5',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(clsx(baseClasses, variantClasses[variant], sizeClasses[size], className))}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
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
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';
