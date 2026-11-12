/**
 * Dedicated Crypto Web Worker
 *
 * Runs computationally intensive cryptographic operations off the main UI thread:
 * - Argon2id memory-hard key derivation (m=64MiB, t=3, p=1)
 * - Multi-part file chunk AES-256-GCM encryption & decryption
 * - MasterKey and FEK envelope wrapping & unwrapping
 */

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
  fromHex,
  toHex,
  DOMAIN_TAGS,
} from '../crypto/web-crypto-engine.js';

self.onmessage = async (e: MessageEvent) => {
  const { id, action, payload } = e.data;

  try {
    let result: any;

    switch (action) {
      case 'DERIVE_KEYS': {
        const { password, saltHex, iterations, memoryBytes } = payload;
        const salt = fromHex(saltHex);
        const { rawPRK, authKey, kek } = await deriveMasterKeys(password, salt, {
          iterations,
          memoryBytes,
        });
        result = {
          rawPrkHex: toHex(rawPRK),
          authKeyHex: toHex(authKey),
          kekHex: toHex(kek),
        };
        break;
      }

      case 'UNWRAP_MASTER_KEY': {
        const { kekHex, wrapPayload, aadDomain } = payload;
        const kek = fromHex(kekHex);
        const masterKeyBytes = await unwrapKey(kek, wrapPayload, aadDomain || DOMAIN_TAGS.MASTER_KEY_WRAP);
        result = { masterKeyHex: toHex(masterKeyBytes) };
        break;
      }

      case 'WRAP_MASTER_KEY': {
        const { kekHex, masterKeyHex, aadDomain } = payload;
        const kek = fromHex(kekHex);
        const masterKey = fromHex(masterKeyHex);
        const wrapped = await wrapKey(kek, masterKey, aadDomain || DOMAIN_TAGS.MASTER_KEY_WRAP);
        result = { wrapped };
        break;
      }

      case 'ENCRYPT_METADATA': {
        const { masterKeyHex, plaintext } = payload;
        const masterKey = fromHex(masterKeyHex);
        const encrypted = await encryptMetadata(masterKey, plaintext);
        result = encrypted;
        break;
      }

      case 'DECRYPT_METADATA': {
        const { masterKeyHex, ciphertext, nonce } = payload;
        const masterKey = fromHex(masterKeyHex);
        const plaintext = await decryptMetadata(masterKey, ciphertext, nonce);
        result = { plaintext };
        break;
      }

      case 'ENCRYPT_CHUNK': {
        const { fekHex, fileId, chunkIndex, totalChunks, isFinal, plaintextChunk, formatVersion } = payload;
        const fek = fromHex(fekHex);
        const wireChunk = await encryptChunk(
          fek,
          fileId,
          chunkIndex,
          totalChunks,
          isFinal,
          plaintextChunk,
          undefined,
          formatVersion
        );
        // Transfer ArrayBuffer back to caller for zero-copy efficiency
        self.postMessage(
          { id, success: true, result: { wireChunk } },
          { transfer: [wireChunk.buffer] }
        );
        return;
      }

      case 'DECRYPT_CHUNK': {
        const { fekHex, fileId, chunkIndex, totalChunks, isFinal, framedWireChunk, formatVersion } = payload;
        const fek = fromHex(fekHex);
        const plaintextChunk = await decryptChunk(
          fek,
          fileId,
          chunkIndex,
          totalChunks,
          isFinal,
          framedWireChunk,
          formatVersion
        );
        self.postMessage(
          { id, success: true, result: { plaintextChunk } },
          { transfer: [plaintextChunk.buffer] }
        );
        return;
      }

      case 'GENERATE_MNEMONIC': {
        const mnemonic = await generateMnemonic();
        result = { mnemonic };
        break;
      }

      case 'VALIDATE_MNEMONIC': {
        const isValid = await validateMnemonic(payload.mnemonic);
        result = { isValid };
        break;
      }

      case 'WRAP_RECOVERY': {
        const { masterKeyHex, mnemonic } = payload;
        const masterKey = fromHex(masterKeyHex);
        const wrapped = await wrapMasterKeyWithRecovery(masterKey, mnemonic);
        result = { wrapped };
        break;
      }

      case 'UNWRAP_RECOVERY': {
        const { mnemonic, wrapPayload } = payload;
        const masterKeyBytes = await unwrapMasterKeyWithRecovery(mnemonic, wrapPayload);
        result = { masterKeyHex: toHex(masterKeyBytes) };
        break;
      }

      default:
        throw new Error(`Unknown worker action: ${action}`);
    }

    self.postMessage({ id, success: true, result });
  } catch (error: any) {
    self.postMessage({ id, success: false, error: error?.message || 'Crypto worker operation failed' });
  }
};

