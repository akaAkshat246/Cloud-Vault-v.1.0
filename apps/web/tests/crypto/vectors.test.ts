import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  deriveMasterKeys,
  wrapKey,
  unwrapKey,
  encryptChunk,
  decryptChunk,
  encryptMetadata,
  decryptMetadata,
  validateMnemonic,
  mnemonicToRecoveryKey,
  wrapMasterKeyWithRecovery,
  unwrapMasterKeyWithRecovery,
  toHex,
  fromHex,
  fromBase64,
  toBase64,
  stringToBytes,
  bytesToString,
} from '../../src/crypto/web-crypto-engine.js';

// Load shared M1 test vectors
const vectorPath = path.resolve(__dirname, '../../../../packages/crypto-spec/test-vectors/v1.json');
const vectors = JSON.parse(fs.readFileSync(vectorPath, 'utf8'));

describe('CloudVault Web Cryptographic Engine — M1 Vector Verification', () => {
  it('1. Argon2id + HKDF-SHA256 matches exact known-answer PRK, AuthKey, and KEK', async () => {
    const { password, salt_hex, raw_prk_hex, auth_key_hex, kek_hex, params } = vectors.kdf;
    const salt = fromHex(salt_hex);

    const { rawPRK, authKey, kek } = await deriveMasterKeys(password, salt, {
      iterations: params.iterations,
      memoryBytes: params.memory_kib * 1024,
    });

    expect(toHex(rawPRK)).toBe(raw_prk_hex);
    expect(toHex(authKey)).toBe(auth_key_hex);
    expect(toHex(kek)).toBe(kek_hex);
  }, 15000);

  it('2. Master Key Envelope Wrapping & Unwrapping (AES-256-GCM)', async () => {
    const { kek_hex, master_key_hex, wrap_iv_hex, aad_string, payload } = vectors.master_key_wrap;
    const kek = fromHex(kek_hex);
    const masterKey = fromHex(master_key_hex);
    const explicitIv = fromHex(wrap_iv_hex);

    // Encrypt / Wrap
    const wrapped = await wrapKey(kek, masterKey, aad_string, explicitIv);
    expect(wrapped.iv).toBe(payload.iv);
    expect(wrapped.tag).toBe(payload.tag);
    expect(wrapped.ct).toBe(payload.ct);

    // Decrypt / Unwrap
    const unwrapped = await unwrapKey(kek, wrapped, aad_string);
    expect(toHex(unwrapped)).toBe(master_key_hex);
  });

  it('3. Multi-chunk S3 Framing & Encryption parity (Chunk 0 & Chunk 1)', async () => {
    const fek = fromHex(vectors.metadata.fek_hex);

    for (const chunkVec of vectors.chunks) {
      const plaintext = stringToBytes(chunkVec.plaintext_ascii);
      const explicitIv = fromHex(chunkVec.iv_hex);

      // Encrypt chunk
      const wireChunk = await encryptChunk(
        fek,
        chunkVec.file_id,
        chunkVec.chunk_index,
        chunkVec.total_chunks,
        chunkVec.is_final,
        plaintext,
        explicitIv
      );

      // Verify wire chunk byte-for-byte
      expect(toHex(wireChunk)).toBe(chunkVec.wire_chunk_hex);
      expect(toBase64(wireChunk)).toBe(chunkVec.wire_chunk_base64);

      // Decrypt chunk
      const decrypted = await decryptChunk(
        fek,
        chunkVec.file_id,
        chunkVec.chunk_index,
        chunkVec.total_chunks,
        chunkVec.is_final,
        wireChunk
      );
      expect(bytesToString(decrypted)).toBe(chunkVec.plaintext_ascii);
    }
  });

  it('4. Negative Vectors: Tampered Tag, Wrong AAD, Wrong File ID, Truncated Chunk', async () => {
    const fek = fromHex(vectors.metadata.fek_hex);
    const neg = vectors.negative_tests;

    // Tampered tag
    const tamperedTagWire = fromHex(neg.tampered_tag.wire_chunk_hex);
    await expect(
      decryptChunk(
        fek,
        neg.tampered_tag.file_id,
        neg.tampered_tag.chunk_index,
        neg.tampered_tag.total_chunks,
        neg.tampered_tag.is_final,
        tamperedTagWire
      )
    ).rejects.toThrow();

    // Wrong chunk index AAD
    const wrongAadWire = fromHex(neg.wrong_aad_chunk_index.wire_chunk_hex);
    await expect(
      decryptChunk(
        fek,
        neg.wrong_aad_chunk_index.file_id,
        neg.wrong_aad_chunk_index.chunk_index, // 1 instead of 0
        neg.wrong_aad_chunk_index.total_chunks,
        neg.wrong_aad_chunk_index.is_final,
        wrongAadWire
      )
    ).rejects.toThrow();

    // Wrong file ID in AAD
    const wrongFileIdWire = fromHex(neg.wrong_file_id.wire_chunk_hex);
    await expect(
      decryptChunk(
        fek,
        neg.wrong_file_id.file_id,
        neg.wrong_file_id.chunk_index,
        neg.wrong_file_id.total_chunks,
        neg.wrong_file_id.is_final,
        wrongFileIdWire
      )
    ).rejects.toThrow();

    // Truncated chunk
    const truncatedWire = fromHex(neg.truncated_chunk.wire_chunk_hex);
    await expect(
      decryptChunk(
        fek,
        'c9bf9e57-1685-4c89-bafb-ff5af830be8a',
        0,
        2,
        false,
        truncatedWire
      )
    ).rejects.toThrow();
  });

  it('5. Metadata Encryption: Filename round-trip and privacy preservation', async () => {
    const masterKey = fromHex(vectors.master_key_wrap.master_key_hex);
    const filename = 'Quarterly_Financial_Report_Q4_2026.pdf';

    const { ciphertext, nonce } = await encryptMetadata(masterKey, filename);
    expect(ciphertext).not.toContain('Quarterly');
    expect(nonce).toBeDefined();

    const decrypted = await decryptMetadata(masterKey, ciphertext, nonce);
    expect(decrypted).toBe(filename);
  });

  it('6. Emergency Recovery Kit: BIP-39 mnemonic validation, key derivation & MasterKey unwrap', async () => {
    const testMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art';
    const isValid = await validateMnemonic(testMnemonic);
    expect(isValid).toBe(true);

    const recoveryKey = await mnemonicToRecoveryKey(testMnemonic);
    expect(recoveryKey.length).toBe(32);

    const masterKey = fromHex(vectors.master_key_wrap.master_key_hex);
    const wrapped = await wrapMasterKeyWithRecovery(masterKey, testMnemonic);
    expect(wrapped.v).toBe(1);

    const recoveredMasterKey = await unwrapMasterKeyWithRecovery(testMnemonic, wrapped);
    expect(toHex(recoveredMasterKey)).toBe(toHex(masterKey));
  });
});
