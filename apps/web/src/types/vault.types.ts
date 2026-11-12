/**
 * Decrypted Vault Entities & State Types
 */

export interface DecryptedFile {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  totalChunks: number;
  chunkSize: number;
  folderId: string | null;
  status: 'INITIATED' | 'UPLOADING' | 'ACTIVE' | 'TRASHED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
  encryptedFek: string;
  fekNonce: string;
}

export interface DecryptedFolder {
  id: string;
  name: string;
  parentId: string | null;
  isTrashed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BreadcrumbItem {
  id: string | null;
  name: string;
}

export interface UploadQueueItem {
  id: string;
  file: File;
  folderId: string | null;
  progress: number; // 0 - 100
  uploadedBytes: number;
  totalBytes: number;
  status: 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'ERROR' | 'ABORTED';
  speedBytesPerSec: number;
  error?: string;
  sessionId?: string;
  abortController?: AbortController;
}

export interface DownloadQueueItem {
  fileId: string;
  name: string;
  progress: number; // 0 - 100
  status: 'DOWNLOADING' | 'DECRYPTING' | 'COMPLETED' | 'ERROR';
  error?: string;
}

