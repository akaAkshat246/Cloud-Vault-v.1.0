/**
 * CloudVault Web Cryptographic Engine
 *
 * Implements 100% byte-for-byte compliant cryptographic operations for Web Browsers & Web Workers
 * using WebAssembly Libsodium (Argon2id) and standard W3C Web Crypto APIs (SubtleCrypto).
 * Validated against /packages/crypto-spec/test-vectors/v1.json.
 */

import { BIP39_ENGLISH_WORDLIST } from './wordlist.js';

// Constants matching CRYPTO_SPEC.md v1
export const IV_LENGTH = 12;
export const TAG_LENGTH = 16;
export const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MiB = 5,242,880 bytes
export const FORMAT_VERSION = 1;

export const DOMAIN_TAGS = {
  AUTH_KEY: 'cloudvault-auth-key-v1',
  KEK: 'cloudvault-kek-v1',
  MASTER_KEY_WRAP: 'cloudvault-master-key-wrap-v1',
  RECOVERY_WRAP: 'cloudvault-recovery-master-key-v1',
  METADATA_WRAP: 'cloudvault-metadata-v1',
  FEK_WRAP: 'cloudvault-fek-v1',
} as const;

// Libsodium sumo instance loader
let sodiumPromise: Promise<any> | null = null;

export async function getSodiumInstance(): Promise<any> {
  if (!sodiumPromise) {
    sodiumPromise = (async () => {
      // If running inside Node.js or Vitest/jsdom environment
      if (typeof process !== 'undefined' && process.versions?.node) {
        try {
          const modName = 'module';
          const nodeModule = await import(/* @vite-ignore */ modName);
          const req = nodeModule.createRequire(import.meta.url);
          const sodium = req('libsodium-wrappers-sumo');
          await sodium.ready;
          return sodium;
        } catch {
          // Fall through to standard dynamic import
        }
      }

      // Browser / Web Worker environment
      const mod = await import('libsodium-wrappers-sumo');
      const sodium = mod.default || mod;
      await sodium.ready;
      return sodium;
    })();
  }
  return sodiumPromise;
}

// ==========================================
// Base64 and Hex Utilities
// ==========================================

export function toHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

export function fromHex(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  if (clean.length % 2 !== 0) {
    throw new Error('Invalid hex string: odd number of characters');
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
}

export function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function fromBase64(b64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(b64, 'base64'));
  }
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

export function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

export function getRandomBytes(len: number): Uint8Array {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return bytes;
}

// ==========================================
// HKDF-SHA256 (RFC 5869) via Web Crypto
// ==========================================

export async function hkdfExpand(prk: Uint8Array, infoStr: string, lengthBytes: number): Promise<Uint8Array> {
  const info = stringToBytes(infoStr);
  const key = await crypto.subtle.importKey(
    'raw',
    prk as any,
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(0) as any, // RFC 5869: salt is empty in HKDF-Expand phase
      info: info as any,
    },
    key,
    lengthBytes * 8
  );

  return new Uint8Array(derivedBits);
}

// ==========================================
// Key Derivation: Argon2id + HKDF-SHA256
// ==========================================

export async function deriveMasterKeys(
  password: string,
  salt: Uint8Array,
  options?: { iterations?: number; memoryBytes?: number }
): Promise<{ rawPRK: Uint8Array; authKey: Uint8Array; kek: Uint8Array }> {
  const sodium = await getSodiumInstance();

  if (salt.length !== 16) {
    throw new Error(`Salt must be exactly 16 bytes, got ${salt.length}`);
  }

  const opslimit = options?.iterations ?? 3;
  const memlimit = options?.memoryBytes ?? 65536 * 1024; // 64 MiB

  // Argon2id 64-byte raw output
  const rawPRK = sodium.crypto_pwhash(
    64,
    password,
    salt,
    opslimit,
    memlimit,
    sodium.crypto_pwhash_ALG_ARGON2ID13
  );

  const authKey = await hkdfExpand(rawPRK, DOMAIN_TAGS.AUTH_KEY, 32);
  const kek = await hkdfExpand(rawPRK, DOMAIN_TAGS.KEK, 32);

  return { rawPRK, authKey, kek };
}

