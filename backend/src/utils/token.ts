import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { UnauthorizedError } from './errors.js';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_TTL_DAYS = 7;
const JWT_ISSUER = 'cloudvault-auth';
const JWT_AUDIENCE = 'cloudvault-clients';
const KEY_ID = 'cv-auth-key-v1';

export interface TokenUserPayload extends JWTPayload {
  sub: string; // user id
  email: string;
}

const secretKey = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

export async function signAccessToken(userId: string, email: string): Promise<string> {
  return await new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256', kid: KEY_ID, typ: 'JWT' })
    .setSubject(userId)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setNotBefore('0s')
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setJti(crypto.randomUUID())
    .sign(secretKey);
}

export async function verifyAccessToken(token: string): Promise<TokenUserPayload> {
  try {
    const { payload, protectedHeader } = await jwtVerify(token, secretKey, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ['HS256'] // Explicitly reject "none" and algorithm confusion
    });

    if (protectedHeader.alg === 'none') {
      throw new UnauthorizedError('Rejected insecure algorithm "none"');
    }

    if (!payload.sub) {
      throw new UnauthorizedError('Malformed token payload: missing subject');
    }

    return payload as TokenUserPayload;
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) throw err;
    const msg = err instanceof Error ? err.message : 'Invalid token';
    throw new UnauthorizedError(`Authentication failed: ${msg}`);
  }
}

export function generateRefreshTokenString(): string {
  return crypto.randomBytes(48).toString('base64url');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function calculateRefreshTokenExpiry(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);
  return expiresAt;
}

