import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center font-mono font-medium rounded select-none';

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-0.5 text-[11px]',
  };

  const variantClasses = {
    default: 'bg-blue-500/10 text-blue-400 border border-blue-500/25',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/25',
    danger: 'bg-rose-500/10 text-rose-400 border border-rose-500/25',
    info: 'bg-sky-500/10 text-sky-400 border border-sky-500/25',
    neutral: 'bg-slate-800 text-slate-300 border border-slate-700',
    outline: 'border border-[#1E293B] text-slate-300',
  };

  return (
    <span className={twMerge(clsx(baseClasses, sizeClasses[size], variantClasses[variant], className))} {...props}>
      {children}
    </span>
  );
};
