import { describe, it, expect } from 'vitest';
import pino from 'pino';

describe('Logger Redaction Invariants', () => {
  it('should redact sensitive cryptographic and credential fields', async () => {
    let loggedData = '';
    const destination = {
      write(msg: string) {
        loggedData += msg;
      }
    };

    const testLogger = pino(
      {
        redact: {
          paths: [
            'password',
            'authKey',
            'auth_key',
            'token',
            'refreshToken',
            'authorization',
            'headers.authorization',
            'masterKey',
            'kek',
            'fek',
            'ciphertext',
            'encryptedMasterKey',
            'encrypted_master_key',
            'encryptedRecoveryKek'
          ],
          censor: '[REDACTED]'
        }
      },
      destination
    );

    testLogger.info({
      user: 'alice@example.com',
      password: 'super-secret-password-123',
      authKey: '7455e977c73a84b5',
      auth_key: '7455e977c73a84b5',
      token: 'jwt.token.here',
      refreshToken: 'refresh.token.here',
      masterKey: '0123456789abcdef',
      kek: 'deadbeef1234',
      fek: 'cafebabe5678',
      ciphertext: 'opaque-aes-gcm-ciphertext-string',
      headers: {
        authorization: 'Bearer secret-jwt-token'
      }
    });

    const parsed = JSON.parse(loggedData);
    expect(parsed.user).toBe('alice@example.com');
    expect(parsed.password).toBe('[REDACTED]');
    expect(parsed.authKey).toBe('[REDACTED]');
    expect(parsed.auth_key).toBe('[REDACTED]');
    expect(parsed.token).toBe('[REDACTED]');
    expect(parsed.refreshToken).toBe('[REDACTED]');
    expect(parsed.masterKey).toBe('[REDACTED]');
    expect(parsed.kek).toBe('[REDACTED]');
    expect(parsed.fek).toBe('[REDACTED]');
    expect(parsed.ciphertext).toBe('[REDACTED]');
    expect(parsed.headers.authorization).toBe('[REDACTED]');
  });
});

