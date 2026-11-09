import React from 'react';
import { cn } from '../utils/cn.js';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition dark:border-zinc-800 dark:bg-zinc-900',
        hoverable && 'hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
