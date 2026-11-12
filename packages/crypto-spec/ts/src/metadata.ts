/**
 * Client-Side Zero-Knowledge Metadata Encryption
 * Standardized per ADR-004 and CRYPTO_SPEC.md Section 6
 */

import { FORMAT_VERSION, DOMAIN_TAGS, EncryptedMetadataPayload, FileMetadataPlaintext } from "./constants.js";
import { encryptAesGcm, decryptAesGcm } from "./cipher.js";
import { stringToBytes, bytesToString, toBase64, fromBase64, uuidToBytes } from "./utils.js";

/**
 * Build deterministic AAD for file/folder metadata
 * Layout: format_version (2B BE) + file_id (16B UUID) + "cloudvault-metadata-v1"
 */
export function buildMetadataAAD(fileId: string): Uint8Array {
  const fileIdBytes = uuidToBytes(fileId);
  const tagBytes = stringToBytes(DOMAIN_TAGS.METADATA_WRAP);
  const aad = new Uint8Array(2 + 16 + tagBytes.length);
  const view = new DataView(aad.buffer, aad.byteOffset, aad.byteLength);

  view.setUint16(0, FORMAT_VERSION, false);
  aad.set(fileIdBytes, 2);
  aad.set(tagBytes, 18);

  return aad;
}

/**
 * Encrypt file metadata (filename, original mime type, size) with file FEK
 */
export function encryptMetadata(
  fek: Uint8Array,
  fileId: string,
  metadata: FileMetadataPlaintext,
  explicitIv?: Uint8Array
): EncryptedMetadataPayload {
  const plaintext = stringToBytes(JSON.stringify(metadata));
  const aad = buildMetadataAAD(fileId);
  const res = encryptAesGcm(fek, plaintext, aad, explicitIv);

  return {
    v: FORMAT_VERSION,
    iv: toBase64(res.iv),
    tag: toBase64(res.tag),
    ct: toBase64(res.ciphertext)
  };
}

/**
 * Decrypt file metadata with file FEK
 */
export function decryptMetadata(
  fek: Uint8Array,
  fileId: string,
  payload: EncryptedMetadataPayload
): FileMetadataPlaintext {
  if (payload.v !== FORMAT_VERSION) {
    throw new Error(`Unsupported metadata format version: ${payload.v}`);
  }
  const aad = buildMetadataAAD(fileId);
  const iv = fromBase64(payload.iv);
  const tag = fromBase64(payload.tag);
  const ct = fromBase64(payload.ct);

  const plaintextBytes = decryptAesGcm(fek, iv, ct, tag, aad);
  const jsonStr = bytesToString(plaintextBytes);
  return JSON.parse(jsonStr) as FileMetadataPlaintext;
}

