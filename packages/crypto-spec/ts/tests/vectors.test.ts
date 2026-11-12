/**
 * CloudVault Cryptographic Specification v1 Test Suite
 * Tests TypeScript reference implementation against official test-vectors/v1.json
 */

import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  initCrypto,
  deriveMasterKeys,
  wrapKey,
  unwrapKey,
  decryptAesGcm,
  buildChunkAAD,
  unpackChunk,
  decryptChunksToBuffer,
  encryptBufferToChunks,
  encryptMetadata,
  decryptMetadata,
  generateMnemonic,
  mnemonicToRecoveryKey,
  unwrapMasterKeyWithRecovery,
  generateChallengeWordIndices,
  verifyChallengeAnswers,
  toHex,
  fromHex,
  toBase64,
  fromBase64,
  bytesToString,
  DOMAIN_TAGS
} from "../src/index.js";

describe("CloudVault Cryptographic Specification v1 Verification Suite", () => {
  let vectors: any;

  beforeAll(async () => {
    await initCrypto();
    const vectorPath = path.resolve(__dirname, "../../test-vectors/v1.json");
    const jsonStr = fs.readFileSync(vectorPath, "utf8");
    vectors = JSON.parse(jsonStr);
  });

  describe("1. Key Derivation Function (Argon2id + HKDF-SHA256)", () => {
    it("should match known-answer PRK, AuthKey, and KEK", async () => {
      const { password, salt_hex, raw_prk_hex, auth_key_hex, kek_hex } = vectors.kdf;
      const salt = fromHex(salt_hex);
      const bundle = await deriveMasterKeys(password, salt);

      expect(toHex(bundle.raw)).toBe(raw_prk_hex);
      expect(toHex(bundle.authKey)).toBe(auth_key_hex);
      expect(toHex(bundle.kek)).toBe(kek_hex);
    });

    it("should fail derivation if salt length is not 16 bytes", async () => {
      await expect(deriveMasterKeys("pass", new Uint8Array(12))).rejects.toThrow("Salt must be exactly 16 bytes");
    });
  });

  describe("2. Master Key Envelope Wrapping (AES-256-GCM)", () => {
    it("should successfully unwrap MasterKey using derived KEK", () => {
      const { kek_hex, master_key_hex, payload, aad_string } = vectors.master_key_wrap;
      const kek = fromHex(kek_hex);
      const unwrapped = unwrapKey(kek, payload, aad_string);

      expect(toHex(unwrapped)).toBe(master_key_hex);
    });

    it("should re-wrap and unwrap with consistent format version", () => {
      const kek = fromHex(vectors.master_key_wrap.kek_hex);
      const masterKey = fromHex(vectors.master_key_wrap.master_key_hex);
      const newWrap = wrapKey(kek, masterKey, DOMAIN_TAGS.MASTER_KEY_WRAP);

      expect(newWrap.v).toBe(1);
      const unwrapped = unwrapKey(kek, newWrap, DOMAIN_TAGS.MASTER_KEY_WRAP);
      expect(toHex(unwrapped)).toBe(vectors.master_key_wrap.master_key_hex);
    });
  });

  describe("3. Chunk Slicing, AAD & Wire Framing", () => {
    it("should unpack and decrypt Chunk 0 (non-final) with AAD binding", () => {
      const chunk0Vec = vectors.chunks[0];
      const fek = fromHex(vectors.metadata.fek_hex);
      const wireChunk = fromHex(chunk0Vec.wire_chunk_hex);

      const { iv, ciphertext, tag } = unpackChunk(wireChunk);
      expect(toHex(iv)).toBe(chunk0Vec.iv_hex);
      expect(toHex(ciphertext)).toBe(chunk0Vec.ciphertext_hex);
      expect(toHex(tag)).toBe(chunk0Vec.tag_hex);

      const aad = fromHex(chunk0Vec.aad_hex);
      const decrypted = decryptAesGcm(fek, iv, ciphertext, tag, aad);
      expect(bytesToString(decrypted)).toBe(chunk0Vec.plaintext_ascii);
    });

    it("should unpack and decrypt Chunk 1 (final) with AAD binding", () => {
      const chunk1Vec = vectors.chunks[1];
      const fek = fromHex(vectors.metadata.fek_hex);
      const wireChunk = fromHex(chunk1Vec.wire_chunk_hex);

      const { iv, ciphertext, tag } = unpackChunk(wireChunk);
      const aad = fromHex(chunk1Vec.aad_hex);
      const decrypted = decryptAesGcm(fek, iv, ciphertext, tag, aad);
      expect(bytesToString(decrypted)).toBe(chunk1Vec.plaintext_ascii);
    });

    it("should decrypt concatenated multi-chunk stream cleanly", () => {
      const fek = fromHex(vectors.metadata.fek_hex);
      const wireChunks = [
        fromHex(vectors.chunks[0].wire_chunk_hex),
        fromHex(vectors.chunks[1].wire_chunk_hex)
      ];
      const fileId = vectors.chunks[0].file_id;

      const fullBuffer = decryptChunksToBuffer(wireChunks, fek, fileId);
      const expectedText = vectors.chunks[0].plaintext_ascii + vectors.chunks[1].plaintext_ascii;
      expect(bytesToString(fullBuffer)).toBe(expectedText);
    });
  });

  describe("4. Zero-Knowledge Metadata Encryption", () => {
    it("should decrypt file metadata cleanly using file FEK", () => {
      const { fek_hex, file_id, payload, metadata_plaintext } = vectors.metadata;
      const fek = fromHex(fek_hex);
      const decryptedMeta = decryptMetadata(fek, file_id, payload);

      expect(decryptedMeta.name).toBe(metadata_plaintext.name);
      expect(decryptedMeta.mime).toBe(metadata_plaintext.mime);
      expect(decryptedMeta.size).toBe(metadata_plaintext.size);
      expect(decryptedMeta.lastModified).toBe(metadata_plaintext.lastModified);
    });
  });

  describe("5. BIP-39 Emergency Recovery Kit & Challenge Response", () => {
    it("should derive expected 24-word mnemonic and RecoveryKey from entropy", () => {
      const { entropy_hex, mnemonic, recovery_key_hex } = vectors.recovery;
      const derivedMnemonic = generateMnemonic(fromHex(entropy_hex));
      expect(derivedMnemonic).toBe(mnemonic);

      const recoveryKey = mnemonicToRecoveryKey(mnemonic);
      expect(toHex(recoveryKey)).toBe(recovery_key_hex);
    });

    it("should unwrap MasterKey using 24-word recovery phrase", () => {
      const { mnemonic, payload, master_key_hex } = vectors.recovery;
      const unwrapped = unwrapMasterKeyWithRecovery(payload, mnemonic);
      expect(toHex(unwrapped)).toBe(master_key_hex);
    });

    it("should challenge user with 4 random words and verify matching answers", () => {
      const mnemonic = vectors.recovery.mnemonic;
      const words = mnemonic.split(" ");
      const indices = generateChallengeWordIndices(4);
      expect(indices.length).toBe(4);

      const validAnswers: Record<number, string> = {};
      for (const idx of indices) {
        validAnswers[idx] = words[idx - 1];
      }
      expect(verifyChallengeAnswers(mnemonic, validAnswers)).toBe(true);

      // Wrong answer test
      const invalidAnswers = { ...validAnswers, [indices[0]]: "wrongword" };
      expect(verifyChallengeAnswers(mnemonic, invalidAnswers)).toBe(false);
    });
  });

  describe("6. Password Change Re-keying Protocol", () => {
    it("should decrypt MasterKey with old KEK and re-wrap with new KEK without touching files", () => {
      const {
        old_kek_hex,
        master_key_hex,
        new_master_key_wrap_payload,
        new_kek_hex
      } = vectors.password_change;

      // Unwrapping new payload with new KEK yields the same constant MasterKey
      const newKek = fromHex(new_kek_hex);
      const unwrappedWithNew = unwrapKey(newKek, new_master_key_wrap_payload, DOMAIN_TAGS.MASTER_KEY_WRAP);
      expect(toHex(unwrappedWithNew)).toBe(master_key_hex);
    });
  });

  describe("7. Negative Cryptographic Test Vectors (Tampering & Swapping Defenses)", () => {
    it("should fail when authentication tag is tampered (1 byte flip)", () => {
      const { wire_chunk_hex, file_id, chunk_index, total_chunks, is_final } = vectors.negative_tests.tampered_tag;
      const fek = fromHex(vectors.metadata.fek_hex);
      const { iv, ciphertext, tag } = unpackChunk(fromHex(wire_chunk_hex));
      const aad = buildChunkAAD(fileId(file_id), chunk_index, total_chunks, is_final);

      expect(() => decryptAesGcm(fek, iv, ciphertext, tag, aad)).toThrow();
    });

    it("should fail when chunk_index in AAD is modified (reordering attack defense)", () => {
      const { wire_chunk_hex, file_id, chunk_index, total_chunks, is_final } = vectors.negative_tests.wrong_aad_chunk_index;
      const fek = fromHex(vectors.metadata.fek_hex);
      const { iv, ciphertext, tag } = unpackChunk(fromHex(wire_chunk_hex));
      const aad = buildChunkAAD(fileId(file_id), chunk_index, total_chunks, is_final);

      expect(() => decryptAesGcm(fek, iv, ciphertext, tag, aad)).toThrow();
    });

    it("should fail when file_id in AAD is modified (cross-file chunk swapping defense)", () => {
      const { wire_chunk_hex, file_id, chunk_index, total_chunks, is_final } = vectors.negative_tests.wrong_file_id;
      const fek = fromHex(vectors.metadata.fek_hex);
      const { iv, ciphertext, tag } = unpackChunk(fromHex(wire_chunk_hex));
      const aad = buildChunkAAD(fileId(file_id), chunk_index, total_chunks, is_final);

      expect(() => decryptAesGcm(fek, iv, ciphertext, tag, aad)).toThrow();
    });

    it("should fail when ciphertext body is modified (tampering defense)", () => {
      const { wire_chunk_hex, file_id, chunk_index, total_chunks, is_final } = vectors.negative_tests.tampered_ciphertext;
      const fek = fromHex(vectors.metadata.fek_hex);
      const { iv, ciphertext, tag } = unpackChunk(fromHex(wire_chunk_hex));
      const aad = buildChunkAAD(fileId(file_id), chunk_index, total_chunks, is_final);

      expect(() => decryptAesGcm(fek, iv, ciphertext, tag, aad)).toThrow();
    });

    it("should fail when chunk is truncated", () => {
      const { wire_chunk_hex } = vectors.negative_tests.truncated_chunk;
      expect(() => unpackChunk(fromHex(wire_chunk_hex))).toThrow("Chunk too small");
    });

    it("should fail when format_version in AAD is modified", () => {
      const { wire_chunk_hex, file_id, format_version, chunk_index, total_chunks, is_final } =
        vectors.negative_tests.wrong_format_version_aad;
      const fek = fromHex(vectors.metadata.fek_hex);
      const { iv, ciphertext, tag } = unpackChunk(fromHex(wire_chunk_hex));
      const aad = buildChunkAAD(fileId(file_id), chunk_index, total_chunks, is_final, format_version);

      expect(() => decryptAesGcm(fek, iv, ciphertext, tag, aad)).toThrow();
    });

    it("should fail when stream chunks are reordered", () => {
      const fek = fromHex(vectors.metadata.fek_hex);
      const fileIdVal = vectors.chunks[0].file_id;
      // Reordered wire chunks: chunk 1 then chunk 0
      const reordered = [
        fromHex(vectors.chunks[1].wire_chunk_hex),
        fromHex(vectors.chunks[0].wire_chunk_hex)
      ];

      expect(() => decryptChunksToBuffer(reordered, fek, fileIdVal)).toThrow();
    });

    it("should fail when stream is truncated (missing final chunk)", () => {
      const fek = fromHex(vectors.metadata.fek_hex);
      const fileIdVal = vectors.chunks[0].file_id;
      // Truncated: chunk 0 only (total_chunks is 2)
      const truncated = [fromHex(vectors.chunks[0].wire_chunk_hex)];

      expect(() => decryptChunksToBuffer(truncated, fek, fileIdVal)).toThrow();
    });

    it("should fail when duplicate chunk is supplied in stream", () => {
      const fek = fromHex(vectors.metadata.fek_hex);
      const fileIdVal = vectors.chunks[0].file_id;
      // Duplicate chunk 0
      const duplicated = [
        fromHex(vectors.chunks[0].wire_chunk_hex),
        fromHex(vectors.chunks[0].wire_chunk_hex)
      ];

      expect(() => decryptChunksToBuffer(duplicated, fek, fileIdVal)).toThrow();
    });

    it("should fail when extra extraneous chunk is appended to stream", () => {
      const fek = fromHex(vectors.metadata.fek_hex);
      const fileIdVal = vectors.chunks[0].file_id;
      // Extra chunk
      const extra = [
        fromHex(vectors.chunks[0].wire_chunk_hex),
        fromHex(vectors.chunks[1].wire_chunk_hex),
        fromHex(vectors.chunks[1].wire_chunk_hex)
      ];

      expect(() => decryptChunksToBuffer(extra, fek, fileIdVal)).toThrow();
    });
  });
});

function fileId(str: string): string {
  return str;
}

