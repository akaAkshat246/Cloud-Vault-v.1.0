/**
 * Decrypted Vault Cache & Upload Queue Store
 */

import { DecryptedFile, DecryptedFolder, BreadcrumbItem, UploadQueueItem, DownloadQueueItem } from '../types/vault.types.js';

export interface VaultState {
  currentFolderId: string | null;
  breadcrumbs: BreadcrumbItem[];
  folders: DecryptedFolder[];
  files: DecryptedFile[];
  uploads: UploadQueueItem[];
  downloads: DownloadQueueItem[];
  searchTerm: string;
  viewMode: 'grid' | 'list';
  sortBy: 'name' | 'size' | 'date';
  sortOrder: 'asc' | 'desc';
  isLoading: boolean;
  error: string | null;
}

type VaultSubscriber = (state: VaultState) => void;

class VaultStore {
  private state: VaultState = {
    currentFolderId: null,
    breadcrumbs: [{ id: null, name: 'My Vault' }],
    folders: [],
    files: [],
    uploads: [],
    downloads: [],
    searchTerm: '',
    viewMode: 'grid',
    sortBy: 'date',
    sortOrder: 'desc',
    isLoading: false,
    error: null,
  };

  private subscribers = new Set<VaultSubscriber>();

  public getState(): VaultState {
    return { ...this.state };
  }

  public subscribe(fn: VaultSubscriber): () => void {
    this.subscribers.add(fn);
    fn(this.getState());
    return () => this.subscribers.delete(fn);
  }

  private notify() {
    const currentState = this.getState();
    this.subscribers.forEach((fn) => fn(currentState));
  }

  public setFolder(folderId: string | null, breadcrumbs?: BreadcrumbItem[]) {
    this.state = {
      ...this.state,
      currentFolderId: folderId,
      breadcrumbs: breadcrumbs || this.state.breadcrumbs,
    };
    this.notify();
  }

  public setVaultContent(folders: DecryptedFolder[], files: DecryptedFile[]) {
    this.state = {
      ...this.state,
      folders,
      files,
      isLoading: false,
      error: null,
    };
    this.notify();
  }

  public setLoading(loading: boolean) {
    this.state = {
      ...this.state,
      isLoading: loading,
    };
    this.notify();
  }

  public setError(error: string | null) {
    this.state = {
      ...this.state,
      error,
      isLoading: false,
    };
    this.notify();
  }

  public setSearchTerm(term: string) {
    this.state = {
      ...this.state,
      searchTerm: term,
    };
    this.notify();
  }

  public setViewMode(mode: 'grid' | 'list') {
    this.state = {
      ...this.state,
      viewMode: mode,
    };
    this.notify();
  }

  public setSorting(sortBy: 'name' | 'size' | 'date', sortOrder: 'asc' | 'desc') {
    this.state = {
      ...this.state,
      sortBy,
      sortOrder,
    };
    this.notify();
  }

  public addUpload(item: UploadQueueItem) {
    this.state = {
      ...this.state,
      uploads: [item, ...this.state.uploads],
    };
    this.notify();
  }

  public updateUpload(id: string, updates: Partial<UploadQueueItem>) {
    this.state = {
      ...this.state,
      uploads: this.state.uploads.map((u) => (u.id === id ? { ...u, ...updates } : u)),
    };
    this.notify();
  }

  public removeUpload(id: string) {
    this.state = {
      ...this.state,
      uploads: this.state.uploads.filter((u) => u.id !== id),
    };
    this.notify();
  }

  public addDownload(item: DownloadQueueItem) {
    this.state = {
      ...this.state,
      downloads: [item, ...this.state.downloads],
    };
    this.notify();
  }

  public updateDownload(fileId: string, updates: Partial<DownloadQueueItem>) {
    this.state = {
      ...this.state,
      downloads: this.state.downloads.map((d) => (d.fileId === fileId ? { ...d, ...updates } : d)),
    };
    this.notify();
  }

  public removeDownload(fileId: string) {
    this.state = {
      ...this.state,
      downloads: this.state.downloads.filter((d) => d.fileId !== fileId),
    };
    this.notify();
  }
}

export const vaultStore = new VaultStore();

