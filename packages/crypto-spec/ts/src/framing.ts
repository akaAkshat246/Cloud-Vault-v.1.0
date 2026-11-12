/**
 * Chunk Framing & Authenticated Additional Data (AAD) Construction
 * Standardized per CRYPTO_SPEC.md Section 5
 */

import { FORMAT_VERSION, IV_LENGTH, TAG_LENGTH, CHUNK_OVERHEAD } from "./constants.js";
import { uuidToBytes, bytesToUuid } from "./utils.js";

export interface ChunkMetadata {
  formatVersion: number;
  fileId: string;
  chunkIndex: number;
  totalChunks: number;
  isFinal: boolean;
}

/**
 * Build deterministic 27-byte AAD buffer for chunk authentication
 * Binary layout:
 * - format_version: uint16 BE (2B)
 * - file_id: raw 16 bytes UUID
 * - chunk_index: uint32 BE (4B)
 * - total_chunks: uint32 BE (4B)
 * - is_final: uint8 (1B: 0x01 if true, else 0x00)
 */
export function buildChunkAAD(
  fileId: string | Uint8Array,
  chunkIndex: number,
  totalChunks: number,
  isFinal: boolean,
  formatVersion: number = FORMAT_VERSION
): Uint8Array {
  const fileIdBytes = typeof fileId === "string" ? uuidToBytes(fileId) : fileId;
  if (fileIdBytes.length !== 16) {
    throw new Error(`fileId must be 16 bytes (UUID), got ${fileIdBytes.length}`);
  }
  if (chunkIndex < 0 || totalChunks <= 0 || chunkIndex >= totalChunks) {
    throw new Error(`Invalid chunk bounds: index ${chunkIndex} of total ${totalChunks}`);
  }

  const aad = new Uint8Array(27);
  const view = new DataView(aad.buffer, aad.byteOffset, aad.byteLength);

  // Bytes 0..1: format_version (uint16 BE)
  view.setUint16(0, formatVersion, false);

  // Bytes 2..17: file_id (16 bytes)
  aad.set(fileIdBytes, 2);

  // Bytes 18..21: chunk_index (uint32 BE)
  view.setUint32(18, chunkIndex, false);

  // Bytes 22..25: total_chunks (uint32 BE)
  view.setUint32(22, totalChunks, false);

  // Byte 26: is_final (uint8)
  aad[26] = isFinal ? 0x01 : 0x00;

  return aad;
}

/**
 * Parse and validate 27-byte AAD buffer
 */
export function parseChunkAAD(aad: Uint8Array): ChunkMetadata {
  if (aad.length !== 27) {
    throw new Error(`Invalid AAD length: expected 27 bytes, got ${aad.length}`);
  }
  const view = new DataView(aad.buffer, aad.byteOffset, aad.byteLength);
  const formatVersion = view.getUint16(0, false);
  const fileId = bytesToUuid(aad.subarray(2, 18));
  const chunkIndex = view.getUint32(18, false);
  const totalChunks = view.getUint32(22, false);
  const isFinal = aad[26] === 0x01;

  return { formatVersion, fileId, chunkIndex, totalChunks, isFinal };
}

/**
 * Pack IV, Ciphertext and Tag into a single S3 wire chunk
 * Layout: [12-byte IV] + [Ciphertext] + [16-byte Tag]
 */
export function packChunk(iv: Uint8Array, ciphertext: Uint8Array, tag: Uint8Array): Uint8Array {
  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length: expected 12, got ${iv.length}`);
  }
  if (tag.length !== TAG_LENGTH) {
    throw new Error(`Invalid Tag length: expected 16, got ${tag.length}`);
  }

  const totalLength = iv.length + ciphertext.length + tag.length;
  const chunk = new Uint8Array(totalLength);
  chunk.set(iv, 0);
  chunk.set(ciphertext, iv.length);
  chunk.set(tag, iv.length + ciphertext.length);

  return chunk;
}

/**
 * Unpack wire chunk into its constituent parts
 * Layout: [12-byte IV] + [Ciphertext] + [16-byte Tag]
 */
export function unpackChunk(chunk: Uint8Array): { iv: Uint8Array; ciphertext: Uint8Array; tag: Uint8Array } {
  if (chunk.length < CHUNK_OVERHEAD) {
    throw new Error(`Chunk too small: minimum length is ${CHUNK_OVERHEAD} bytes, got ${chunk.length}`);
  }

  const iv = chunk.subarray(0, IV_LENGTH);
  const ciphertext = chunk.subarray(IV_LENGTH, chunk.length - TAG_LENGTH);
  const tag = chunk.subarray(chunk.length - TAG_LENGTH);

  return { iv, ciphertext, tag };
}

