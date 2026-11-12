import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('Server Skeleton & Health Probes', () => {
  it('GET /health returns 200 and liveness status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
    expect(typeof res.body.uptime).toBe('number');
  });

  it('GET /ready returns checks structure (200 or 503 in uninitialized test environment)', async () => {
    const res = await request(app).get('/ready');
    expect([200, 503]).toContain(res.status);
    expect(res.body.checks).toBeDefined();
    expect(res.body.checks).toHaveProperty('database');
    expect(res.body.checks).toHaveProperty('storage');
  });

  it('GET /api/v1/folders returns 401 Unauthorized without auth token', async () => {
    const res = await request(app).get('/api/v1/folders');
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/v1/shares/test returns 501 Not Implemented (M7 stub)', async () => {
    const res = await request(app).get('/api/v1/shares/test');
    expect(res.status).toBe(501);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_IMPLEMENTED');
  });

  it('GET /unknown-path returns 404 Not Found in standard envelope', async () => {
    const res = await request(app).get('/api/v1/some-non-existent-route');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

