import React, { useState } from 'react';
import { UploadCloud, ChevronDown, ChevronUp, X, CheckCircle2, AlertCircle } from 'lucide-react';
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
    <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 glass-panel-glow rounded-xl border border-teal-500/40 shadow-2xl overflow-hidden text-xs">
      {/* Header */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UploadCloud size={16} className="text-teal-400" />
          <span className="font-semibold text-slate-200">
            {activeCount > 0 ? `Uploading ${activeCount} file${activeCount > 1 ? 's' : ''}` : 'Uploads Completed'}
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-400 hover:text-slate-200 transition-colors p-1"
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {/* Upload Items List */}
      {isExpanded && (
        <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/80 p-2 space-y-2 bg-[#0c1322]">
          {uploads.map((item) => (
            <div key={item.id} className="pt-2 first:pt-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-slate-200 truncate max-w-[200px]" title={item.file.name}>
                  {item.file.name}
                </span>
                <div className="flex items-center gap-2">
                  {item.status === 'COMPLETED' ? (
                    <span className="text-teal-400 flex items-center gap-1 text-[11px]">
                      <CheckCircle2 size={13} />
                      <span>Done</span>
                    </span>
                  ) : item.status === 'ERROR' ? (
                    <span className="text-red-400 flex items-center gap-1 text-[11px]" title={item.error}>
                      <AlertCircle size={13} />
                      <span>Failed</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px] font-mono">
                      {formatBytes(item.speedBytesPerSec)}/s
                    </span>
                  )}
                  <button
                    onClick={() => (item.status === 'UPLOADING' ? cancelUpload(item.id) : clearUpload(item.id))}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    <X size={13} />
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

