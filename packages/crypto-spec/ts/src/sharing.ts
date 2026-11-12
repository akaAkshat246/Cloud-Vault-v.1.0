/**
 * Zero-Knowledge Link Sharing & Ephemeral Fragment Keys
 * Standardized per ADR-008 and CRYPTO_SPEC.md Section 8
 */

import { getSodium } from "./sodium-loader.js";
import { ARGON2ID_PARAMS, DOMAIN_TAGS, KeyWrapPayload } from "./constants.js";
import { wrapKey, unwrapKey } from "./cipher.js";
import { toBase64, fromBase64, hkdfExpand } from "./utils.js";
import { initCrypto } from "./kdf.js";

/**
 * Format a zero-knowledge public share URL with the FEK in the fragment
 * RFC 3986 dictates that the fragment (#...) is NEVER transmitted to the server
 */
export function createShareUrl(baseUrl: string, token: string, fek: Uint8Array): string {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const base64Key = toBase64(fek);
  return `${cleanBase}/share/${token}#key=${encodeURIComponent(base64Key)}`;
}

/**
 * Extract and parse 256-bit FEK from the URL fragment
 * Supports passing window.location.hash or full URL
 */
export function parseShareKeyFromUrl(urlOrHash: string): Uint8Array {
  let hash = urlOrHash;
  const hashIdx = urlOrHash.indexOf("#");
  if (hashIdx !== -1) {
    hash = urlOrHash.slice(hashIdx + 1);
  } else if (hash.startsWith("#")) {
    hash = hash.slice(1);
  }

  const params = new URLSearchParams(hash);
  const keyParam = params.get("key");
  if (!keyParam) {
    throw new Error("Missing 'key' parameter in URL fragment");
  }

  const fekBytes = fromBase64(decodeURIComponent(keyParam));
  if (fekBytes.length !== 32) {
    throw new Error(`Invalid share key length: expected 32 bytes, got ${fekBytes.length}`);
  }

  return fekBytes;
}

/**
 * For password-protected share links:
 * Wrap the FEK using an Argon2id key derived from the share password
 */
export async function wrapFekWithSharePassword(
  fek: Uint8Array,
  password: string,
  shareSalt: Uint8Array,
  explicitIv?: Uint8Array
): Promise<KeyWrapPayload> {
  const sodium = await getSodium();
  if (shareSalt.length !== 16) {
    throw new Error(`Share salt must be 16 bytes, got ${shareSalt.length}`);
  }

  const rawPRK = sodium.crypto_pwhash(
    32,
    password,
    shareSalt,
    ARGON2ID_PARAMS.iterations,
    ARGON2ID_PARAMS.memoryBytes,
    sodium.crypto_pwhash_ALG_ARGON2ID13
  );

  const shareKek = hkdfExpand(new Uint8Array(rawPRK), DOMAIN_TAGS.SHARE_PASSWORD_WRAP, 32);
  return wrapKey(shareKek, fek, DOMAIN_TAGS.SHARE_PASSWORD_WRAP, explicitIv);
}

/**
 * For password-protected share links:
 * Unwrap the FEK using the password supplied by the recipient
 */
export async function unwrapFekWithSharePassword(
  payload: KeyWrapPayload,
  password: string,
  shareSalt: Uint8Array
): Promise<Uint8Array> {
  const sodium = await getSodium();
  if (shareSalt.length !== 16) {
    throw new Error(`Share salt must be 16 bytes, got ${shareSalt.length}`);
  }

  const rawPRK = sodium.crypto_pwhash(
    32,
    password,
    shareSalt,
    ARGON2ID_PARAMS.iterations,
    ARGON2ID_PARAMS.memoryBytes,
    sodium.crypto_pwhash_ALG_ARGON2ID13
  );

  const shareKek = hkdfExpand(new Uint8Array(rawPRK), DOMAIN_TAGS.SHARE_PASSWORD_WRAP, 32);
  return unwrapKey(shareKek, payload, DOMAIN_TAGS.SHARE_PASSWORD_WRAP);
}