// ==========================================
// AES-256-GCM Symmetric Encryption & Wrapping
// ==========================================

export async function encryptAesGcm(
  keyBytes: Uint8Array,
  plaintext: Uint8Array,
  aad?: Uint8Array,
  explicitIv?: Uint8Array
): Promise<{ iv: Uint8Array; ciphertext: Uint8Array; tag: Uint8Array }> {
  if (keyBytes.length !== 32) {
    throw new Error(`Invalid AES-256 key length: expected 32 bytes, got ${keyBytes.length}`);
  }
  const iv = explicitIv || getRandomBytes(IV_LENGTH);
  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length: expected 12 bytes, got ${iv.length}`);
  }

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes as any,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  // Web Crypto encrypt produces [ciphertext bytes ... tag bytes (16B)]
  const encryptedBuf = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as any,
      additionalData: (aad || new Uint8Array(0)) as any,
      tagLength: 128,
    },
    cryptoKey,
    plaintext as any
  );

  const encryptedArray = new Uint8Array(encryptedBuf);
  const ciphertextLength = encryptedArray.length - TAG_LENGTH;
  const ciphertext = encryptedArray.slice(0, ciphertextLength);
  const tag = encryptedArray.slice(ciphertextLength);

  return { iv, ciphertext, tag };
}

export async function decryptAesGcm(
  keyBytes: Uint8Array,
  iv: Uint8Array,
  ciphertext: Uint8Array,
  tag: Uint8Array,
  aad?: Uint8Array
): Promise<Uint8Array> {
  if (keyBytes.length !== 32) {
    throw new Error(`Invalid AES-256 key length: expected 32 bytes, got ${keyBytes.length}`);
  }
  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length: expected 12 bytes, got ${iv.length}`);
  }
  if (tag.length !== TAG_LENGTH) {
    throw new Error(`Invalid auth tag length: expected 16 bytes, got ${tag.length}`);
  }

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes as any,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  // Combine ciphertext and tag into single buffer required by SubtleCrypto
  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext, 0);
  combined.set(tag, ciphertext.length);

  try {
    const decryptedBuf = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as any,
        additionalData: (aad || new Uint8Array(0)) as any,
        tagLength: 128,
      },
      cryptoKey,
      combined as any
    );
    return new Uint8Array(decryptedBuf);
  } catch (err) {
    throw new Error('AES-GCM decryption failed: authentication tag verification error or tampered ciphertext');
  }
}

export async function wrapKey(
  wrappingKey: Uint8Array,
  targetKey: Uint8Array,
  aadDomain: string | Uint8Array,
  explicitIv?: Uint8Array
): Promise<{ v: number; iv: string; tag: string; ct: string }> {
  const aad = typeof aadDomain === 'string' ? stringToBytes(aadDomain) : aadDomain;
  const res = await encryptAesGcm(wrappingKey, targetKey, aad, explicitIv);
  return {
    v: 1,
    iv: toBase64(res.iv),
    tag: toBase64(res.tag),
    ct: toBase64(res.ciphertext),
  };
}

export async function unwrapKey(
  wrappingKey: Uint8Array,
  payload: { v: number; iv: string; tag: string; ct: string },
  aadDomain: string | Uint8Array
): Promise<Uint8Array> {
  if (payload.v !== 1) {
    throw new Error(`Unsupported key wrap payload version: ${payload.v}`);
  }
  const aad = typeof aadDomain === 'string' ? stringToBytes(aadDomain) : aadDomain;
  const iv = fromBase64(payload.iv);
  const tag = fromBase64(payload.tag);
  const ct = fromBase64(payload.ct);
  return await decryptAesGcm(wrappingKey, iv, ct, tag, aad);
}

// ==========================================
// Chunk Framing & AAD Construction
// ==========================================

