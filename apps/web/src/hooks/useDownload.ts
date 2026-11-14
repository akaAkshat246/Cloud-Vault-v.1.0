/**
 * Streaming S3 Range Download & Web Worker Decryption Hook
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { vaultStore } from '../store/vault.store.js';
import { authStore } from '../store/auth.store.js';
import { filesApi } from '../api/files.api.js';
import { cryptoBridge } from '../crypto/crypto-bridge.js';
import { CHUNK_SIZE } from '../crypto/web-crypto-engine.js';
import { DecryptedFile, DownloadQueueItem } from '../types/vault.types.js';

export function useDownload() {
  const [downloads, setDownloads] = useState<DownloadQueueItem[]>(vaultStore.getState().downloads);

  useEffect(() => {
    return vaultStore.subscribe((s) => setDownloads(s.downloads));
  }, []);

  const downloadFile = async (file: DecryptedFile) => {
    const { masterKeyHex } = authStore.getState();
    if (!masterKeyHex) {
      throw new Error('Vault is locked; MasterKey is required to download');
    }

    const downloadItem: DownloadQueueItem = {
      fileId: file.id,
      name: file.name,
      progress: 0,
      status: 'DOWNLOADING',
    };

    vaultStore.addDownload(downloadItem);

    try {
      // Step 1: Fetch Download Info & Presigned S3 URL
      const info = await filesApi.getDownloadInfo(file.id);

      // Step 2: Unwrap FEK using MasterKey in Web Worker (tag is 16B = 32 hex chars)
      const fekPayload = {
        v: 1,
        iv: info.fek_nonce,
        tag: info.encrypted_fek.slice(info.encrypted_fek.length - 32),
        ct: info.encrypted_fek.slice(0, info.encrypted_fek.length - 32),
      };

      const fekHex = await cryptoBridge.unwrapMasterKey(masterKeyHex, fekPayload, 'cloudvault-fek-v1');

      // Step 3: Fetch Encrypted Wire Payload directly from S3 Presigned URL
      const s3Res = await axios.get(info.download_url, {
        responseType: 'arraybuffer',
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.min(80, Math.round((progressEvent.loaded / progressEvent.total) * 80));
            vaultStore.updateDownload(file.id, { progress: pct });
          }
        },
      });

      vaultStore.updateDownload(file.id, { status: 'DECRYPTING', progress: 85 });

      const rawCiphertextBuffer = new Uint8Array(s3Res.data);
      const totalChunks = info.total_chunks;
      const formatVersion = info.format_version || 1;
      const wireChunkSize = CHUNK_SIZE + 28;

      const decryptedParts: Uint8Array[] = [];
      let offset = 0;

      // Step 4: Slice Wire Chunks and Decrypt via Web Worker
      for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
        const isFinal = chunkIdx === totalChunks - 1;
        const remaining = rawCiphertextBuffer.length - offset;
        const currentWireLength = isFinal ? remaining : Math.min(wireChunkSize, remaining);

        const framedChunk = rawCiphertextBuffer.slice(offset, offset + currentWireLength);

        // Decrypt in Web Worker
        const plaintextChunk = await cryptoBridge.decryptChunk(
          fekHex,
          file.id,
          chunkIdx,
          totalChunks,
          isFinal,
          framedChunk,
          formatVersion
        );

        decryptedParts.push(plaintextChunk);
        offset += currentWireLength;

        const progressPct = 85 + Math.round(((chunkIdx + 1) / totalChunks) * 14);
        vaultStore.updateDownload(file.id, { progress: progressPct });
      }

      // Step 5: Assemble Decrypted Blob & Trigger Save
      const blob = new Blob(decryptedParts as any, { type: file.mimeType || 'application/octet-stream' });
      const objectUrl = URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = file.name;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);

      vaultStore.updateDownload(file.id, { status: 'COMPLETED', progress: 100 });
      return { success: true };
    } catch (error: any) {
      vaultStore.updateDownload(file.id, {
        status: 'ERROR',
        error: error?.message || 'Download failed',
      });
      throw error;
    }
  };

  return {
    downloads,
    downloadFile,
  };
}
