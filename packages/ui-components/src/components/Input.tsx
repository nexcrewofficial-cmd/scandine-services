'use client';

import React from 'react';
import { cn } from '../utils/cn.js';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-zinc-900 shadow-sm transition placeholder:text-zinc-400 focus:outline-none focus:ring-2 dark:bg-zinc-900 dark:text-zinc-100',
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-zinc-300 focus:border-orange-500 focus:ring-orange-500/20 dark:border-zinc-700',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-red-500">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-zinc-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
