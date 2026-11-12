/**
 * Chunked Direct-to-S3 Upload Manager Hook
 *
 * Implements M4 direct S3 chunked multipart upload with two-phase quota reservation,
 * Web Worker AES-256-GCM chunk framing (IV 12B + AAD 27B + Tag 16B), and real-time progress.
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { vaultStore } from '../store/vault.store.js';
import { authStore } from '../store/auth.store.js';
import { filesApi } from '../api/files.api.js';
import { cryptoBridge } from '../crypto/crypto-bridge.js';
import { CHUNK_SIZE, FORMAT_VERSION, getRandomBytes, toHex } from '../crypto/web-crypto-engine.js';
import { UploadQueueItem } from '../types/vault.types.js';

export function useUpload() {
  const [uploads, setUploads] = useState<UploadQueueItem[]>(vaultStore.getState().uploads);

  useEffect(() => {
    return vaultStore.subscribe((s) => setUploads(s.uploads));
  }, []);

  const uploadFile = async (file: File, folderId: string | null = null) => {
    const { masterKeyHex } = authStore.getState();
    if (!masterKeyHex) {
      throw new Error('Vault is locked; MasterKey is required to upload');
    }

    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const abortController = new AbortController();

    const queueItem: UploadQueueItem = {
      id: uploadId,
      file,
      folderId,
      progress: 0,
      uploadedBytes: 0,
      totalBytes: file.size,
      status: 'PENDING',
      speedBytesPerSec: 0,
      abortController,
    };

    vaultStore.addUpload(queueItem);

    try {
      vaultStore.updateUpload(uploadId, { status: 'UPLOADING' });

      // Step 1: Calculate chunks & framing overhead
      const totalChunks = file.size === 0 ? 1 : Math.ceil(file.size / CHUNK_SIZE);
      const expectedCiphertextBytes = file.size + 28 * totalChunks;

      // Step 2: Generate fresh File Encryption Key (FEK)
      const fekBytes = getRandomBytes(32);
      const fekHex = toHex(fekBytes);

      // Wrap FEK with MasterKey
      const wrappedFek = await cryptoBridge.wrapMasterKey(masterKeyHex, fekHex, 'cloudvault-fek-v1');

      // Encrypt Filename with MasterKey
      const encryptedFilename = await cryptoBridge.encryptMetadata(masterKeyHex, file.name);

      // Step 3: Phase 1 Quota Reservation & Multipart Initiation
      const initRes = await filesApi.initiateUpload({
        expected_bytes: expectedCiphertextBytes,
        total_chunks: totalChunks,
        chunk_size: CHUNK_SIZE,
        encrypted_name: encryptedFilename.ciphertext,
        name_nonce: encryptedFilename.nonce,
        encrypted_fek: wrappedFek.ct + wrappedFek.tag,
        fek_nonce: wrappedFek.iv,
        folder_id: folderId,
        format_version: FORMAT_VERSION,
      });

      const sessionId = initRes.session_id;
      const fileId = initRes.file_id;
      vaultStore.updateUpload(uploadId, { sessionId });

      // Prepare parts tracking
      const completedParts: Array<{ part_number: number; etag: string }> = [];
      let partUrls = initRes.parts;

      let uploadedBytesAcc = 0;
      const startTime = Date.now();

      // Step 4: Chunk Slicing, Web Worker Encryption & Direct S3 PUT
      for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
        if (abortController.signal.aborted) {
          throw new Error('Upload aborted by user');
        }

        const isFinal = chunkIdx === totalChunks - 1;
        const start = chunkIdx * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const sliceBlob = file.slice(start, end);
        const chunkArrayBuffer = await sliceBlob.arrayBuffer();
        const plaintextChunk = new Uint8Array(chunkArrayBuffer);

        // Encrypt chunk in Web Worker (off main thread)
        const wireChunk = await cryptoBridge.encryptChunk(
          fekHex,
          fileId,
          chunkIdx,
          totalChunks,
          isFinal,
          plaintextChunk,
          FORMAT_VERSION
        );

        // Find or request presigned part URL
        let partInfo = partUrls.find((p) => p.part_number === chunkIdx + 1);
        if (!partInfo) {
          const batchRes = await filesApi.getPartUrls(sessionId, [chunkIdx + 1]);
          partInfo = batchRes.parts[0];
        }

        if (!partInfo) {
          throw new Error(`Failed to obtain presigned URL for part ${chunkIdx + 1}`);
        }

        // Direct S3 Upload via PUT
        const putRes = await axios.put(partInfo.presigned_url, wireChunk, {
          headers: {
            'Content-Type': 'application/octet-stream',
          },
          signal: abortController.signal,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const currentChunkUploaded = progressEvent.loaded;
              const totalUploadedSoFar = uploadedBytesAcc + currentChunkUploaded;
              const progressPct = Math.min(99, Math.round((totalUploadedSoFar / expectedCiphertextBytes) * 100));
              const elapsedSec = (Date.now() - startTime) / 1000;
              const speed = elapsedSec > 0 ? totalUploadedSoFar / elapsedSec : 0;

              vaultStore.updateUpload(uploadId, {
                progress: progressPct,
                uploadedBytes: totalUploadedSoFar,
                speedBytesPerSec: speed,
              });
            }
          },
        });

        // Extract ETag
        const rawEtag = putRes.headers['etag'] || putRes.headers['ETag'];
        if (!rawEtag) {
          throw new Error(`S3 did not return an ETag for part ${chunkIdx + 1}`);
        }
        const cleanEtag = rawEtag.replace(/"/g, '');

        completedParts.push({
          part_number: chunkIdx + 1,
          etag: cleanEtag,
        });

        uploadedBytesAcc += wireChunk.byteLength;
      }

      // Step 5: Phase 3 Complete Multipart Upload & Quota Finalization
      await filesApi.completeUpload(sessionId, { parts: completedParts });

      vaultStore.updateUpload(uploadId, {
        progress: 100,
        status: 'COMPLETED',
        uploadedBytes: expectedCiphertextBytes,
      });

      return { success: true, fileId };
    } catch (error: any) {
      if (queueItem.sessionId) {
        try {
          await filesApi.abortUpload(queueItem.sessionId);
        } catch (abortErr) {
          console.warn('[useUpload] Failed to abort upload session:', abortErr);
        }
      }

      vaultStore.updateUpload(uploadId, {
        status: 'ERROR',
        error: error?.message || 'Upload failed',
      });
      throw error;
    }
  };

  const cancelUpload = async (uploadId: string) => {
    const item = uploads.find((u) => u.id === uploadId);
    if (item) {
      item.abortController?.abort();
      if (item.sessionId) {
        try {
          await filesApi.abortUpload(item.sessionId);
        } catch (e) {
          // ignore
        }
      }
      vaultStore.updateUpload(uploadId, { status: 'ABORTED' });
    }
  };

  const clearUpload = (uploadId: string) => {
    vaultStore.removeUpload(uploadId);
  };

  return {
    uploads,
    uploadFile,
    cancelUpload,
    clearUpload,
  };
}

