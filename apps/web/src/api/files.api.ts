/**
 * Files & Multipart Upload API Service
 */

import { apiClient } from './client.js';
import {
  InitiateUploadRequest,
  InitiateUploadResponse,
  PresignedPartsResponse,
  CompleteUploadRequest,
  FileItemResponse,
  DownloadInfoResponse,
} from '../types/api.types.js';

export const filesApi = {
  // 1. List Files
  listFiles: async (folderId?: string | null): Promise<FileItemResponse[]> => {
    const params = folderId ? { folder_id: folderId } : {};
    const res = await apiClient.get<{ files: FileItemResponse[] }>('/v1/files', { params });
    return res.data.files;
  },

  // 2. Get File by ID
  getFile: async (fileId: string): Promise<FileItemResponse> => {
    const res = await apiClient.get<FileItemResponse>(`/v1/files/${fileId}`);
    return res.data;
  },

  // 3. Initiate Multipart Upload Session & Quota Reservation
  initiateUpload: async (payload: InitiateUploadRequest): Promise<InitiateUploadResponse> => {
    const res = await apiClient.post<InitiateUploadResponse>('/v1/files/uploads', payload);
    return res.data;
  },

  // 4. Batch Presigned Part URLs
  getPartUrls: async (sessionId: string, chunkIndices: number[]): Promise<PresignedPartsResponse> => {
    const res = await apiClient.post<PresignedPartsResponse>(`/v1/files/uploads/${sessionId}/parts`, {
      chunk_indices: chunkIndices,
    });
    return res.data;
  },

  // 5. Complete Multipart Upload
  completeUpload: async (sessionId: string, payload: CompleteUploadRequest): Promise<{ message: string; file: FileItemResponse }> => {
    const res = await apiClient.post<{ message: string; file: FileItemResponse }>(
      `/v1/files/uploads/${sessionId}/complete`,
      payload
    );
    return res.data;
  },

  // 6. Abort Upload & Release Quota
  abortUpload: async (sessionId: string): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>(`/v1/files/uploads/${sessionId}/abort`);
    return res.data;
  },

  // 7. Get File Download Info & Presigned S3 URL
  getDownloadInfo: async (fileId: string): Promise<DownloadInfoResponse> => {
    const res = await apiClient.get<DownloadInfoResponse>(`/v1/files/${fileId}/download-info`);
    return res.data;
  },

  // 7b. Secure Ciphertext Stream Fallback
  downloadContentStream: async (fileId: string): Promise<ArrayBuffer> => {
    const res = await apiClient.get<ArrayBuffer>(`/v1/files/${fileId}/content`, {
      responseType: 'arraybuffer',
    });
    return res.data;
  },

  // 8. Soft Delete (Move to Trash)
  trashFile: async (fileId: string): Promise<void> => {
    await apiClient.delete(`/v1/files/${fileId}`);
  },

  // 9. Restore File from Trash
  restoreFile: async (fileId: string): Promise<void> => {
    await apiClient.post(`/v1/files/${fileId}/restore`);
  },

  // 10. Permanently Delete File
  permanentDeleteFile: async (fileId: string): Promise<void> => {
    await apiClient.delete(`/v1/files/${fileId}/permanent`);
  },

  // 11. Rename or Move File
  updateFile: async (
    fileId: string,
    payload: {
      encrypted_name?: string;
      name_nonce?: string;
      folder_id?: string | null;
    }
  ): Promise<FileItemResponse> => {
    const res = await apiClient.patch<FileItemResponse>(`/v1/files/${fileId}`, payload);
    return res.data;
  },
};

