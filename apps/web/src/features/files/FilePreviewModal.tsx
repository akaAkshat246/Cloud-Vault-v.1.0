import React, { useState, useEffect } from 'react';
import {
  IconX,
  IconDownload,
  IconFileText,
  IconAlertTriangle,
  IconLock,
} from '../../components/ui/Icons.js';
import { DecryptedFile } from '../../types/vault.types.js';
import { useDownload } from '../../hooks/useDownload.js';
import { Skeleton } from '../../components/ui/Skeleton.js';

export interface FilePreviewModalProps {
  file: DecryptedFile | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  isOpen,
  onClose,
}) => {
  const { getDecryptedBlob, downloadFile } = useDownload();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [detectedType, setDetectedType] = useState<string>('');

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    if (!isOpen || !file) {
      setIsLoading(false);
      setPreviewUrl(null);
      setTextContent(null);
      setError(null);
      return;
    }

    const loadPreview = async () => {
      setIsLoading(true);
      setError(null);
      setTextContent(null);

      try {
        const { blob, objectUrl, mimeType } = await getDecryptedBlob(file);
        if (!active) {
          URL.revokeObjectURL(objectUrl);
          return;
        }

        createdUrl = objectUrl;
        setPreviewUrl(objectUrl);
        setDetectedType(mimeType);

        // If text/code/markdown/json, read string content
        const isText =
          mimeType.startsWith('text/') ||
          mimeType === 'application/json' ||
          /\.(txt|json|md|csv|log|ts|tsx|js|jsx|html|css|xml|yaml|yml|sql|sh|py|env)$/i.test(
            file.name
          );

        if (isText && blob.size < 5 * 1024 * 1024) {
          const text = await blob.text();
          if (active) {
            setTextContent(text);
          }
        }
      } catch (err: any) {
        if (active) {
          setError(err?.message || 'Failed to decrypt and preview file.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadPreview();

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [isOpen, file?.id]);

  if (!isOpen || !file) return null;

  const isImage =
    detectedType.startsWith('image/') ||
    /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(file.name);

  const isPdf =
    detectedType === 'application/pdf' || /\.pdf$/i.test(file.name);

  const isAudio =
    detectedType.startsWith('audio/') ||
    /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(file.name);

  const isVideo =
    detectedType.startsWith('video/') ||
    /\.(mp4|webm|mov|mkv)$/i.test(file.name);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-lg shadow-none flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded bg-slate-800 border border-slate-700 text-sky-400 shrink-0">
              <IconFileText size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-100 truncate" title={file.name}>
                {file.name}
              </h2>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{formatBytes(file.sizeBytes)}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-sky-400">
                  <IconLock size={11} />
                  <span>Zero-Knowledge Decrypted</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadFile(file)}
              title="Download file"
              aria-label="Download file"
              className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <IconDownload size={14} />
              <span className="hidden sm:inline">Save</span>
            </button>
            <button
              onClick={onClose}
              title="Close preview"
              aria-label="Close preview"
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <IconX size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[300px] max-h-[75vh] bg-slate-950">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-4 w-full">
              <Skeleton className="h-48 w-full max-w-md rounded-md" />
              <div className="text-xs text-slate-400 font-mono animate-pulse">
                Decrypting file chunks zero-knowledge in browser memory...
              </div>
            </div>
          ) : error ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-800 flex items-center justify-center mx-auto text-red-400">
                <IconAlertTriangle size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-200">Preview Unavailable</h3>
              <p className="text-xs text-red-300 max-w-md">{error}</p>
            </div>
          ) : isImage && previewUrl ? (
            <img
              src={previewUrl}
              alt={file.name}
              className="max-h-[68vh] max-w-full object-contain rounded border border-slate-800 shadow-none"
            />
          ) : isPdf && previewUrl ? (
            <iframe
              src={previewUrl}
              title={file.name}
              className="w-full h-[68vh] rounded border border-slate-800 bg-white"
            />
          ) : textContent !== null ? (
            <pre className="w-full h-full max-h-[68vh] p-4 bg-slate-950 text-slate-200 font-mono text-xs overflow-auto rounded border border-slate-800 whitespace-pre-wrap select-text leading-relaxed">
              {textContent}
            </pre>
          ) : isAudio && previewUrl ? (
            <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-lg text-center space-y-4">
              <IconFileText size={48} className="mx-auto text-sky-400" />
              <audio controls src={previewUrl} className="w-full" />
            </div>
          ) : isVideo && previewUrl ? (
            <video
              controls
              src={previewUrl}
              className="max-h-[68vh] max-w-full rounded border border-slate-800"
            />
          ) : (
            <div className="p-8 text-center space-y-4 bg-slate-900 border border-slate-800 rounded-lg max-w-md">
              <IconFileText size={48} className="mx-auto text-sky-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">{file.name}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Preview is not supported for this binary file format. You can download the decrypted file directly.
                </p>
              </div>
              <button
                onClick={() => downloadFile(file)}
                className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors"
              >
                <IconDownload size={14} />
                <span>Download Decrypted File</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
