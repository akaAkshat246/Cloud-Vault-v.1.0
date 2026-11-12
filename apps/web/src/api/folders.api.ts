/**
 * Folders API Service
 */

import { apiClient } from './client.js';
import { FolderItemResponse } from '../types/api.types.js';

export const foldersApi = {
  // 1. List Folders (at root or within parent)
  listFolders: async (parentId?: string | null): Promise<FolderItemResponse[]> => {
    const params = parentId ? { parent_id: parentId } : {};
    const res = await apiClient.get<{ folders: FolderItemResponse[] }>('/v1/folders', { params });
    return res.data.folders;
  },

  // 2. Create Folder
  createFolder: async (payload: {
    encrypted_name: string;
    name_nonce: string;
    parent_id?: string | null;
  }): Promise<FolderItemResponse> => {
    const res = await apiClient.post<FolderItemResponse>('/v1/folders', payload);
    return res.data;
  },

  // 3. Rename or Move Folder
  updateFolder: async (
    folderId: string,
    payload: {
      encrypted_name?: string;
      name_nonce?: string;
      parent_id?: string | null;
    }
  ): Promise<FolderItemResponse> => {
    const res = await apiClient.patch<FolderItemResponse>(`/v1/folders/${folderId}`, payload);
    return res.data;
  },

  // 4. Move Folder to Trash
  trashFolder: async (folderId: string): Promise<void> => {
    await apiClient.delete(`/v1/folders/${folderId}`);
  },
};

