import React, { useState } from 'react';
import {
  IconUploadCloud,
  IconChevronDown,
  IconChevronUp,
  IconX,
  IconCheckCircle,
  IconAlertCircle,
} from '../../components/ui/Icons.js';
import { useUpload } from '../../hooks/useUpload.js';
import { ProgressBar } from '../../components/ui/ProgressBar.js';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export const UploadManager: React.FC = () => {
  const { uploads, cancelUpload, clearUpload } = useUpload();
  const [isExpanded, setIsExpanded] = useState(true);

  if (uploads.length === 0) return null;

  const activeCount = uploads.filter((u) => u.status === 'UPLOADING' || u.status === 'PENDING').length;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 bg-slate-900 rounded-lg border border-slate-700 overflow-hidden text-xs text-slate-200">
      {/* Header */}
      <div className="p-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconUploadCloud size={16} className="text-sky-400" />
          <span className="font-semibold text-slate-100">
            {activeCount > 0 ? `Uploading ${activeCount} file${activeCount > 1 ? 's' : ''}` : 'Uploads Completed'}
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? 'Collapse uploads tray' : 'Expand uploads tray'}
          className="text-slate-400 hover:text-slate-200 transition-colors p-1"
        >
          {isExpanded ? <IconChevronDown size={16} /> : <IconChevronUp size={16} />}
        </button>
      </div>

      {/* Upload Items List */}
      {isExpanded && (
        <div className="max-h-60 overflow-y-auto divide-y divide-slate-800 p-2 space-y-2 bg-slate-900">
          {uploads.map((item) => (
            <div key={item.id} className="pt-2 first:pt-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-slate-200 truncate max-w-[200px]" title={item.file.name}>
                  {item.file.name}
                </span>
                <div className="flex items-center gap-2">
                  {item.status === 'COMPLETED' ? (
                    <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                      <IconCheckCircle size={13} />
                      <span>Done</span>
                    </span>
                  ) : item.status === 'ERROR' ? (
                    <span className="text-red-400 flex items-center gap-1 text-[11px]" title={item.error}>
                      <IconAlertCircle size={13} />
                      <span>Failed</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px] font-mono">
                      {formatBytes(item.speedBytesPerSec)}/s
                    </span>
                  )}
                  <button
                    onClick={() => (item.status === 'UPLOADING' ? cancelUpload(item.id) : clearUpload(item.id))}
                    aria-label="Remove item"
                    className="text-slate-500 hover:text-slate-300"
                  >
                    <IconX size={13} />
                  </button>
                </div>
              </div>

              {item.status === 'UPLOADING' && (
                <ProgressBar progress={item.progress} size="sm" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
