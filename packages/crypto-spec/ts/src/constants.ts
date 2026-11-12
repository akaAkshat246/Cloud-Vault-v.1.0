/**
 * CloudVault Cryptographic Specification Constants (v1.0)
 * Standardized across Web (TypeScript) and Android (Kotlin).
 */

export const FORMAT_VERSION = 1;

/** Standard plaintext chunk size: exactly 5 MiB (5,242,880 bytes) */
export const PLAINTEXT_CHUNK_SIZE = 5 * 1024 * 1024;

/** AES-256-GCM Initialization Vector length in bytes */
export const IV_LENGTH = 12;

/** AES-256-GCM Authentication Tag length in bytes */
export const TAG_LENGTH = 16;

/** Framing overhead per chunk (IV + Tag) */
export const CHUNK_OVERHEAD = IV_LENGTH + TAG_LENGTH; // 28 bytes

/** Non-final S3 multipart ciphertext chunk size: 5,242,908 bytes (> 5 MiB) */
export const CIPHERTEXT_CHUNK_SIZE = PLAINTEXT_CHUNK_SIZE + CHUNK_OVERHEAD;

/** Symmetric Key length in bytes (256 bits) */
export const KEY_LENGTH = 32;

/** User Salt length in bytes (128 bits) */
export const SALT_LENGTH = 16;

/** Argon2id Baseline Parameters per ADR-002 */
export const ARGON2ID_PARAMS = {
  version: "1.0",
  algorithm: "argon2id",
  iterations: 3,              // t=3
  memoryKiB: 65536,           // m=64 MiB
  memoryBytes: 65536 * 1024,  // 67,108,864 bytes
  parallelism: 1,             // p=1
  saltLength: SALT_LENGTH,
  rawOutputLength: 64,        // 64 bytes (PRK for HKDF)
} as const;

/** Cryptographic Domain Separation Tags (RFC 5869 HKDF-Expand) */
export const DOMAIN_TAGS = {
  AUTH_KEY: "cloudvault-auth-key-v1",
  KEK: "cloudvault-kek-v1",
  MASTER_KEY_WRAP: "cloudvault-master-key-wrap-v1",
  RECOVERY_WRAP: "cloudvault-recovery-wrap-v1",
  METADATA_WRAP: "cloudvault-metadata-v1",
  SHARE_PASSWORD_WRAP: "cloudvault-share-pass-v1",
} as const;

export interface KeyWrapPayload {
  v: number;
  iv: string;   // Base64
  tag: string;  // Base64
  ct: string;   // Base64
}

export interface EncryptedMetadataPayload {
  v: number;
  iv: string;   // Base64
  tag: string;  // Base64
  ct: string;   // Base64
}

export interface FileMetadataPlaintext {
  name: string;
  mime: string;
  size: number;
  lastModified?: number;
}

