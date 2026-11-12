/**
 * Cross-Platform Byte, Encoding & HKDF Utilities
 */

import crypto from "node:crypto";

/** Convert Uint8Array to Hex string */
export function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

/** Convert Hex string to Uint8Array */
export function fromHex(hex: string): Uint8Array {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, "");
  return new Uint8Array(Buffer.from(cleanHex, "hex"));
}

/** Convert Uint8Array to Base64 string */
export function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

/** Convert Base64 string to Uint8Array */
export function fromBase64(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, "base64"));
}

/** Convert UTF-8 string to Uint8Array */
export function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/** Convert Uint8Array to UTF-8 string */
export function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * Generate N cryptographically secure random bytes
 * Automatically chunks large requests to obey the 65,536-byte WebCrypto limit
 */
export function randomBytes(length: number): Uint8Array {
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
    const result = new Uint8Array(length);
    const MAX_CHUNK = 65536;
    for (let offset = 0; offset < length; offset += MAX_CHUNK) {
      const chunkLen = Math.min(MAX_CHUNK, length - offset);
      const sub = new Uint8Array(chunkLen);
      globalThis.crypto.getRandomValues(sub);
      result.set(sub, offset);
    }
    return result;
  }
  return new Uint8Array(crypto.randomBytes(length));
}

/**
 * Convert standard RFC 4122 UUID string (with or without hyphens)
 * to exact 16-byte binary representation.
 */
export function uuidToBytes(uuid: string): Uint8Array {
  const hex = uuid.replace(/-/g, "");
  if (hex.length !== 32) {
    throw new Error(`Invalid UUID format: ${uuid}`);
  }
  return fromHex(hex);
}

/**
 * Convert 16-byte binary representation to standard RFC 4122 hyphenated UUID.
 */
export function bytesToUuid(bytes: Uint8Array): string {
  if (bytes.length !== 16) {
    throw new Error(`Invalid UUID bytes length: expected 16, got ${bytes.length}`);
  }
  const hex = toHex(bytes);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * HKDF-Expand (RFC 5869) using SHA-256
 * @param prk Pseudo-Random Key (must be at least 32 bytes)
 * @param info Domain separation string / context
 * @param length Desired output length in bytes (usually 32)
 */
export function hkdfExpand(prk: Uint8Array, info: string | Uint8Array, length: number): Uint8Array {
  const infoBytes = typeof info === "string" ? stringToBytes(info) : info;
  const expanded = crypto.hkdfSync("sha256", Buffer.from(prk), Buffer.alloc(0), Buffer.from(infoBytes), length);
  return new Uint8Array(expanded);
}

/** Constant-time comparison to mitigate timing attacks */
export function constantTimeEquals(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let c = 0;
  for (let i = 0; i < a.length; i++) {
    c |= a[i] ^ b[i];
  }
  return c === 0;
}
