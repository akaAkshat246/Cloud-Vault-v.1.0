import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { env } from '../config/env.js';

const BCRYPT_ROUNDS = 12;
export const PEPPER_PREFIX_V1 = '$cv1$';

export async function hashAuthKey(authKey: string, customPepper?: string): Promise<string> {
  const pepper = customPepper || env.JWT_ACCESS_SECRET;
  // Combine authKey with server-side secret/pepper
  const peppered = crypto
    .createHmac('sha256', pepper)
    .update(authKey)
    .digest('hex');
  const bcryptHash = await bcrypt.hash(peppered, BCRYPT_ROUNDS);
  return `${PEPPER_PREFIX_V1}${bcryptHash}`;
}

export async function compareAuthKey(
  authKey: string,
  storedHash: string,
  customPepper?: string
): Promise<boolean> {
  let rawBcryptHash = storedHash;
  const pepper = customPepper || env.JWT_ACCESS_SECRET;

  if (storedHash.startsWith(PEPPER_PREFIX_V1)) {
    rawBcryptHash = storedHash.slice(PEPPER_PREFIX_V1.length);
  }

  const peppered = crypto
    .createHmac('sha256', pepper)
    .update(authKey)
    .digest('hex');
  return await bcrypt.compare(peppered, rawBcryptHash);
}

/**
 * Derives a deterministic fake salt for unknown emails during pre-login.
 * Prevents user enumeration by ensuring non-existent users return the exact same
 * salt format and deterministic value without database state leakage.
 */
export function deriveDeterministicSalt(email: string): string {
  const normalized = email.trim().toLowerCase();
  return crypto
    .createHmac('sha256', env.JWT_ACCESS_SECRET + ':deterministic-salt-v1')
    .update(normalized)
    .digest('hex')
    .slice(0, 32); // 16 bytes hex (32 characters)
}

export function generateRandomHex(bytes = 16): string {
  return crypto.randomBytes(bytes).toString('hex');
}

