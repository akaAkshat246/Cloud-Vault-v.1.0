import pino from 'pino';

const SENSITIVE_PATHS = [
  'password',
  '*.password',
  '*.*.password',
  'authKey',
  '*.authKey',
  '*.*.authKey',
  'auth_key',
  '*.auth_key',
  '*.*.auth_key',
  'token',
  '*.token',
  '*.*.token',
  'refreshToken',
  '*.refreshToken',
  '*.*.refreshToken',
  'authorization',
  '*.authorization',
  'headers.authorization',
  'headers.cookie',
  'cookie',
  '*.cookie',
  'key',
  '*.key',
  '*.*.key',
  'masterKey',
  '*.masterKey',
  'kek',
  '*.kek',
  'fek',
  '*.fek',
  'ciphertext',
  '*.ciphertext',
  '*.*.ciphertext',
  'encryptedMasterKey',
  '*.encryptedMasterKey',
  'encrypted_master_key',
  '*.encrypted_master_key',
  'encryptedRecoveryKek',
  '*.encryptedRecoveryKek',
  'encrypted_recovery_kek',
  '*.encrypted_recovery_kek',
  'mnemonic',
  '*.mnemonic'
];

export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'silent' : 'info'),
  redact: {
    paths: SENSITIVE_PATHS,
    censor: '[REDACTED]'
  },
  formatters: {
    level: (label) => ({ level: label })
  },
  timestamp: pino.stdTimeFunctions.isoTime
});

