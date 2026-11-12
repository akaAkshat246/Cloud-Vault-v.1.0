/**
 * Emergency Recovery Kit: BIP-39 24-Word Mnemonic Implementation
 * Standardized per ADR-007 and CRYPTO_SPEC.md Section 7
 */

import crypto from "node:crypto";
import { BIP39_ENGLISH_WORDLIST } from "./wordlist.js";
import { KeyWrapPayload, DOMAIN_TAGS } from "./constants.js";
import { wrapKey, unwrapKey } from "./cipher.js";
import { randomBytes } from "./utils.js";

/**
 * Generate a 24-word BIP-39 mnemonic from 256 bits (32 bytes) of entropy
 * @param explicitEntropy Optional 32-byte buffer for deterministic test vectors
 */
export function generateMnemonic(explicitEntropy?: Uint8Array): string {
  const entropy = explicitEntropy || randomBytes(32);
  if (entropy.length !== 32) {
    throw new Error(`BIP-39 24-word mnemonic requires 32 bytes of entropy, got ${entropy.length}`);
  }

  // 1. Compute SHA-256 hash of entropy to produce 8-bit checksum
  const hash = crypto.createHash("sha256").update(Buffer.from(entropy)).digest();
  const checksumByte = hash[0];

  // 2. Build 264-bit binary representation: 256 bits entropy + 8 bits checksum
  let binaryStr = "";
  for (let i = 0; i < entropy.length; i++) {
    binaryStr += entropy[i].toString(2).padStart(8, "0");
  }
  binaryStr += checksumByte.toString(2).padStart(8, "0");

  // 3. Split into 24 groups of 11 bits (each 0..2047)
  const words: string[] = [];
  for (let i = 0; i < 24; i++) {
    const chunk = binaryStr.slice(i * 11, (i + 1) * 11);
    const index = parseInt(chunk, 2);
    words.push(BIP39_ENGLISH_WORDLIST[index]);
  }

  return words.join(" ");
}

/**
 * Validate a 24-word BIP-39 mnemonic phrase and verify its checksum
 */
export function validateMnemonic(mnemonic: string): boolean {
  const words = mnemonic.trim().toLowerCase().split(/\s+/);
  if (words.length !== 24) return false;

  let binaryStr = "";
  for (const word of words) {
    const index = BIP39_ENGLISH_WORDLIST.indexOf(word);
    if (index === -1) return false;
    binaryStr += index.toString(2).padStart(11, "0");
  }

  // Split into 256 bits of entropy and 8 bits of checksum
  const entropyBits = binaryStr.slice(0, 256);
  const checksumBits = binaryStr.slice(256, 264);

  const entropy = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    entropy[i] = parseInt(entropyBits.slice(i * 8, (i + 1) * 8), 2);
  }

  const hash = crypto.createHash("sha256").update(Buffer.from(entropy)).digest();
  const expectedChecksumByte = hash[0];
  const actualChecksumByte = parseInt(checksumBits, 2);

  return expectedChecksumByte === actualChecksumByte;
}

/**
 * Derive 256-bit RecoveryKey from BIP-39 mnemonic via PBKDF2-HMAC-SHA512
 * @param mnemonic 24-word phrase
 * @param passphrase Optional passphrase (default: empty string)
 */
export function mnemonicToRecoveryKey(mnemonic: string, passphrase: string = ""): Uint8Array {
  if (!validateMnemonic(mnemonic)) {
    throw new Error("Invalid BIP-39 mnemonic phrase or checksum failure");
  }

  // BIP-39 standard: salt is "mnemonic" + passphrase, 2048 iterations of HMAC-SHA512
  const normalizedMnemonic = mnemonic.trim().toLowerCase();
  const salt = `mnemonic${passphrase}`;
  const seed = crypto.pbkdf2Sync(
    Buffer.from(normalizedMnemonic, "utf8"),
    Buffer.from(salt, "utf8"),
    2048,
    64,
    "sha512"
  );

  // Return first 32 bytes as RecoveryKey
  return new Uint8Array(seed.subarray(0, 32));
}

/**
 * Wrap the user's MasterKey with the derived RecoveryKey
 */
export function wrapMasterKeyWithRecovery(
  masterKey: Uint8Array,
  mnemonic: string,
  explicitIv?: Uint8Array
): KeyWrapPayload {
  const recoveryKey = mnemonicToRecoveryKey(mnemonic);
  return wrapKey(recoveryKey, masterKey, DOMAIN_TAGS.RECOVERY_WRAP, explicitIv);
}

/**
 * Unwrap the user's MasterKey using their Recovery Phrase
 */
export function unwrapMasterKeyWithRecovery(
  payload: KeyWrapPayload,
  mnemonic: string
): Uint8Array {
  const recoveryKey = mnemonicToRecoveryKey(mnemonic);
  return unwrapKey(recoveryKey, payload, DOMAIN_TAGS.RECOVERY_WRAP);
}

/**
 * Generate 3 or 4 random word indices (1-indexed: 1..24) for user confirmation challenge
 */
export function generateChallengeWordIndices(count: number = 4): number[] {
  const indices: Set<number> = new Set();
  while (indices.size < count) {
    const idx = Math.floor(Math.random() * 24) + 1; // 1 to 24
    indices.add(idx);
  }
  return Array.from(indices).sort((a, b) => a - b);
}

/**
 * Verify user's challenge answers during signup gate
 */
export function verifyChallengeAnswers(
  mnemonic: string,
  answers: Record<number, string>
): boolean {
  const words = mnemonic.trim().toLowerCase().split(/\s+/);
  if (words.length !== 24) return false;

  for (const [indexStr, answer] of Object.entries(answers)) {
    const index = parseInt(indexStr, 10);
    if (index < 1 || index > 24) return false;
    const expectedWord = words[index - 1];
    if (expectedWord !== answer.trim().toLowerCase()) {
      return false;
    }
  }
  return true;
}

