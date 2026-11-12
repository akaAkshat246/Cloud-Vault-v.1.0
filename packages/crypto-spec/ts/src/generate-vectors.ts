/**
 * Test Vector Generator for CloudVault Cryptographic Specification v1
 * Generates packages/crypto-spec/test-vectors/v1.json
 */

import fs from "node:fs";
import path from "node:path";
import { initCrypto, deriveMasterKeys } from "./kdf.js";
import { encryptAesGcm, decryptAesGcm, wrapKey, unwrapKey } from "./cipher.js";
import { buildChunkAAD, packChunk, unpackChunk } from "./framing.js";
import { encryptMetadata, decryptMetadata } from "./metadata.js";
import { generateMnemonic, mnemonicToRecoveryKey, wrapMasterKeyWithRecovery } from "./recovery.js";
import { toHex, fromHex, toBase64, fromBase64, stringToBytes } from "./utils.js";
import { DOMAIN_TAGS, FORMAT_VERSION } from "./constants.js";

async function main() {
  await initCrypto();
  console.log("Generating CloudVault v1 Cryptographic Test Vectors...");

  // 1. KDF Test Vectors
  const password = "CorrectHorseBatteryStaple2026!";
  const saltHex = "0102030405060708090a0b0c0d0e0f10";
  const salt = fromHex(saltHex);
  const kdfBundle = await deriveMasterKeys(password, salt);

  const kdfVector = {
    description: "Argon2id (m=64MiB, t=3, p=1) + HKDF-SHA256 Dual-Key Derivation",
    password,
    salt_hex: saltHex,
    params: {
      algorithm: "argon2id",
      version: "1.0",
      memory_kib: 65536,
      iterations: 3,
      parallelism: 1,
      key_length: 64
    },
    raw_prk_hex: toHex(kdfBundle.raw),
    auth_key_hex: toHex(kdfBundle.authKey),
    kek_hex: toHex(kdfBundle.kek)
  };

  // 2. Master Key & Key Wrapping Vector
  const masterKeyHex = "11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff";
  const masterKey = fromHex(masterKeyHex);
  const wrapIvHex = "a1b2c3d4e5f60718293a4b5c";
  const wrapIv = fromHex(wrapIvHex);
  const masterKeyWrapPayload = wrapKey(kdfBundle.kek, masterKey, DOMAIN_TAGS.MASTER_KEY_WRAP, wrapIv);

  // Verify unwrapping
  const unwrappedMaster = unwrapKey(kdfBundle.kek, masterKeyWrapPayload, DOMAIN_TAGS.MASTER_KEY_WRAP);
  if (toHex(unwrappedMaster) !== masterKeyHex) {
    throw new Error("Master key wrap/unwrap self-test failed!");
  }

  const masterKeyWrapVector = {
    description: "Master Key Envelope Wrapping using KEK (AES-256-GCM)",
    kek_hex: toHex(kdfBundle.kek),
    master_key_hex: masterKeyHex,
    wrap_iv_hex: wrapIvHex,
    aad_string: DOMAIN_TAGS.MASTER_KEY_WRAP,
    payload: masterKeyWrapPayload
  };

  // 3. Chunk Encryption Vectors (Multi-chunk File)
  const fekHex = "f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff00112233445566778899aabbccddeeff";
  const fek = fromHex(fekHex);
  const fileId = "c9bf9e57-1685-4c89-bafb-ff5af830be8a";

  // Chunk 0 (non-final)
  const chunk0Plaintext = stringToBytes("CloudVault Chunk 0 Plaintext Payload - Zero Knowledge Cloud Storage 2026! Multi-chunk block 0.");
  const chunk0IvHex = "102030405060708090a0b0c0";
  const chunk0Iv = fromHex(chunk0IvHex);
  const chunk0Aad = buildChunkAAD(fileId, 0, 2, false);
  const chunk0Enc = encryptAesGcm(fek, chunk0Plaintext, chunk0Aad, chunk0Iv);
  const chunk0Wire = packChunk(chunk0Enc.iv, chunk0Enc.ciphertext, chunk0Enc.tag);

  // Chunk 1 (final)
  const chunk1Plaintext = stringToBytes("CloudVault Chunk 1 Plaintext Payload - Final block ending zero-knowledge stream test.");
  const chunk1IvHex = "112131415161718191a1b1c1";
  const chunk1Iv = fromHex(chunk1IvHex);
  const chunk1Aad = buildChunkAAD(fileId, 1, 2, true);
  const chunk1Enc = encryptAesGcm(fek, chunk1Plaintext, chunk1Aad, chunk1Iv);
  const chunk1Wire = packChunk(chunk1Enc.iv, chunk1Enc.ciphertext, chunk1Enc.tag);

  const chunkVectors = [
    {
      description: "Chunk 0 (Non-final chunk)",
      file_id: fileId,
      chunk_index: 0,
      total_chunks: 2,
      is_final: false,
      aad_hex: toHex(chunk0Aad),
      plaintext_ascii: Buffer.from(chunk0Plaintext).toString("utf8"),
      plaintext_hex: toHex(chunk0Plaintext),
      iv_hex: chunk0IvHex,
      ciphertext_hex: toHex(chunk0Enc.ciphertext),
      tag_hex: toHex(chunk0Enc.tag),
      wire_chunk_hex: toHex(chunk0Wire),
      wire_chunk_base64: toBase64(chunk0Wire)
    },
    {
      description: "Chunk 1 (Final chunk)",
      file_id: fileId,
      chunk_index: 1,
      total_chunks: 2,
      is_final: true,
      aad_hex: toHex(chunk1Aad),
      plaintext_ascii: Buffer.from(chunk1Plaintext).toString("utf8"),
      plaintext_hex: toHex(chunk1Plaintext),
      iv_hex: chunk1IvHex,
      ciphertext_hex: toHex(chunk1Enc.ciphertext),
      tag_hex: toHex(chunk1Enc.tag),
      wire_chunk_hex: toHex(chunk1Wire),
      wire_chunk_base64: toBase64(chunk1Wire)
    }
  ];

  // 4. Metadata Encryption Vector
  const metaPlaintext = {
    name: "tax_return_2026.pdf",
    mime: "application/pdf",
    size: 10485760,
    lastModified: 1773446400000
  };
  const metaIvHex = "99887766554433221100aabb";
  const metaIv = fromHex(metaIvHex);
  const metaPayload = encryptMetadata(fek, fileId, metaPlaintext, metaIv);

  const metaVector = {
    description: "Client-Side Zero-Knowledge Metadata Encryption (ADR-004)",
    fek_hex: fekHex,
    file_id: fileId,
    metadata_plaintext: metaPlaintext,
    iv_hex: metaIvHex,
    payload: metaPayload
  };

  // 5. BIP-39 Recovery Kit Vector
  const entropyHex = "e4b6555129239f64724e0732d190e971e4b6555129239f64724e0732d190e971";
  const entropy = fromHex(entropyHex);
  const mnemonic = generateMnemonic(entropy);
  const recoveryKey = mnemonicToRecoveryKey(mnemonic);
  const recovIvHex = "fedcba9876543210fedcba98";
  const recovIv = fromHex(recovIvHex);
  const recovPayload = wrapMasterKeyWithRecovery(masterKey, mnemonic, recovIv);

  const recoveryVector = {
    description: "BIP-39 24-Word Emergency Recovery Kit (ADR-007)",
    entropy_hex: entropyHex,
    mnemonic,
    recovery_key_hex: toHex(recoveryKey),
    master_key_hex: masterKeyHex,
    wrap_iv_hex: recovIvHex,
    payload: recovPayload
  };

  // 6. Password Change Re-key Vector
  const newPassword = "SuperSecretNewPassword2027#$";
  const newSaltHex = "a0a1a2a3a4a5a6a7a8a9aaabacadaeaf";
  const newSalt = fromHex(newSaltHex);
  const newKdfBundle = await deriveMasterKeys(newPassword, newSalt);
  const newWrapIvHex = "334455667788990011223344";
  const newWrapIv = fromHex(newWrapIvHex);
  const newMasterKeyWrapPayload = wrapKey(newKdfBundle.kek, masterKey, DOMAIN_TAGS.MASTER_KEY_WRAP, newWrapIv);

  const passwordChangeVector = {
    description: "Password Change Re-keying (MasterKey unwrapped with Old KEK, re-wrapped with New KEK)",
    old_kek_hex: toHex(kdfBundle.kek),
    new_password: newPassword,
    new_salt_hex: newSaltHex,
    new_auth_key_hex: toHex(newKdfBundle.authKey),
    new_kek_hex: toHex(newKdfBundle.kek),
    master_key_hex: masterKeyHex,
    new_wrap_iv_hex: newWrapIvHex,
    new_master_key_wrap_payload: newMasterKeyWrapPayload
  };

  // 7. Negative Vectors
  const negativeVectors = {
    tampered_tag: {
      description: "Chunk with 1 byte modified in authentication tag (must fail GCM verification)",
      wire_chunk_hex: toHex(chunk0Wire).slice(0, -2) + "00", // Alter last byte of tag
      file_id: fileId,
      chunk_index: 0,
      total_chunks: 2,
      is_final: false,
      expected_error: "AES-GCM decryption failed"
    },
    wrong_aad_chunk_index: {
      description: "Chunk decrypted with wrong chunk_index in AAD (swap detection)",
      wire_chunk_hex: toHex(chunk0Wire),
      file_id: fileId,
      chunk_index: 1, // Wrong index (0 encrypted, trying to decrypt as 1)
      total_chunks: 2,
      is_final: false,
      expected_error: "AES-GCM decryption failed"
    },
    wrong_file_id: {
      description: "Chunk decrypted with wrong file_id in AAD (cross-file chunk swap detection)",
      wire_chunk_hex: toHex(chunk0Wire),
      file_id: "00000000-0000-0000-0000-000000000000",
      chunk_index: 0,
      total_chunks: 2,
      is_final: false,
      expected_error: "AES-GCM decryption failed"
    },
    tampered_ciphertext: {
      description: "Chunk with 1 bit modified in ciphertext body",
      wire_chunk_hex: toHex(chunk0Wire).slice(0, 30) + "ff" + toHex(chunk0Wire).slice(32),
      file_id: fileId,
      chunk_index: 0,
      total_chunks: 2,
      is_final: false,
      expected_error: "AES-GCM decryption failed"
    },
    truncated_chunk: {
      description: "Chunk truncated before end of tag",
      wire_chunk_hex: toHex(chunk0Wire).slice(0, 40),
      expected_error: "Chunk too small"
    },
    wrong_password_kdf: {
      description: "Attempting to unwrap MasterKey with KEK derived from wrong password",
      wrong_password: "WrongPassword999!",
      salt_hex: saltHex,
      expected_error: "AES-GCM decryption failed"
    }
  };

  const fullSuite = {
    format_version: FORMAT_VERSION,
    specification: "CloudVault Cryptographic Specification v1.0",
    created_at: new Date().toISOString(),
    kdf: kdfVector,
    master_key_wrap: masterKeyWrapVector,
    chunks: chunkVectors,
    metadata: metaVector,
    recovery: recoveryVector,
    password_change: passwordChangeVector,
    negative_tests: negativeVectors
  };

  const outputPath = path.resolve("packages/crypto-spec/test-vectors/v1.json");
  fs.writeFileSync(outputPath, JSON.stringify(fullSuite, null, 2), "utf8");
  console.log(`Saved comprehensive test vectors to ${outputPath} (${fs.statSync(outputPath).size} bytes)`);
}

main().catch(err => {
  console.error("Error generating vectors:", err);
  process.exit(1);
});

