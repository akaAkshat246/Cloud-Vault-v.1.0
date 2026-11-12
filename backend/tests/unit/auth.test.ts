import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { AuthService } from '../../src/services/auth.service.js';
import {
  signAccessToken,
  verifyAccessToken,
  generateRefreshTokenString,
  hashToken
} from '../../src/utils/token.js';
import {
  hashAuthKey,
  compareAuthKey,
  deriveDeterministicSalt
} from '../../src/utils/password.js';
import { User, RefreshToken, Plan } from '../../src/database/entities/index.js';
import { DataSource } from 'typeorm';

describe('Milestone M3: Authentication, Sessions & Zero-Knowledge Verification', () => {
  let mockUsers: Map<string, any>;
  let mockTokens: Map<string, any>;
  let mockPlans: Map<string, any>;
  let mockAudit: any[];
  let authService: AuthService;

  beforeEach(() => {
    mockUsers = new Map();
    mockTokens = new Map();
    mockPlans = new Map();
    mockAudit = [];

    // Pre-populate Free plan
    mockPlans.set('Free', {
      id: 'plan-free-uuid',
      name: 'Free',
      quota_bytes: '5368709120',
      price_inr: 0
    });

    const mockDataSource = {
      getRepository: (entity: any) => {
        if (entity === User) {
          return {
            findOne: vi.fn(async ({ where }) => {
              if (where.email) return mockUsers.get(where.email.toLowerCase()) || null;
              if (where.id) {
                for (const u of mockUsers.values()) {
                  if (u.id === where.id) return u;
                }
              }
              if (where.email_verification_token) {
                for (const u of mockUsers.values()) {
                  if (u.email_verification_token === where.email_verification_token) return u;
                }
              }
              return null;
            }),
            create: vi.fn((data) => ({
              id: 'user-' + Math.random().toString(36).substring(2, 9),
              created_at: new Date(),
              updated_at: new Date(),
              ...data
            })),
            save: vi.fn(async (user) => {
              mockUsers.set(user.email.toLowerCase(), user);
              return user;
            }),
            update: vi.fn(async (idOrCriteria, updates) => {
              for (const [email, u] of mockUsers.entries()) {
                if (u.id === idOrCriteria || (typeof idOrCriteria === 'object' && idOrCriteria.id === u.id)) {
                  Object.assign(u, updates);
                  mockUsers.set(email, u);
                }
              }
            })
          };
        }

        if (entity === Plan) {
          return {
            findOne: vi.fn(async ({ where }) => mockPlans.get(where.name) || null)
          };
        }

        if (entity === RefreshToken) {
          return {
            findOne: vi.fn(async ({ where }) => {
              if (where.token_hash) return mockTokens.get(where.token_hash) || null;
              if (where.id) {
                for (const t of mockTokens.values()) {
                  if (t.id === where.id) return t;
                }
              }
              return null;
            }),
            find: vi.fn(async ({ where }) => {
              const res = [];
              for (const t of mockTokens.values()) {
                if (where.user?.id && t.user.id === where.user.id && !t.is_revoked) {
                  res.push(t);
                }
              }
              return res;
            }),
            create: vi.fn((data) => ({
              id: 'token-' + Math.random().toString(36).substring(2, 9),
              created_at: new Date(),
              last_used_at: new Date(),
              is_revoked: false,
              ...data
            })),
            save: vi.fn(async (token) => {
              mockTokens.set(token.token_hash, token);
              return token;
            }),
            update: vi.fn(async (criteria, updates) => {
              for (const t of mockTokens.values()) {
                if (criteria.family_id && t.family_id === criteria.family_id) {
                  Object.assign(t, updates);
                }
                if (criteria.token_hash && t.token_hash === criteria.token_hash) {
                  Object.assign(t, updates);
                }
                if (criteria.user?.id && t.user.id === criteria.user.id) {
                  Object.assign(t, updates);
                }
              }
            })
          };
        }

        return {
          create: vi.fn((d) => d),
          save: vi.fn(async (d) => {
            mockAudit.push(d);
            return d;
          }),
          update: vi.fn()
        };
      }
    } as unknown as DataSource;

    authService = new AuthService(mockDataSource);
  });

  describe('1. Anti-User Enumeration Pre-Login', () => {
    it('returns deterministic fake salt and identical response shape for non-existent email', async () => {
      const email = 'unknown.victim@example.com';
      const res1 = await authService.prelogin(email);
      const res2 = await authService.prelogin(email);

      expect(res1.kdf_version).toBe('1.0');
      expect(res1.kdf_params).toEqual({ m: 65536, t: 3, p: 1 });
      expect(res1.salt).toBeDefined();
      expect(res1.salt.length).toBe(32); // 16 bytes hex
      // Deterministic: repeated queries for same email return identical salt
      expect(res1.salt).toBe(res2.salt);
    });
  });

  describe('2. Zero-Knowledge Registration & Dual-Key Invariants', () => {
    it('registers user, hashes AuthKey with bcrypt, and stores wrapped keys', async () => {
      const regData = {
        email: 'alice@example.com',
        authKey: 'a5ed3a2be0fb3187fe4c63bc641af5b700686267788c83a4342724286284c619',
        salt: '0102030405060708090a0b0c0d0e0f10',
        encrypted_master_key: 'b64_wrapped_master_key_ciphertext',
        master_key_nonce: '0102030405060708090a0b0c',
        encrypted_recovery_master_key: 'b64_recovery_wrapped_master_key',
        recovery_master_key_nonce: '0102030405060708090a0b0d'
      };

      const result = await authService.register(regData);
      expect(result.user.email).toBe('alice@example.com');

      const storedUser = mockUsers.get('alice@example.com');
      expect(storedUser).toBeDefined();
      // Server NEVER stores raw authKey
      expect(storedUser.auth_key_hash).not.toBe(regData.authKey);
      expect(storedUser.auth_key_hash.startsWith('$cv1$')).toBe(true);

      // Verify bcrypt comparison succeeds with correct authKey
      const match = await compareAuthKey(regData.authKey, storedUser.auth_key_hash);
      expect(match).toBe(true);

      // Verify wrong key fails
      const wrongMatch = await compareAuthKey('0000000000000000000000000000000000000000000000000000000000000000', storedUser.auth_key_hash);
      expect(wrongMatch).toBe(false);
    });

    it('rejects duplicate email registration with ConflictError', async () => {
      const regData = {
        email: 'duplicate@example.com',
        authKey: 'a5ed3a2be0fb3187fe4c63bc641af5b700686267788c83a4342724286284c619',
        salt: '0102030405060708090a0b0c0d0e0f10',
        encrypted_master_key: 'b64_wrap',
        master_key_nonce: 'nonce123',
        encrypted_recovery_master_key: 'b64_rec',
        recovery_master_key_nonce: 'nonce456'
      };

      await authService.register(regData);
      await expect(authService.register(regData)).rejects.toThrow('already exists');
    });
  });

  describe('3. Login, Token Issuance & Refresh Token Family Reuse Detection', () => {
    const authKey = 'a5ed3a2be0fb3187fe4c63bc641af5b700686267788c83a4342724286284c619';

    beforeEach(async () => {
      await authService.register({
        email: 'bob@example.com',
        authKey,
        salt: '0102030405060708090a0b0c0d0e0f10',
        encrypted_master_key: 'master_key_payload',
        master_key_nonce: 'nonce_master',
        encrypted_recovery_master_key: 'rec_payload',
        recovery_master_key_nonce: 'nonce_rec'
      });
    });

    it('successfully logs in and returns wrapped master key and tokens', async () => {
      const res = await authService.login('bob@example.com', authKey);
      expect(res.accessToken).toBeDefined();
      expect(res.refreshToken).toBeDefined();
      expect(res.encrypted_master_key).toBe('master_key_payload');

      // Verify JWT
      const payload = await verifyAccessToken(res.accessToken);
      expect(payload.email).toBe('bob@example.com');
    });

    it('rotates refresh token on valid refresh request', async () => {
      const loginRes = await authService.login('bob@example.com', authKey);
      const refreshRes = await authService.refresh(loginRes.refreshToken);

      expect(refreshRes.accessToken).toBeDefined();
      expect(refreshRes.refreshToken).toBeDefined();
      expect(refreshRes.refreshToken).not.toBe(loginRes.refreshToken);
    });

    it('detects refresh token reuse and revokes entire family', async () => {
      const loginRes = await authService.login('bob@example.com', authKey);
      const oldToken = loginRes.refreshToken;

      // Legitimate client rotates token
      const rotate1 = await authService.refresh(oldToken);

      // Age the revoked token beyond the 10s concurrent-tab grace window
      for (const [, v] of mockTokens.entries()) {
        if (v.is_revoked) {
          v.last_used_at = new Date(Date.now() - 15000);
        }
      }

      // Attacker tries to reuse the oldToken
      await expect(authService.refresh(oldToken)).rejects.toThrow('reuse detected');

      // Legitimate client with rotate1 is now ALSO revoked (compromise defense)
      await expect(authService.refresh(rotate1.refreshToken)).rejects.toThrow();
    });
  });

  describe('4. Token Security Invariants (JWT Tampering & None Algorithm Rejection)', () => {
    it('rejects tampered JWT signature', async () => {
      const validToken = await signAccessToken('user-123', 'alice@example.com');
      const parts = validToken.split('.');
      const tampered = `${parts[0]}.${parts[1]}.tamperedSignatureBytes`;

      await expect(verifyAccessToken(tampered)).rejects.toThrow();
    });

    it('strictly rejects alg "none" tokens', async () => {
      // Construct none alg token header + payload
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ sub: 'user-123', email: 'victim@example.com' })).toString('base64url');
      const noneToken = `${header}.${payload}.`;

      await expect(verifyAccessToken(noneToken)).rejects.toThrow();
    });
  });

  describe('5. Password Change Protocol (Zero File Re-Encryption)', () => {
    it('verifies old AuthKey and stores new AuthKey hash without altering file FEKs', async () => {
      const oldAuthKey = 'a5ed3a2be0fb3187fe4c63bc641af5b700686267788c83a4342724286284c619';
      const newAuthKey = '1111111111111111111111111111111111111111111111111111111111111111';

      const reg = await authService.register({
        email: 'charlie@example.com',
        authKey: oldAuthKey,
        salt: '0102030405060708090a0b0c0d0e0f10',
        encrypted_master_key: 'master_key_wrap_v1',
        master_key_nonce: 'nonce_1',
        encrypted_recovery_master_key: 'rec_wrap_v1',
        recovery_master_key_nonce: 'rec_nonce_1'
      });

      const user = mockUsers.get('charlie@example.com');

      // Change password
      await authService.changePassword(user.id, {
        oldAuthKey,
        newAuthKey,
        newSalt: 'ffffffffffffffffffffffffffffffff',
        newEncryptedMasterKey: 'master_key_wrap_v2',
        newMasterKeyNonce: 'nonce_2',
        revokeOtherSessions: true
      });

      // Old password login must fail
      await expect(authService.login('charlie@example.com', oldAuthKey)).rejects.toThrow('Invalid email or credentials');

      // New password login must succeed and return updated wrapped master key
      const newLogin = await authService.login('charlie@example.com', newAuthKey);
      expect(newLogin.encrypted_master_key).toBe('master_key_wrap_v2');
      expect(newLogin.master_key_nonce).toBe('nonce_2');
    });
  });

  describe('6. Forgot Password Paths (ADR-014)', () => {
    it('Path A: Recovery unlock restores vault and updates credentials', async () => {
      const authKey = 'a5ed3a2be0fb3187fe4c63bc641af5b700686267788c83a4342724286284c619';
      const recoveredAuthKey = '2222222222222222222222222222222222222222222222222222222222222222';

      await authService.register({
        email: 'dave@example.com',
        authKey,
        salt: '0102030405060708090a0b0c0d0e0f10',
        encrypted_master_key: 'orig_master_key_wrap',
        master_key_nonce: 'orig_nonce',
        encrypted_recovery_master_key: 'recovery_wrap',
        recovery_master_key_nonce: 'rec_nonce'
      });

      // User unlocks vault with 24-word phrase locally and posts new credentials
      const res = await authService.recoveryUnlock({
        email: 'dave@example.com',
        newAuthKey: recoveredAuthKey,
        newSalt: 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        newEncryptedMasterKey: 'recovered_master_key_wrap',
        newMasterKeyNonce: 'recov_nonce'
      });

      expect(res.message).toContain('Vault recovered');

      // Login with new credentials succeeds
      const login = await authService.login('dave@example.com', recoveredAuthKey);
      expect(login.encrypted_master_key).toBe('recovered_master_key_wrap');
    });

    it('Path B: Account reset enforces exact confirmation string and marks data orphaned', async () => {
      const authKey = 'a5ed3a2be0fb3187fe4c63bc641af5b700686267788c83a4342724286284c619';

      await authService.register({
        email: 'eve@example.com',
        authKey,
        salt: '0102030405060708090a0b0c0d0e0f10',
        encrypted_master_key: 'orig_master',
        master_key_nonce: 'nonce1',
        encrypted_recovery_master_key: 'orig_rec',
        recovery_master_key_nonce: 'nonce2'
      });

      // Wrong confirmation text must fail
      await expect(
        authService.accountReset({
          email: 'eve@example.com',
          confirmationText: 'delete my data please',
          newAuthKey: '3333333333333333333333333333333333333333333333333333333333333333',
          newSalt: 'dddddddddddddddddddddddddddddddd',
          newEncryptedMasterKey: 'brand_new_master',
          newMasterKeyNonce: 'new_nonce',
          newEncryptedRecoveryMasterKey: 'brand_new_rec',
          newRecoveryNonce: 'new_rec_nonce'
        })
      ).rejects.toThrow('DELETE MY ENCRYPTED VAULT');

      // Exact confirmation string succeeds
      const resetRes = await authService.accountReset({
        email: 'eve@example.com',
        confirmationText: 'DELETE MY ENCRYPTED VAULT',
        newAuthKey: '3333333333333333333333333333333333333333333333333333333333333333',
        newSalt: 'dddddddddddddddddddddddddddddddd',
        newEncryptedMasterKey: 'brand_new_master',
        newMasterKeyNonce: 'new_nonce',
        newEncryptedRecoveryMasterKey: 'brand_new_rec',
        newRecoveryNonce: 'new_rec_nonce'
      });

      expect(resetRes.message).toContain('Account reset successfully');
      const user = mockUsers.get('eve@example.com');
      expect(user.is_orphaned).toBe(true);
      expect(user.orphaned_at).toBeDefined();
    });
  });

  describe('7. HTTP Integration & Route Probes', () => {
    it('POST /api/v1/auth/prelogin returns 200 with deterministic salt', async () => {
      const res = await request(app)
        .post('/api/v1/auth/prelogin')
        .send({ email: 'probe@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.kdf_version).toBe('1.0');
      expect(res.body.salt).toBeDefined();
    });

    it('GET /api/v1/auth/me rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
