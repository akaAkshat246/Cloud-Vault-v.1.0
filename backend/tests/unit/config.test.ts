import { describe, it, expect } from 'vitest';
import { env } from '../../src/config/env.js';

describe('Backend Environment Configuration', () => {
  it('should load default port and host', () => {
    expect(env.PORT).toBeDefined();
    expect(typeof env.PORT).toBe('number');
    expect(env.HOST).toBeDefined();
  });

  it('should load database defaults', () => {
    expect(env.DB_HOST).toBeDefined();
    expect(env.DB_PORT).toBe(5432);
    expect(env.DB_USER).toBeDefined();
    expect(env.DB_NAME).toBeDefined();
  });

  it('should enforce S3 storage defaults', () => {
    expect(env.S3_BUCKET_NAME).toBe('cloudvault-storage');
    expect(env.S3_PRESIGNED_EXPIRATION_SECONDS).toBe(900);
  });
});

