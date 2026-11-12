/**
 * Backend API Data Transfer Objects (DTOs)
 * Strictly matching backend TypeORM entities and OpenAPI 3.1 specification.
 */

export interface PreloginResponse {
  salt: string;
  kdf_version: string;
  kdf_params: {
    m: number;
    t: number;
    p: number;
  };
}

export interface RegisterRequest {
  email: string;
  authKey: string;
  salt: string;
  kdf_version?: string;
  kdf_params?: {
    m: number;
    t: number;
    p: number;
  };
  encrypted_master_key: string;
  master_key_nonce: string;
  encrypted_recovery_master_key: string;
  recovery_master_key_nonce: string;
  format_version?: number;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    storage_used_bytes: string | number;
    storage_quota_bytes: string | number;
    recovery_confirmed_at: string | null;
    is_email_verified: boolean;
  };
  accessToken: string;
  refreshToken?: string;
  encrypted_master_key: string;
  master_key_nonce: string;
  encrypted_recovery_master_key?: string;
  recovery_master_key_nonce?: string;
  kdf_version: string;
  kdf_params: {
    m: number;
    t: number;
    p: number;
  };
}

export interface UserProfileResponse {
  user: {
    id: string;
    email: string;
    storage_used_bytes: string | number;
    storage_quota_bytes: string | number;
    recovery_confirmed_at: string | null;
    is_email_verified: boolean;
    plan: {
      id: string;
      name: string;
      quota_bytes: string | number;
    } | null;
    created_at: string;
  };
}

export interface SessionItem {
  id: string;
  ip_address: string;
  user_agent: string;
  device_name: string;
  created_at: string;
  last_used_at: string;
  is_current: boolean;
}

export interface InitiateUploadRequest {
  expected_bytes: number;
  total_chunks: number;
  chunk_size?: number;
  encrypted_name: string;
  name_nonce: string;
  encrypted_fek: string;
  fek_nonce: string;
  folder_id?: string | null;
  mime_type_encrypted?: string | null;
  format_version?: number;
}

export interface InitiateUploadResponse {
  session_id: string;
  file_id: string;
  chunk_size: number;
  total_chunks: number;
  expires_at: string;
  parts: Array<{
    part_number: number;
    presigned_url: string;
  }>;
}

export interface PresignedPartsResponse {
  parts: Array<{
    part_number: number;
    presigned_url: string;
  }>;
}

export interface CompleteUploadRequest {
  parts: Array<{
    part_number: number;
    etag: string;
  }>;
}

export interface FileItemResponse {
  id: string;
  encrypted_name: string;
  name_nonce: string;
  size_bytes: string | number;
  total_chunks: number;
  chunk_size: number;
  mime_type_encrypted: string | null;
  folder_id: string | null;
  status: 'INITIATED' | 'UPLOADING' | 'ACTIVE' | 'TRASHED' | 'FAILED';
  format_version: number;
  encrypted_fek: string;
  fek_nonce: string;
  created_at: string;
  updated_at: string;
}

export interface FolderItemResponse {
  id: string;
  encrypted_name: string;
  name_nonce: string;
  parent_id: string | null;
  is_trashed: boolean;
  created_at: string;
  updated_at: string;
}

export interface DownloadInfoResponse {
  file_id: string;
  encrypted_name: string;
  name_nonce: string;
  download_url: string;
  size_bytes: string | number;
  total_chunks: number;
  chunk_size: number;
  encrypted_fek: string;
  fek_nonce: string;
  format_version: number;
  mime_type_encrypted: string | null;
}
