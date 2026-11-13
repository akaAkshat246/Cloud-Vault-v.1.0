/**
 * Vault Navigation & Zero-Knowledge Client-Side Decryption Hook
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { vaultStore, VaultState } from '../store/vault.store.js';
import { authStore } from '../store/auth.store.js';
import { filesApi } from '../api/files.api.js';
import { foldersApi } from '../api/folders.api.js';
import { cryptoBridge } from '../crypto/crypto-bridge.js';
import { DecryptedFile, DecryptedFolder, BreadcrumbItem } from '../types/vault.types.js';

export function useVault() {
  const [vaultState, setVaultState] = useState<VaultState>(vaultStore.getState());
  const [authState, setAuthState] = useState(authStore.getState());

  useEffect(() => {
    const unsubVault = vaultStore.subscribe(setVaultState);
    const unsubAuth = authStore.subscribe(setAuthState);
    return () => {
      unsubVault();
      unsubAuth();
    };
  }, []);

  const { masterKeyHex } = authState;

  // Decrypt and load folder contents
  const refreshVault = useCallback(async (folderId: string | null = vaultStore.getState().currentFolderId) => {
    const liveAuth = authStore.getState();
    const liveKey = liveAuth.masterKeyHex;
    if (!liveAuth.isAuthenticated || !liveKey) return;
    const mKey: string = liveKey;

    vaultStore.setLoading(true);
    try {
      // 1. Fetch raw encrypted lists from backend
      const [rawFolders, rawFiles] = await Promise.all([
        foldersApi.listFolders(folderId),
        filesApi.listFiles(folderId),
      ]);

      // 2. Decrypt Folder Names in client memory
      const decryptedFolders: DecryptedFolder[] = await Promise.all(
        rawFolders.map(async (f) => {
          try {
            const name = await cryptoBridge.decryptMetadata(mKey, f.encrypted_name, f.name_nonce);
            return {
              id: f.id,
              name,
              parentId: f.parent_id,
              isTrashed: f.is_trashed,
              createdAt: f.created_at,
              updatedAt: f.updated_at,
            };
          } catch (e) {
            return {
              id: f.id,
              name: 'Encrypted Folder',
              parentId: f.parent_id,
              isTrashed: f.is_trashed,
              createdAt: f.created_at,
              updatedAt: f.updated_at,
            };
          }
        })
      );

      // 3. Decrypt File Names & Metadata in client memory
      const decryptedFiles: DecryptedFile[] = await Promise.all(
        rawFiles.map(async (file) => {
          try {
            const name = await cryptoBridge.decryptMetadata(mKey, file.encrypted_name, file.name_nonce);
            return {
              id: file.id,
              name,
              mimeType: file.mime_type_encrypted ? 'application/octet-stream' : 'application/octet-stream',
              sizeBytes: Number(file.size_bytes),
              totalChunks: file.total_chunks,
              chunkSize: file.chunk_size,
              folderId: file.folder_id,
              status: file.status,
              createdAt: file.created_at,
              updatedAt: file.updated_at,
              encryptedFek: file.encrypted_fek,
              fekNonce: file.fek_nonce,
            };
          } catch (e) {
            return {
              id: file.id,
              name: 'Encrypted File',
              mimeType: 'application/octet-stream',
              sizeBytes: Number(file.size_bytes),
              totalChunks: file.total_chunks,
              chunkSize: file.chunk_size,
              folderId: file.folder_id,
              status: file.status,
              createdAt: file.created_at,
              updatedAt: file.updated_at,
              encryptedFek: file.encrypted_fek,
              fekNonce: file.fek_nonce,
            };
          }
        })
      );

      vaultStore.setVaultContent(decryptedFolders, decryptedFiles);
    } catch (err: any) {
      vaultStore.setError(err?.message || 'Failed to refresh vault');
    } finally {
      vaultStore.setLoading(false);
    }
  }, []);

  // Navigate to folder
  const navigateToFolder = (folder: DecryptedFolder | null) => {
    if (!folder) {
      vaultStore.setFolder(null, [{ id: null, name: 'My Vault' }]);
      refreshVault(null);
      return;
    }

    const currentCrumbs = vaultState.breadcrumbs;
    const existingIndex = currentCrumbs.findIndex((b) => b.id === folder.id);

    let newCrumbs: BreadcrumbItem[];
    if (existingIndex >= 0) {
      newCrumbs = currentCrumbs.slice(0, existingIndex + 1);
    } else {
      newCrumbs = [...currentCrumbs, { id: folder.id, name: folder.name }];
    }

    vaultStore.setFolder(folder.id, newCrumbs);
    refreshVault(folder.id);
  };

  // Create New Folder
  const createFolder = async (folderName: string) => {
    const key = masterKeyHex || authStore.getState().masterKeyHex;
    if (!key) throw new Error('MasterKey required');
    const { ciphertext, nonce } = await cryptoBridge.encryptMetadata(key, folderName);
    await foldersApi.createFolder({
      encrypted_name: ciphertext,
      name_nonce: nonce,
      parent_id: vaultState.currentFolderId,
    });
    await refreshVault();
  };

  // Rename File
  const renameFile = async (fileId: string, newName: string) => {
    const key = masterKeyHex || authStore.getState().masterKeyHex;
    if (!key) throw new Error('MasterKey required');
    const { ciphertext, nonce } = await cryptoBridge.encryptMetadata(key, newName);
    await filesApi.updateFile(fileId, {
      encrypted_name: ciphertext,
      name_nonce: nonce,
    });
    await refreshVault();
  };

  // Move File to Trash
  const trashFile = async (fileId: string) => {
    await filesApi.trashFile(fileId);
    await refreshVault();
  };

  // Move Folder to Trash
  const trashFolder = async (folderId: string) => {
    await foldersApi.trashFolder(folderId);
    await refreshVault();
  };

  // Filter & Sort
  const filteredFiles = useMemo(() => {
    let result = [...vaultState.files];

    // Search filter
    if (vaultState.searchTerm.trim()) {
      const q = vaultState.searchTerm.toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(q));
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (vaultState.sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (vaultState.sortBy === 'size') {
        comparison = a.sizeBytes - b.sizeBytes;
      } else {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return vaultState.sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [vaultState.files, vaultState.searchTerm, vaultState.sortBy, vaultState.sortOrder]);

  const filteredFolders = useMemo(() => {
    let result = [...vaultState.folders];
    if (vaultState.searchTerm.trim()) {
      const q = vaultState.searchTerm.toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(q));
    }
    return result;
  }, [vaultState.folders, vaultState.searchTerm]);

  return {
    ...vaultState,
    files: filteredFiles,
    folders: filteredFolders,
    refreshVault,
    navigateToFolder,
    createFolder,
    renameFile,
    trashFile,
    trashFolder,
    setSearchTerm: (term: string) => vaultStore.setSearchTerm(term),
    setViewMode: (mode: 'grid' | 'list') => vaultStore.setViewMode(mode),
    setSorting: (by: 'name' | 'size' | 'date', order: 'asc' | 'desc') => vaultStore.setSorting(by, order),
  };
}

