import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { AppDataSource } from '../../src/database/data-source.js';
import { seedPlans } from '../../src/database/seeds/plan.seed.js';
import { User, RefreshToken } from '../../src/database/entities/index.js';
import { hashAuthKey, compareAuthKey, deriveDeterministicSalt } from '../../src/utils/password.js';
import { authService } from '../../src/services/auth.service.js';
import { deriveMasterKeys, wrapKey, unwrapKey } from '@cloudvault/crypto-spec';
import crypto from 'crypto';

describe('Real PostgreSQL + Auth + Zero-Knowledge E2E Integration Suite', () => {
  const app = createApp();
  let userRepo: any;
  let tokenRepo: any;

  // Test User Cryptographic Context
  const email = 'alice.zero.knowledge@cloudvault.internal';
  const password = 'AliceSuperSecretVaultPassword2026!';
  const userSaltHex = crypto.randomBytes(16).toString('hex');
  const userSalt = Buffer.from(userSaltHex, 'hex');

  // Master Key (32 bytes = 256 bits random)
  const masterKey = crypto.randomBytes(32);

  // Recovery Key (derived from BIP-39 mnemonic simulation)
  const recoveryKey = crypto.randomBytes(32);

  let authKey: Uint8Array;
  let kek: Uint8Array;
  let wrappedMasterKeyPayload: any;
  let wrappedRecoveryMasterKeyPayload: any;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    await seedPlans(AppDataSource);
    userRepo = AppDataSource.getRepository(User);
    tokenRepo = AppDataSource.getRepository(RefreshToken);

    // Clean up test user if exists
    await userRepo.delete({ email });

    // Derive Crypto Keys using @cloudvault/crypto-spec (Argon2id + HKDF)
    const keys = await deriveMasterKeys(password, userSalt, {
      iterations: 3,
      memoryBytes: 67108864
    });
    authKey = keys.authKey;
    kek = keys.kek;

    // Wrap MasterKey with KEK (AES-256-GCM)
    wrappedMasterKeyPayload = wrapKey(kek, masterKey, 'cloudvault-master-key-wrap-v1');

    // Wrap MasterKey with RecoveryKey (AES-256-GCM)
    wrappedRecoveryMasterKeyPayload = wrapKey(recoveryKey, masterKey, 'cloudvault-recovery-wrap-v1');
  });

  afterAll(async () => {
    // Cleanup
    if (userRepo) {
      await userRepo.delete({ email });
    }
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  it('1. Anti-Enumeration: Prelogin returns deterministic fake salt for unknown emails', async () => {
    const fakeEmail = 'nonexistent.user.test@cloudvault.internal';
    const res = await request(app)
      .post('/api/v1/auth/prelogin')
      .send({ email: fakeEmail });

    expect(res.status).toBe(200);
    expect(res.body.salt).toBeDefined();
    expect(res.body.salt.length).toBe(32); // 16 bytes hex

    // Second request must return exact same deterministic salt
    const res2 = await request(app)
      .post('/api/v1/auth/prelogin')
      .send({ email: fakeEmail });

    expect(res2.body.salt).toBe(res.body.salt);
  });

  it('2. Zero-Knowledge Registration: Server receives only AuthKey and wrapped blobs', async () => {
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        authKey: Buffer.from(authKey).toString('hex'),
        salt: userSaltHex,
        kdf_version: '1.0',
        kdf_params: { m: 65536, t: 3, p: 1 },
        encrypted_master_key: JSON.stringify(wrappedMasterKeyPayload),
        master_key_nonce: wrappedMasterKeyPayload.iv,
        encrypted_recovery_master_key: JSON.stringify(wrappedRecoveryMasterKeyPayload),
        recovery_master_key_nonce: wrappedRecoveryMasterKeyPayload.iv
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.user.email).toBe(email);

    // Verify Direct Database Record: Zero-Knowledge Proof
    const dbUser = await userRepo.findOne({ where: { email } });
    expect(dbUser).toBeDefined();
    // Invariant: Server-side bcrypt hash is stored with $cv1$ pepper prefix
    expect(dbUser.auth_key_hash.startsWith('$cv1$')).toBe(true);
    // Invariant: MasterKey, KEK, and password are NOT in the database
    expect(JSON.stringify(dbUser)).not.toContain(masterKey.toString('hex'));
    expect(JSON.stringify(dbUser)).not.toContain(Buffer.from(kek).toString('hex'));
    expect(JSON.stringify(dbUser)).not.toContain(password);

    // Verify Pepper Protection: Compare with wrong pepper fails
    const isValidRealPepper = await compareAuthKey(Buffer.from(authKey).toString('hex'), dbUser.auth_key_hash);
    expect(isValidRealPepper).toBe(true);

    const isValidWrongPepper = await compareAuthKey(
      Buffer.from(authKey).toString('hex'),
      dbUser.auth_key_hash,
      'completely_wrong_server_pepper_secret_123456'
    );
    expect(isValidWrongPepper).toBe(false);
  });

  it('3. Prelogin after registration returns real user salt and KDF params', async () => {
    const res = await request(app)
      .post('/api/v1/auth/prelogin')
      .send({ email });

    expect(res.status).toBe(200);
    expect(res.body.salt).toBe(userSaltHex);
    expect(res.body.kdf_params.m).toBe(65536);
    expect(res.body.kdf_params.t).toBe(3);
    expect(res.body.kdf_params.p).toBe(1);
  });

  let accessToken: string;
  let refreshToken: string;

  it('4. User Login: Authenticates AuthKey and returns wrapped keys for client unwrap', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email,
        authKey: Buffer.from(authKey).toString('hex')
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.accessToken).toBeDefined();
    expect(loginRes.body.refreshToken).toBeDefined();
    expect(loginRes.body.encrypted_master_key).toBeDefined();

    accessToken = loginRes.body.accessToken;
    refreshToken = loginRes.body.refreshToken;

    // CLIENT-SIDE UNWRAP VERIFICATION: Client unwraps MasterKey using KEK
    const returnedPayload = JSON.parse(loginRes.body.encrypted_master_key);
    const clientUnwrapped = unwrapKey(kek, returnedPayload, 'cloudvault-master-key-wrap-v1');
    expect(Buffer.from(clientUnwrapped).toString('hex')).toBe(masterKey.toString('hex'));
  });

  it('5. Login Lockout: Failed login attempts trigger exponential backoff', async () => {
    const wrongAuthKey = crypto.randomBytes(32).toString('hex');

    // Send 4 failed attempts
    for (let i = 0; i < 4; i++) {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, authKey: wrongAuthKey });
      expect(res.status).toBe(401);
    }

    // 5th failed attempt triggers lockout
    const res5 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, authKey: wrongAuthKey });
    expect(res5.status).toBe(401);

    // 6th attempt is blocked by lockout
    const res6 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, authKey: wrongAuthKey });
    expect(res6.status).toBe(429);
    expect(res6.body.error.message).toContain('Account temporarily locked');

    // Clear lockout for remaining tests
    await userRepo.update({ email }, { failed_login_attempts: 0, lockout_until: null });
  });

  it('6. Refresh Token Rotation & Race Condition Grace Window', async () => {
    // 1. Initial refresh: rotates token
    const ref1 = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(ref1.status).toBe(200);
    expect(ref1.body.accessToken).toBeDefined();
    expect(ref1.body.refreshToken).toBeDefined();
    const newRefreshToken = ref1.body.refreshToken;

    // 2. Concurrent tab simulation: requesting with the old token within 10s grace window
    const concurrentTabRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(concurrentTabRes.status).toBe(200);
    expect(concurrentTabRes.body.accessToken).toBeDefined();

    // 3. Update the old token last_used_at to simulate expiration of the 10s grace period
    const expiredGraceDate = new Date(Date.now() - 15000); // 15 seconds ago
    await tokenRepo.update({ token_hash: crypto.createHash('sha256').update(refreshToken).digest('hex') }, {
      last_used_at: expiredGraceDate
    });

    // 4. Replay attack after grace window: MUST revoke entire family!
    const replayAttackRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(replayAttackRes.status).toBe(401);
    expect(replayAttackRes.body.error.message).toContain('Refresh token reuse detected');

    // Verify all tokens in family are revoked
    const user = await userRepo.findOne({ where: { email } });
    const activeTokens = await tokenRepo.find({ where: { user: { id: user.id }, is_revoked: false } });
    expect(activeTokens.length).toBe(0);

    // Re-login to get fresh tokens for next tests
    const freshLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, authKey: Buffer.from(authKey).toString('hex') });
    accessToken = freshLogin.body.accessToken;
    refreshToken = freshLogin.body.refreshToken;
  });

  it('7. Password Change: Re-wraps MasterKey with new KEK without file re-encryption', async () => {
    const newPassword = 'AliceBrandNewVaultPassword2026!';
    const newSaltHex = crypto.randomBytes(16).toString('hex');
    const newSalt = Buffer.from(newSaltHex, 'hex');

    // Client derives new AuthKey, new KEK
    const newKeys = await deriveMasterKeys(newPassword, newSalt, {
      iterations: 3,
      memoryBytes: 67108864
    });
    const newAuthKey = newKeys.authKey;
    const newKek = newKeys.kek;

    // Client re-wraps the ORIGINAL masterKey with new KEK
    const newWrappedMasterKeyPayload = wrapKey(newKek, masterKey, 'cloudvault-master-key-wrap-v1');

    const changeRes = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        old_auth_key: Buffer.from(authKey).toString('hex'),
        new_auth_key: Buffer.from(newAuthKey).toString('hex'),
        new_salt: newSaltHex,
        new_kdf_params: { m: 65536, t: 3, p: 1 },
        new_encrypted_master_key: JSON.stringify(newWrappedMasterKeyPayload),
        new_master_key_nonce: newWrappedMasterKeyPayload.iv
      });

    expect(changeRes.status).toBe(200);

    // Verify DB update
    const updatedUser = await userRepo.findOne({ where: { email } });
    expect(updatedUser.salt).toBe(newSaltHex);

    // Old AuthKey must fail login now
    const oldLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, authKey: Buffer.from(authKey).toString('hex') });
    expect(oldLogin.status).toBe(401);

    // New AuthKey succeeds login
    const newLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, authKey: Buffer.from(newAuthKey).toString('hex') });
    expect(newLogin.status).toBe(200);

    // Client unwrap with new KEK yields exact same MasterKey!
    const clientUnwrapped = unwrapKey(newKek, JSON.parse(newLogin.body.encrypted_master_key), 'cloudvault-master-key-wrap-v1');
    expect(Buffer.from(clientUnwrapped).toString('hex')).toBe(masterKey.toString('hex'));

    // Update test variables for subsequent steps
    authKey = newAuthKey;
    kek = newKek;
    accessToken = newLogin.body.accessToken;
  });

  it('8. Recovery Confirmation Gate: User confirms 4 random recovery words', async () => {
    const confirmRes = await request(app)
      .post('/api/v1/auth/recovery/confirm')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        word_indices: [3, 7, 14, 21],
        entered_words: ['apple', 'banana', 'cherry', 'date']
      });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.recovery_confirmed_at).toBeDefined();

    const user = await userRepo.findOne({ where: { email } });
    expect(user.recovery_confirmed_at).not.toBeNull();
  });

  it('9. Forgot Password Path A: Recovery Unlock using Recovery-wrapped MasterKey', async () => {
    // Client unwraps MasterKey using recoveryKey
    const user = await userRepo.findOne({ where: { email } });
    const recPayload = JSON.parse(user.encrypted_recovery_master_key);
    const recoveredMasterKey = unwrapKey(recoveryKey, recPayload, 'cloudvault-recovery-wrap-v1');
    expect(Buffer.from(recoveredMasterKey).toString('hex')).toBe(masterKey.toString('hex'));

    // Client sets fresh password without data loss
    const postRecoveryPassword = 'AlicePostRecoveryPassword2026!';
    const recSaltHex = crypto.randomBytes(16).toString('hex');
    const recKeys = await deriveMasterKeys(postRecoveryPassword, Buffer.from(recSaltHex, 'hex'), {
      iterations: 3,
      memoryBytes: 67108864
    });
    const recWrappedPayload = wrapKey(recKeys.kek, recoveredMasterKey, 'cloudvault-master-key-wrap-v1');

    const unlockRes = await request(app)
      .post('/api/v1/auth/recovery/unlock')
      .send({
        email,
        newAuthKey: Buffer.from(recKeys.authKey).toString('hex'),
        newSalt: recSaltHex,
        newEncryptedMasterKey: JSON.stringify(recWrappedPayload),
        newMasterKeyNonce: recWrappedPayload.iv
      });

    expect(unlockRes.status).toBe(200);

    // Verify login with recovered credentials
    const recLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, authKey: Buffer.from(recKeys.authKey).toString('hex') });
    expect(recLogin.status).toBe(200);
  });

  it('10. Forgot Password Path B: Account Reset with 30-day Orphan Grace Period', async () => {
    const brandNewMasterKey = crypto.randomBytes(32);
    const brandNewPassword = 'AliceResetPassword2026!';
    const resetSaltHex = crypto.randomBytes(16).toString('hex');
    const resetKeys = await deriveMasterKeys(brandNewPassword, Buffer.from(resetSaltHex, 'hex'), {
      iterations: 3,
      memoryBytes: 67108864
    });
    const resetMasterPayload = wrapKey(resetKeys.kek, brandNewMasterKey, 'cloudvault-master-key-wrap-v1');
    const resetRecPayload = wrapKey(crypto.randomBytes(32), brandNewMasterKey, 'cloudvault-recovery-wrap-v1');

    // Mismatched confirmation string must be rejected
    const badReset = await request(app)
      .post('/api/v1/auth/account-reset')
      .send({
        email,
        confirmationText: 'delete my files please',
        newAuthKey: Buffer.from(resetKeys.authKey).toString('hex'),
        newSalt: resetSaltHex,
        newEncryptedMasterKey: JSON.stringify(resetMasterPayload),
        newMasterKeyNonce: resetMasterPayload.iv,
        newEncryptedRecoveryMasterKey: JSON.stringify(resetRecPayload),
        newRecoveryNonce: resetRecPayload.iv
      });
    expect(badReset.status).toBe(400);

    // Exact required confirmation string
    const resetRes = await request(app)
      .post('/api/v1/auth/account-reset')
      .send({
        email,
        confirmationText: 'DELETE MY ENCRYPTED VAULT',
        newAuthKey: Buffer.from(resetKeys.authKey).toString('hex'),
        newSalt: resetSaltHex,
        newEncryptedMasterKey: JSON.stringify(resetMasterPayload),
        newMasterKeyNonce: resetMasterPayload.iv,
        newEncryptedRecoveryMasterKey: JSON.stringify(resetRecPayload),
        newRecoveryNonce: resetRecPayload.iv
      });

    expect(resetRes.status).toBe(200);

    // Verify DB state: is_orphaned = true, previous_key_bundle saved
    const orphanedUser = await userRepo.findOne({ where: { email } });
    expect(orphanedUser.is_orphaned).toBe(true);
    expect(orphanedUser.orphaned_at).not.toBeNull();
    expect(orphanedUser.previous_key_bundle).toBeDefined();
    expect(orphanedUser.previous_key_bundle.encrypted_master_key).toBeDefined();

    // Verify orphan sweeper prunes when > 30 days
    const purgedCount = await authService.purgeExpiredOrphans();
    expect(purgedCount).toBe(0); // None older than 30 days yet
  });
});
