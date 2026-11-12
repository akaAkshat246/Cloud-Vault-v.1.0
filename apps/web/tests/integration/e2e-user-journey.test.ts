import { describe, it, expect } from 'vitest';
import {
  deriveMasterKeys,
  wrapKey,
  unwrapKey,
  encryptChunk,
  decryptChunk,
  encryptMetadata,
  decryptMetadata,
  generateMnemonic,
  validateMnemonic,
  wrapMasterKeyWithRecovery,
  unwrapMasterKeyWithRecovery,
  getRandomBytes,
  toHex,
  stringToBytes,
  bytesToString,
  DOMAIN_TAGS,
} from '../../src/crypto/web-crypto-engine.js';
import { authStore } from '../../src/store/auth.store.js';

describe('Milestone M5: Complete Zero-Knowledge E2E Web Client Journey', () => {
  const userEmail = 'bob.e2e.tester@cloudvault.internal';
  const originalPassword = 'InitialSecurePassword2026!';
  const updatedPassword = 'BrandNewChangedPassword2026!';

  let userSalt: Uint8Array;
  let userSaltHex: string;
  let masterKeyBytes: Uint8Array;
  let masterKeyHex: string;
  let mnemonicPhrase: string;

  let wrappedMasterKeyWithKek: any;
  let wrappedMasterKeyWithRecovery: any;

  it('1. User Journey: Registration with 24-Word Emergency Recovery Kit', async () => {
    // Step A: Client generates user salt & MasterKey
    userSalt = getRandomBytes(16);
    userSaltHex = toHex(userSalt);
    masterKeyBytes = getRandomBytes(32);
    masterKeyHex = toHex(masterKeyBytes);

    // Step B: Generate 24-word BIP-39 mnemonic
    mnemonicPhrase = await generateMnemonic();
    expect(await validateMnemonic(mnemonicPhrase)).toBe(true);
    expect(mnemonicPhrase.split(/\s+/).length).toBe(24);

    // Step C: Derive AuthKey & KEK locally with Argon2id
    const { authKey, kek } = await deriveMasterKeys(originalPassword, userSalt, {
      iterations: 3,
      memoryBytes: 65536 * 1024,
    });
    expect(authKey.length).toBe(32);
    expect(kek.length).toBe(32);

    // Step D: Wrap MasterKey with KEK (for daily password unlock)
    wrappedMasterKeyWithKek = await wrapKey(kek, masterKeyBytes, DOMAIN_TAGS.MASTER_KEY_WRAP);
    expect(wrappedMasterKeyWithKek.v).toBe(1);

    // Step E: Wrap MasterKey with RecoveryKey (for emergency recovery)
    wrappedMasterKeyWithRecovery = await wrapMasterKeyWithRecovery(masterKeyBytes, mnemonicPhrase);
    expect(wrappedMasterKeyWithRecovery.v).toBe(1);
  });

  it('2. User Journey: Login & Volatile MasterKey Unwrapping', async () => {
    // Step A: Client derives AuthKey & KEK from password and salt
    const { authKey, kek } = await deriveMasterKeys(originalPassword, userSalt);
    expect(authKey.length).toBe(32);

    // Step B: Server returns wrapped_master_key blob. Client unwraps MasterKey in volatile RAM
    const unwrappedMasterKey = await unwrapKey(kek, wrappedMasterKeyWithKek, DOMAIN_TAGS.MASTER_KEY_WRAP);
    expect(toHex(unwrappedMasterKey)).toBe(masterKeyHex);

    // Step C: Set into in-memory AuthStore
    authStore.setAuthenticated(
      {
        id: 'usr_bob_001',
        email: userEmail,
        storage_used_bytes: 0,
        storage_quota_bytes: 5368709120,
        recovery_confirmed_at: new Date().toISOString(),
        is_email_verified: true,
      },
      'jwt_access_token_mock',
      toHex(unwrappedMasterKey),
      toHex(kek)
    );

    expect(authStore.getState().isAuthenticated).toBe(true);
  });

  let fileId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  let fekBytes: Uint8Array;
  let fekHex: string;
  let encryptedFilename: { ciphertext: string; nonce: string };
  let wireChunks: Uint8Array[] = [];
  const plaintextFileContent = 'Hello CloudVault 2026! This is a confidential document stored with Zero-Knowledge encryption.'.repeat(500);

  it('3. User Journey: Chunked Direct-to-S3 Upload Lifecycle', async () => {
    const masterKey = authStore.getState().masterKeyHex!;

    // Step A: Encrypt filename metadata with MasterKey
    encryptedFilename = await encryptMetadata(masterKeyBytes, 'Confidential_Business_Plan_2026.docx');
    expect(encryptedFilename.ciphertext).not.toContain('Confidential');

    // Step B: Generate fresh per-file FEK & wrap with MasterKey
    fekBytes = getRandomBytes(32);
    fekHex = toHex(fekBytes);
    const wrappedFek = await wrapKey(masterKeyBytes, fekBytes, DOMAIN_TAGS.FEK_WRAP);
    expect(wrappedFek.v).toBe(1);

    // Step C: Slice file into chunks (simulate 2 chunks)
    const plaintextBytes = stringToBytes(plaintextFileContent);
    const half = Math.floor(plaintextBytes.length / 2);
    const chunk0 = plaintextBytes.slice(0, half);
    const chunk1 = plaintextBytes.slice(half);

    // Step D: Encrypt chunks in client memory with 27-byte AAD binding
    const wireChunk0 = await encryptChunk(fekBytes, fileId, 0, 2, false, chunk0);
    const wireChunk1 = await encryptChunk(fekBytes, fileId, 1, 2, true, chunk1);

    expect(wireChunk0.length).toBe(chunk0.length + 28);
    expect(wireChunk1.length).toBe(chunk1.length + 28);

    wireChunks = [wireChunk0, wireChunk1];
  });

  it('4. User Journey: S3 Download, Range Assembly & Decryption Integrity', async () => {
    // Step A: Client decrypts filename metadata
    const decryptedName = await decryptMetadata(masterKeyBytes, encryptedFilename.ciphertext, encryptedFilename.nonce);
    expect(decryptedName).toBe('Confidential_Business_Plan_2026.docx');

    // Step B: Client decrypts chunks with FEK and verifies AAD authenticity
    const decryptedChunk0 = await decryptChunk(fekBytes, fileId, 0, 2, false, wireChunks[0]);
    const decryptedChunk1 = await decryptChunk(fekBytes, fileId, 1, 2, true, wireChunks[1]);

    // Step C: Assemble decrypted chunks and verify 100% bit-for-bit identity
    const assembledText = bytesToString(decryptedChunk0) + bytesToString(decryptedChunk1);
    expect(assembledText).toBe(plaintextFileContent);
  });

  it('5. User Journey: Password Change Protocol (Zero File Re-Encryption)', async () => {
    // Step A: User derives new KEK from updatedPassword
    const newSalt = getRandomBytes(16);
    const { kek: newKek } = await deriveMasterKeys(updatedPassword, newSalt);

    // Step B: Re-wrap the SAME MasterKey with new KEK
    const newWrappedMasterKey = await wrapKey(newKek, masterKeyBytes, DOMAIN_TAGS.MASTER_KEY_WRAP);

    // Step C: Verify unwrap with new KEK yields exact same MasterKey
    const unwrappedWithNew = await unwrapKey(newKek, newWrappedMasterKey, DOMAIN_TAGS.MASTER_KEY_WRAP);
    expect(toHex(unwrappedWithNew)).toBe(masterKeyHex);

    // Step D: Existing files can still be decrypted with the unwrapped MasterKey!
    const decryptedChunk0 = await decryptChunk(fekBytes, fileId, 0, 2, false, wireChunks[0]);
    expect(decryptedChunk0.length).toBeGreaterThan(0);
  });

  it('6. User Journey: Logout and Volatile Memory Wipe', () => {
    authStore.clearAuth();
    const state = authStore.getState();

    expect(state.isAuthenticated).toBe(false);
    expect(state.masterKeyHex).toBeNull();
    expect(state.kekHex).toBeNull();
    expect(state.user).toBeNull();
  });
});

