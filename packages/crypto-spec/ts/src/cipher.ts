/**
 * AES-256-GCM Symmetric Cipher & Envelope Key Wrapping
 * NIST SP 800-38D Compliant
 */

import crypto from "node:crypto";
import { IV_LENGTH, TAG_LENGTH, KeyWrapPayload, DOMAIN_TAGS } from "./constants.js";
import { fromBase64, toBase64, randomBytes, stringToBytes } from "./utils.js";

export interface AesGcmResult {
  iv: Uint8Array;
  ciphertext: Uint8Array;
  tag: Uint8Array;
}

/**
 * Encrypt arbitrary plaintext with AES-256-GCM
 * @param key 256-bit symmetric key (32 bytes)
 * @param plaintext Plaintext bytes
 * @param aad Optional Authenticated Additional Data bytes
 * @param explicitIv Optional 12-byte IV (generated randomly if omitted)
 */
export function encryptAesGcm(
  key: Uint8Array,
  plaintext: Uint8Array,
  aad?: Uint8Array,
  explicitIv?: Uint8Array
): AesGcmResult {
  if (key.length !== 32) {
    throw new Error(`Invalid AES-256 key length: expected 32 bytes, got ${key.length}`);
  }
  const iv = explicitIv || randomBytes(IV_LENGTH);
  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length: expected 12 bytes, got ${iv.length}`);
  }

  const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(key), Buffer.from(iv));
  if (aad && aad.length > 0) {
    cipher.setAAD(Buffer.from(aad));
  }

  const ciphertext = Buffer.concat([
    cipher.update(Buffer.from(plaintext)),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();

  return {
    iv: new Uint8Array(iv),
    ciphertext: new Uint8Array(ciphertext),
    tag: new Uint8Array(tag)
  };
}

/**
 * Decrypt AES-256-GCM ciphertext and authenticate tag + AAD
 * @throws Error if authentication fails (tampered tag, corrupted ciphertext, or mismatched AAD)
 */
export function decryptAesGcm(
  key: Uint8Array,
  iv: Uint8Array,
  ciphertext: Uint8Array,
  tag: Uint8Array,
  aad?: Uint8Array
): Uint8Array {
  if (key.length !== 32) {
    throw new Error(`Invalid AES-256 key length: expected 32 bytes, got ${key.length}`);
  }
  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length: expected 12 bytes, got ${iv.length}`);
  }
  if (tag.length !== TAG_LENGTH) {
    throw new Error(`Invalid auth tag length: expected 16 bytes, got ${tag.length}`);
  }

  const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(key), Buffer.from(iv));
  decipher.setAuthTag(Buffer.from(tag));
  if (aad && aad.length > 0) {
    decipher.setAAD(Buffer.from(aad));
  }

  try {
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertext)),
      decipher.final()
    ]);
    return new Uint8Array(plaintext);
  } catch (err) {
    throw new Error("AES-GCM decryption failed: authentication tag verification error or tampered ciphertext");
  }
}

/**
 * Wrap a symmetric key using AES-256-GCM (Envelope Encryption)
 * @param wrappingKey Key Encryption Key (KEK) or MasterKey (32 bytes)
 * @param targetKey Key to be wrapped (e.g. 32-byte FEK or MasterKey)
 * @param aadDomain Domain separation tag or contextual identifier (e.g. file_id)
 * @param explicitIv Optional IV for deterministic test vectors
 */
export function wrapKey(
  wrappingKey: Uint8Array,
  targetKey: Uint8Array,
  aadDomain: string | Uint8Array,
  explicitIv?: Uint8Array
): KeyWrapPayload {
  const aad = typeof aadDomain === "string" ? stringToBytes(aadDomain) : aadDomain;
  const res = encryptAesGcm(wrappingKey, targetKey, aad, explicitIv);
  return {
    v: 1,
    iv: toBase64(res.iv),
    tag: toBase64(res.tag),
    ct: toBase64(res.ciphertext)
  };
}

/**
 * Unwrap a symmetric key using AES-256-GCM
 * @throws Error if key unwrap fails
 */
export function unwrapKey(
  wrappingKey: Uint8Array,
  payload: KeyWrapPayload,
  aadDomain: string | Uint8Array
): Uint8Array {
  if (payload.v !== 1) {
    throw new Error(`Unsupported key wrap payload version: ${payload.v}`);
  }
  const aad = typeof aadDomain === "string" ? stringToBytes(aadDomain) : aadDomain;
  const iv = fromBase64(payload.iv);
  const tag = fromBase64(payload.tag);
  const ct = fromBase64(payload.ct);
  return decryptAesGcm(wrappingKey, iv, ct, tag, aad);
}

