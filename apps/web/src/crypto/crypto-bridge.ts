/**
 * Cryptographic Bridge Dispatcher
 *
 * Bridges React UI components to the background Web Worker with automatic
 * promise tracking, transferables, and direct-execution fallback for testing.
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
} from './web-crypto-engine.js';

class CryptoBridge {
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, { resolve: (res: any) => void; reject: (err: any) => void }>();
  private requestCounter = 0;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (typeof window !== 'undefined' && typeof window.Worker !== 'undefined') {
      try {
        // Vite worker instantiation
        this.worker = new Worker(new URL('../workers/crypto.worker.ts', import.meta.url), {
          type: 'module',
        });

        this.worker.onmessage = (e: MessageEvent) => {
          const { id, success, result, error } = e.data;
          const handler = this.pendingRequests.get(id);
          if (handler) {
            this.pendingRequests.delete(id);
            if (success) {
              handler.resolve(result);
            } else {
              handler.reject(new Error(error));
            }
          }
        };

        this.worker.onerror = (err) => {
          console.error('[CryptoBridge] Worker uncaught error:', err);
        };
      } catch (e) {
        console.warn('[CryptoBridge] Worker creation failed; falling back to main-thread crypto:', e);
        this.worker = null;
      }
    }
  }

  private execute<T>(action: string, payload: any, transfer: Transferable[] = []): Promise<T> {
    const id = `req_${++this.requestCounter}_${Date.now()}`;

    if (this.worker) {
      return new Promise<T>((resolve, reject) => {
        this.pendingRequests.set(id, { resolve, reject });
        this.worker!.postMessage({ id, action, payload }, transfer);
      });
    }

    // Direct fallback (e.g. Node tests or workers blocked)
    return this.fallbackExecute<T>(action, payload);
  }

  private async fallbackExecute<T>(action: string, payload: any): Promise<T> {
    switch (action) {
      case 'DERIVE_KEYS': {
        const { password, saltHex, iterations, memoryBytes } = payload;
        const { rawPRK, authKey, kek } = await deriveMasterKeys(password, fromHex(saltHex), {
          iterations,
          memoryBytes,
        });
        return {
          rawPrkHex: toHex(rawPRK),
          authKeyHex: toHex(authKey),
          kekHex: toHex(kek),
        } as T;
      }
      case 'UNWRAP_MASTER_KEY': {
        const { kekHex, wrapPayload, aadDomain } = payload;
        const masterKeyBytes = await unwrapKey(fromHex(kekHex), wrapPayload, aadDomain || DOMAIN_TAGS.MASTER_KEY_WRAP);
        return { masterKeyHex: toHex(masterKeyBytes) } as T;
      }
      case 'WRAP_MASTER_KEY': {
        const { kekHex, masterKeyHex, aadDomain } = payload;
        const wrapped = await wrapKey(fromHex(kekHex), fromHex(masterKeyHex), aadDomain || DOMAIN_TAGS.MASTER_KEY_WRAP);
        return { wrapped } as T;
      }
      case 'ENCRYPT_METADATA': {
        const { masterKeyHex, plaintext } = payload;
        const res = await encryptMetadata(fromHex(masterKeyHex), plaintext);
        return res as T;
      }
      case 'DECRYPT_METADATA': {
        const { masterKeyHex, ciphertext, nonce } = payload;
        const plaintext = await decryptMetadata(fromHex(masterKeyHex), ciphertext, nonce);
        return { plaintext } as T;
      }
      case 'ENCRYPT_CHUNK': {
        const { fekHex, fileId, chunkIndex, totalChunks, isFinal, plaintextChunk, formatVersion } = payload;
        const wireChunk = await encryptChunk(
          fromHex(fekHex),
          fileId,
          chunkIndex,
          totalChunks,
          isFinal,
          plaintextChunk,
          undefined,
          formatVersion
        );
        return { wireChunk } as T;
      }
      case 'DECRYPT_CHUNK': {
        const { fekHex, fileId, chunkIndex, totalChunks, isFinal, framedWireChunk, formatVersion } = payload;
        const plaintextChunk = await decryptChunk(
          fromHex(fekHex),
          fileId,
          chunkIndex,
          totalChunks,
          isFinal,
          framedWireChunk,
          formatVersion
        );
        return { plaintextChunk } as T;
      }
      case 'GENERATE_MNEMONIC': {
        const mnemonic = await generateMnemonic();
        return { mnemonic } as T;
      }
      case 'VALIDATE_MNEMONIC': {
        const isValid = await validateMnemonic(payload.mnemonic);
        return { isValid } as T;
      }
      case 'WRAP_RECOVERY': {
        const { masterKeyHex, mnemonic } = payload;
        const wrapped = await wrapMasterKeyWithRecovery(fromHex(masterKeyHex), mnemonic);
        return { wrapped } as T;
      }
      case 'UNWRAP_RECOVERY': {
        const { mnemonic, wrapPayload } = payload;
        const masterKeyBytes = await unwrapMasterKeyWithRecovery(mnemonic, wrapPayload);
        return { masterKeyHex: toHex(masterKeyBytes) } as T;
      }
      default:
        throw new Error(`Unsupported fallback action: ${action}`);
    }
  }

  // High-Level API Methods

  public async deriveKeys(
    password: string,
    saltHex: string,
    options?: { iterations?: number; memoryBytes?: number }
  ): Promise<{ rawPrkHex: string; authKeyHex: string; kekHex: string }> {
    return this.execute('DERIVE_KEYS', {
      password,
      saltHex,
      iterations: options?.iterations,
      memoryBytes: options?.memoryBytes,
    });
  }

  public async unwrapMasterKey(kekHex: string, wrapPayload: any, aadDomain?: string): Promise<string> {
    const res: any = await this.execute('UNWRAP_MASTER_KEY', { kekHex, wrapPayload, aadDomain });
    return res.masterKeyHex;
  }

  public async wrapMasterKey(kekHex: string, masterKeyHex: string, aadDomain?: string): Promise<any> {
    const res: any = await this.execute('WRAP_MASTER_KEY', { kekHex, masterKeyHex, aadDomain });
    return res.wrapped;
  }

  public async encryptMetadata(masterKeyHex: string, plaintext: string): Promise<{ ciphertext: string; nonce: string }> {
    return this.execute('ENCRYPT_METADATA', { masterKeyHex, plaintext });
  }

  public async decryptMetadata(masterKeyHex: string, ciphertext: string, nonce: string): Promise<string> {
    const res: any = await this.execute('DECRYPT_METADATA', { masterKeyHex, ciphertext, nonce });
    return res.plaintext;
  }

  public async encryptChunk(
    fekHex: string,
    fileId: string,
    chunkIndex: number,
    totalChunks: number,
    isFinal: boolean,
    plaintextChunk: Uint8Array,
    formatVersion?: number
  ): Promise<Uint8Array> {
    const res: any = await this.execute(
      'ENCRYPT_CHUNK',
      { fekHex, fileId, chunkIndex, totalChunks, isFinal, plaintextChunk, formatVersion },
      [plaintextChunk.buffer]
    );
    return res.wireChunk;
  }

  public async decryptChunk(
    fekHex: string,
    fileId: string,
    chunkIndex: number,
    totalChunks: number,
    isFinal: boolean,
    framedWireChunk: Uint8Array,
    formatVersion?: number
  ): Promise<Uint8Array> {
    const res: any = await this.execute(
      'DECRYPT_CHUNK',
      { fekHex, fileId, chunkIndex, totalChunks, isFinal, framedWireChunk, formatVersion },
      [framedWireChunk.buffer]
    );
    return res.plaintextChunk;
  }

  public async generateMnemonic(): Promise<string> {
    const res: any = await this.execute('GENERATE_MNEMONIC', {});
    return res.mnemonic;
  }

  public async validateMnemonic(mnemonic: string): Promise<boolean> {
    const res: any = await this.execute('VALIDATE_MNEMONIC', { mnemonic });
    return res.isValid;
  }

  public async wrapMasterKeyWithRecovery(masterKeyHex: string, mnemonic: string): Promise<any> {
    const res: any = await this.execute('WRAP_RECOVERY', { masterKeyHex, mnemonic });
    return res.wrapped;
  }

  public async unwrapMasterKeyWithRecovery(mnemonic: string, wrapPayload: any): Promise<string> {
    const res: any = await this.execute('UNWRAP_RECOVERY', { mnemonic, wrapPayload });
    return res.masterKeyHex;
  }
}

export const cryptoBridge = new CryptoBridge();