export function parseUuidTo16Bytes(uuidStr: string): Uint8Array {
  const clean = uuidStr.replace(/-/g, '');
  if (clean.length !== 32) {
    throw new Error(`Invalid UUID string: expected 32 hex chars, got ${clean.length}`);
  }
  return fromHex(clean);
}

export function constructChunkAad(
  fileId: string,
  chunkIndex: number,
  totalChunks: number,
  isFinal: boolean,
  formatVersion: number = 1
): Uint8Array {
  const aad = new Uint8Array(27);
  const view = new DataView(aad.buffer);

  // 1. format_version (2B Big Endian)
  view.setUint16(0, formatVersion, false);

  // 2. file_id (16B UUID)
  const fileIdBytes = parseUuidTo16Bytes(fileId);
  aad.set(fileIdBytes, 2);

  // 3. chunk_index (4B Big Endian)
  view.setUint32(18, chunkIndex, false);

  // 4. total_chunks (4B Big Endian)
  view.setUint32(22, totalChunks, false);

  // 5. is_final (1B)
  view.setUint8(26, isFinal ? 1 : 0);

  return aad;
}

export async function encryptChunk(
  fek: Uint8Array,
  fileId: string,
  chunkIndex: number,
  totalChunks: number,
  isFinal: boolean,
  plaintextChunk: Uint8Array,
  explicitIv?: Uint8Array,
  formatVersion: number = 1
): Promise<Uint8Array> {
  const aad = constructChunkAad(fileId, chunkIndex, totalChunks, isFinal, formatVersion);
  const res = await encryptAesGcm(fek, plaintextChunk, aad, explicitIv);

  // Wire Chunk Framing: IV (12B) || Ciphertext (N bytes) || Tag (16B)
  const wire = new Uint8Array(IV_LENGTH + res.ciphertext.length + TAG_LENGTH);
  wire.set(res.iv, 0);
  wire.set(res.ciphertext, IV_LENGTH);
  wire.set(res.tag, IV_LENGTH + res.ciphertext.length);

  return wire;
}

export async function decryptChunk(
  fek: Uint8Array,
  fileId: string,
  chunkIndex: number,
  totalChunks: number,
  isFinal: boolean,
  framedWireChunk: Uint8Array,
  formatVersion: number = 1
): Promise<Uint8Array> {
  if (framedWireChunk.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error(`Chunk too small: minimum framed chunk length is ${IV_LENGTH + TAG_LENGTH} bytes`);
  }

  const iv = framedWireChunk.slice(0, IV_LENGTH);
  const ciphertextLength = framedWireChunk.length - IV_LENGTH - TAG_LENGTH;
  const ciphertext = framedWireChunk.slice(IV_LENGTH, IV_LENGTH + ciphertextLength);
  const tag = framedWireChunk.slice(IV_LENGTH + ciphertextLength);

  const aad = constructChunkAad(fileId, chunkIndex, totalChunks, isFinal, formatVersion);
  return await decryptAesGcm(fek, iv, ciphertext, tag, aad);
}

// ==========================================
// Metadata Encryption (Filenames & Folder Names)
// ==========================================

export async function encryptMetadata(
  masterKey: Uint8Array,
  plaintext: string,
  explicitIv?: Uint8Array
): Promise<{ ciphertext: string; nonce: string }> {
  const plaintextBytes = stringToBytes(plaintext);
  const res = await encryptAesGcm(masterKey, plaintextBytes, stringToBytes(DOMAIN_TAGS.METADATA_WRAP), explicitIv);

  // Pack ciphertext and tag together
  const packed = new Uint8Array(res.ciphertext.length + res.tag.length);
  packed.set(res.ciphertext, 0);
  packed.set(res.tag, res.ciphertext.length);

  return {
    ciphertext: toBase64(packed),
    nonce: toBase64(res.iv),
  };
}

