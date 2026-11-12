/**
 * Key Derivation Engine: Argon2id (RFC 9106) + HKDF-SHA256 (RFC 5869)
 * Standardized per ADR-002 and CRYPTO_SPEC.md Section 3
 */

import { getSodium } from "./sodium-loader.js";
import { ARGON2ID_PARAMS, DOMAIN_TAGS } from "./constants.js";
import { hkdfExpand } from "./utils.js";

export interface KDFOptions {
  iterations?: number;      // opslimit (default: 3)
  memoryBytes?: number;     // memlimit (default: 67108864 = 64 MiB)
}

export interface DerivedKeyBundle {
  raw: Uint8Array;          // 64-byte PRK from Argon2id
  authKey: Uint8Array;      // 32-byte key for TLS login authentication
  kek: Uint8Array;          // 32-byte Key Encryption Key (RAM only)
}

/**
 * Ensure libsodium WASM is fully initialized before crypto operations
 */
export async function initCrypto(): Promise<any> {
  return await getSodium();
}

/**
 * Derive Dual-Keys from user master password and 16-byte random salt
 * 1. Computes 64-byte raw output via Argon2id (RFC 9106)
 * 2. Expands into 32-byte AuthKey using info = "cloudvault-auth-key-v1"
 * 3. Expands into 32-byte KEK using info = "cloudvault-kek-v1"
 */
export async function deriveMasterKeys(
  password: string,
  salt: Uint8Array,
  options?: KDFOptions
): Promise<DerivedKeyBundle> {
  const sodium = await getSodium();

  if (salt.length !== 16) {
    throw new Error(`Salt must be exactly 16 bytes, received ${salt.length}`);
  }

  const opslimit = options?.iterations ?? ARGON2ID_PARAMS.iterations;
  const memlimit = options?.memoryBytes ?? ARGON2ID_PARAMS.memoryBytes;

  // Execute Argon2id in WebAssembly
  const rawPRK = sodium.crypto_pwhash(
    ARGON2ID_PARAMS.rawOutputLength,
    password,
    salt,
    opslimit,
    memlimit,
    sodium.crypto_pwhash_ALG_ARGON2ID13
  );

  // Expand with domain separation via HKDF-SHA256
  const authKey = hkdfExpand(rawPRK, DOMAIN_TAGS.AUTH_KEY, 32);
  const kek = hkdfExpand(rawPRK, DOMAIN_TAGS.KEK, 32);

  return {
    raw: new Uint8Array(rawPRK),
    authKey,
    kek
  };
}
