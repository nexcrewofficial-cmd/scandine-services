import React from 'react';
import { cn } from '../utils/cn.js';

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30',
        className
      )}
    >
      {icon && <div className="mb-3 text-zinc-400 dark:text-zinc-500">{icon}</div>}
      <h4 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">{title}</h4>
      {description && (
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
