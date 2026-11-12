/**
 * Cryptographic Worker & RPC Types
 */

export interface DerivedCredentials {
  authKeyHex: string;
  kekHex: string;
}

export interface WorkerDeriveKeysRequest {
  type: 'DERIVE_KEYS';
  password: string;
  saltHex: string;
  iterations: number;
  memoryKib: number;
  parallelism: number;
}

export interface WorkerUnwrapMasterKeyRequest {
  type: 'UNWRAP_MASTER_KEY';
  kekHex: string;
  wrappedMasterKeyB64: string;
  nonceB64: string;
}

export interface WorkerWrapMasterKeyRequest {
  type: 'WRAP_MASTER_KEY';
  kekHex: string;
  masterKeyHex: string;
}

export interface WorkerEncryptMetadataRequest {
  type: 'ENCRYPT_METADATA';
  masterKeyHex: string;
  plaintext: string;
}

export interface WorkerDecryptMetadataRequest {
  type: 'DECRYPT_METADATA';
  masterKeyHex: string;
  ciphertextB64: string;
  nonceB64: string;
}

export interface WorkerEncryptChunkRequest {
  type: 'ENCRYPT_CHUNK';
  fekHex: string;
  fileId: string;
  chunkIndex: number;
  totalChunks: number;
  isFinal: boolean;
  plaintextChunk: Uint8Array;
}

export interface WorkerDecryptChunkRequest {
  type: 'DECRYPT_CHUNK';
  fekHex: string;
  fileId: string;
  chunkIndex: number;
  totalChunks: number;
  isFinal: boolean;
  framedCiphertext: Uint8Array;
}

export interface WorkerGenerateRecoveryRequest {
  type: 'GENERATE_RECOVERY_KEY';
  phrase: string;
  masterKeyHex: string;
}

export interface WorkerUnwrapWithRecoveryRequest {
  type: 'UNWRAP_WITH_RECOVERY';
  phrase: string;
  encryptedRecoveryMasterKeyB64: string;
  recoveryNonceB64: string;
}

export type WorkerRequest =
  | WorkerDeriveKeysRequest
  | WorkerUnwrapMasterKeyRequest
  | WorkerWrapMasterKeyRequest
  | WorkerEncryptMetadataRequest
  | WorkerDecryptMetadataRequest
  | WorkerEncryptChunkRequest
  | WorkerDecryptChunkRequest
  | WorkerGenerateRecoveryRequest
  | WorkerUnwrapWithRecoveryRequest;

export interface WorkerSuccessResponse<T = any> {
  id: string;
  success: true;
  result: T;
}

export interface WorkerErrorResponse {
  id: string;
  success: false;
  error: string;
}

export type WorkerResponse = WorkerSuccessResponse | WorkerErrorResponse;

