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

  const getDecryptedBlob = async (file: DecryptedFile): Promise<{ blob: Blob; objectUrl: string; mimeType: string }> => {
    const { masterKeyHex } = authStore.getState();
    if (!masterKeyHex) {
      throw new Error('Vault is locked; MasterKey is required to decrypt file');
    }

    // Step 1: Fetch Download Info & Presigned S3 URL
    const info = await filesApi.getDownloadInfo(file.id);

    // Step 2: Unwrap FEK using MasterKey in Web Worker
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
    });

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
    }

    // Guess or detect MIME type based on extension
    let mimeType = file.mimeType || 'application/octet-stream';
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
    else if (ext === 'gif') mimeType = 'image/gif';
    else if (ext === 'webp') mimeType = 'image/webp';
    else if (ext === 'svg') mimeType = 'image/svg+xml';
    else if (ext === 'pdf') mimeType = 'application/pdf';
    else if (ext === 'txt' || ext === 'log') mimeType = 'text/plain';
    else if (ext === 'json') mimeType = 'application/json';
    else if (ext === 'csv') mimeType = 'text/csv';
    else if (ext === 'md') mimeType = 'text/markdown';
    else if (ext === 'html') mimeType = 'text/html';
    else if (ext === 'mp3') mimeType = 'audio/mpeg';
    else if (ext === 'wav') mimeType = 'audio/wav';
    else if (ext === 'mp4') mimeType = 'video/mp4';
    else if (ext === 'webm') mimeType = 'video/webm';

    const blob = new Blob(decryptedParts as any, { type: mimeType });
    const objectUrl = URL.createObjectURL(blob);

    return { blob, objectUrl, mimeType };
  };

  const downloadFile = async (file: DecryptedFile) => {
    const downloadItem: DownloadQueueItem = {
      fileId: file.id,
      name: file.name,
      progress: 0,
      status: 'DOWNLOADING',
    };

    vaultStore.addDownload(downloadItem);

    try {
      vaultStore.updateDownload(file.id, { progress: 30 });
      const { objectUrl } = await getDecryptedBlob(file);
      vaultStore.updateDownload(file.id, { status: 'DECRYPTING', progress: 85 });

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
    getDecryptedBlob,
  };
}
