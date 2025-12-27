import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50",
          {
            'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm': variant === 'primary',
            'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700': variant === 'secondary',
            'bg-red-500 text-white hover:bg-red-600': variant === 'danger',
            'hover:bg-slate-800 text-slate-400 hover:text-slate-100': variant === 'ghost',
            'h-8 px-3 text-xs': size === 'sm',
            'h-10 px-4 py-2': size === 'md',
            'h-12 px-6': size === 'lg',
            'h-9 w-9': size === 'icon',
          },
          className
        )}
        {...props}
      />
    );
  }
);

