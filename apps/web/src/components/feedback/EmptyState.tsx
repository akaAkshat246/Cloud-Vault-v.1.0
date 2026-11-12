import React from 'react';
import { FolderLock } from 'lucide-react';
import { Button } from '../ui/Button.js';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'This vault folder is empty',
  description = 'Upload files or create subfolders to store your zero-knowledge encrypted data.',
  icon,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
      <div className="w-16 h-16 rounded-2xl bg-teal-950/40 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-4 shadow-inner">
        {icon || <FolderLock size={32} />}
      </div>
      <h3 className="text-base font-semibold text-slate-200 mb-1">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

