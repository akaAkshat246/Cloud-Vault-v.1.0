/**
 * Streaming Chunk Encryption & Decryption Engine
 * Standardized per ADR-003 and CRYPTO_SPEC.md Section 5
 */

import { PLAINTEXT_CHUNK_SIZE } from "./constants.js";
import { encryptAesGcm, decryptAesGcm } from "./cipher.js";
import { buildChunkAAD, packChunk, unpackChunk } from "./framing.js";

export interface EncryptedChunkOutput {
  chunkIndex: number;
  totalChunks: number;
  isFinal: boolean;
  wireChunk: Uint8Array; // [12B IV] + [Ciphertext] + [16B Tag]
}

/**
 * Calculate the total number of chunks required for a given plaintext file size
 */
export function calculateTotalChunks(plaintextSize: number): number {
  if (plaintextSize <= 0) return 1;
  return Math.ceil(plaintextSize / PLAINTEXT_CHUNK_SIZE);
}

/**
 * Encrypt a buffer of file bytes into an array of S3 multipart chunks
 * @param plaintext Complete or sliced plaintext buffer
 * @param fek 256-bit File Encryption Key
 * @param fileId UUID string of file
 * @param explicitIvs Optional array of 12-byte IVs for deterministic test vectors
 */
export function encryptBufferToChunks(
  plaintext: Uint8Array,
  fek: Uint8Array,
  fileId: string,
  explicitIvs?: Uint8Array[]
): EncryptedChunkOutput[] {
  const totalChunks = calculateTotalChunks(plaintext.length);
  const chunks: EncryptedChunkOutput[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * PLAINTEXT_CHUNK_SIZE;
    const end = Math.min(start + PLAINTEXT_CHUNK_SIZE, plaintext.length);
    const chunkPlaintext = plaintext.subarray(start, end);
    const isFinal = i === totalChunks - 1;

    const aad = buildChunkAAD(fileId, i, totalChunks, isFinal);
    const iv = explicitIvs ? explicitIvs[i] : undefined;
    const encResult = encryptAesGcm(fek, chunkPlaintext, aad, iv);

    const wireChunk = packChunk(encResult.iv, encResult.ciphertext, encResult.tag);
    chunks.push({
      chunkIndex: i,
      totalChunks,
      isFinal,
      wireChunk
    });
  }

  return chunks;
}

/**
 * Decrypt an array of wire chunks back into the concatenated plaintext
 * @param chunks Array of wire chunks [12B IV] + [Ciphertext] + [16B Tag]
 * @param fek 256-bit File Encryption Key
 * @param fileId UUID string of file
 */
export function decryptChunksToBuffer(
  chunks: Uint8Array[],
  fek: Uint8Array,
  fileId: string
): Uint8Array {
  const totalChunks = chunks.length;
  const decryptedParts: Uint8Array[] = [];
  let totalDecryptedLength = 0;

  for (let i = 0; i < totalChunks; i++) {
    const wireChunk = chunks[i];
    const { iv, ciphertext, tag } = unpackChunk(wireChunk);
    const isFinal = i === totalChunks - 1;
    const aad = buildChunkAAD(fileId, i, totalChunks, isFinal);

    const plaintext = decryptAesGcm(fek, iv, ciphertext, tag, aad);
    decryptedParts.push(plaintext);
    totalDecryptedLength += plaintext.length;
  }

  const result = new Uint8Array(totalDecryptedLength);
  let offset = 0;
  for (const part of decryptedParts) {
    result.set(part, offset);
    offset += part.length;
  }

  return result;
}

/**
 * Streaming generator for processing large files chunk-by-chunk without loading whole file in RAM
 */
export async function* streamEncryptFile(
  chunksIterator: AsyncIterable<Uint8Array>,
  fek: Uint8Array,
  fileId: string,
  totalChunks: number
): AsyncGenerator<EncryptedChunkOutput> {
  let chunkIndex = 0;
  for await (const chunkBytes of chunksIterator) {
    const isFinal = chunkIndex === totalChunks - 1;
    const aad = buildChunkAAD(fileId, chunkIndex, totalChunks, isFinal);
    const res = encryptAesGcm(fek, chunkBytes, aad);
    const wireChunk = packChunk(res.iv, res.ciphertext, res.tag);

    yield {
      chunkIndex,
      totalChunks,
      isFinal,
      wireChunk
    };
    chunkIndex++;
  }
}