export async function decryptMetadata(
  masterKey: Uint8Array,
  ciphertextB64: string,
  nonceB64: string
): Promise<string> {
  const packed = fromBase64(ciphertextB64);
  const iv = fromBase64(nonceB64);

  if (packed.length < TAG_LENGTH) {
    throw new Error('Encrypted metadata payload too small');
  }

  const ct = packed.slice(0, packed.length - TAG_LENGTH);
  const tag = packed.slice(packed.length - TAG_LENGTH);

  const decryptedBytes = await decryptAesGcm(
    masterKey,
    iv,
    ct,
    tag,
    stringToBytes(DOMAIN_TAGS.METADATA_WRAP)
  );

  return bytesToString(decryptedBytes);
}

// ==========================================
// Emergency Recovery Kit (BIP-39 24-Word)
// ==========================================

export async function generateMnemonic(explicitEntropy?: Uint8Array): Promise<string> {
  const entropy = explicitEntropy || getRandomBytes(32);
  if (entropy.length !== 32) {
    throw new Error(`BIP-39 24-word mnemonic requires 32 bytes of entropy, got ${entropy.length}`);
  }

  const hashBuf = await crypto.subtle.digest('SHA-256', entropy as any);
  const checksumByte = new Uint8Array(hashBuf)[0];

  let binaryStr = '';
  for (let i = 0; i < entropy.length; i++) {
    binaryStr += entropy[i].toString(2).padStart(8, '0');
  }
  binaryStr += checksumByte.toString(2).padStart(8, '0');

  const words: string[] = [];
  for (let i = 0; i < 24; i++) {
    const chunk = binaryStr.slice(i * 11, (i + 1) * 11);
    const index = parseInt(chunk, 2);
    words.push(BIP39_ENGLISH_WORDLIST[index]);
  }

  return words.join(' ');
}

export async function validateMnemonic(mnemonic: string): Promise<boolean> {
  const words = mnemonic.trim().toLowerCase().split(/\s+/);
  if (words.length !== 24) return false;

  let binaryStr = '';
  for (const word of words) {
    const index = BIP39_ENGLISH_WORDLIST.indexOf(word);
    if (index === -1) return false;
    binaryStr += index.toString(2).padStart(11, '0');
  }

  const entropyBits = binaryStr.slice(0, 256);
  const checksumBits = binaryStr.slice(256, 264);

  const entropy = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    entropy[i] = parseInt(entropyBits.slice(i * 8, (i + 1) * 8), 2);
  }

  const hashBuf = await crypto.subtle.digest('SHA-256', entropy as any);
  const expectedChecksumByte = new Uint8Array(hashBuf)[0];
  const actualChecksumByte = parseInt(checksumBits, 2);

  return expectedChecksumByte === actualChecksumByte;
}

export async function mnemonicToRecoveryKey(mnemonic: string, passphrase: string = ''): Promise<Uint8Array> {
  const valid = await validateMnemonic(mnemonic);
  if (!valid) {
    throw new Error('Invalid BIP-39 mnemonic phrase or checksum failure');
  }

  const normalized = mnemonic.trim().toLowerCase();
  const salt = `mnemonic${passphrase}`;

  const baseKey = await crypto.subtle.importKey(
    'raw',
    stringToBytes(normalized) as any,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: stringToBytes(salt) as any,
      iterations: 2048,
      hash: 'SHA-512',
    },
    baseKey,
    512 // 64 bytes
  );

  return new Uint8Array(derivedBits).slice(0, 32);
}

export async function wrapMasterKeyWithRecovery(
  masterKey: Uint8Array,
  mnemonic: string,
  explicitIv?: Uint8Array
): Promise<{ v: number; iv: string; tag: string; ct: string }> {
  const recoveryKey = await mnemonicToRecoveryKey(mnemonic);
  return await wrapKey(recoveryKey, masterKey, DOMAIN_TAGS.RECOVERY_WRAP, explicitIv);
}

export async function unwrapMasterKeyWithRecovery(
  mnemonic: string,
  payload: { v: number; iv: string; tag: string; ct: string }
): Promise<Uint8Array> {
  const recoveryKey = await mnemonicToRecoveryKey(mnemonic);
  return await unwrapKey(recoveryKey, payload, DOMAIN_TAGS.RECOVERY_WRAP);
}
