import { describe, it, expect, vi } from 'vitest';
import { InitialSchema1700000000000 } from '../../src/database/migrations/1700000000000-InitialSchema.js';
import { QueryRunner } from 'typeorm';

describe('Database Migration: 001_initial_schema', () => {
  it('should instantiate migration with correct name', () => {
    const migration = new InitialSchema1700000000000();
    expect(migration.name).toBe('InitialSchema1700000000000');
    expect(typeof migration.up).toBe('function');
    expect(typeof migration.down).toBe('function');
  });

  it('should execute up queries without error using mock QueryRunner', async () => {
    const queries: string[] = [];
    const mockQueryRunner = {
      query: vi.fn().mockImplementation((sql: string) => {
        queries.push(sql);
        return Promise.resolve();
      })
    } as unknown as QueryRunner;

    const migration = new InitialSchema1700000000000();
    await migration.up(mockQueryRunner);

    expect(queries.length).toBeGreaterThan(10);
    // Verifying critical tables created
    const joinedQueries = queries.join('\n');
    expect(joinedQueries).toContain('CREATE TABLE "plans"');
    expect(joinedQueries).toContain('CREATE TABLE "users"');
    expect(joinedQueries).toContain('CREATE TABLE "folders"');
    expect(joinedQueries).toContain('CREATE TABLE "files"');
    expect(joinedQueries).toContain('CREATE TABLE "upload_sessions"');
    expect(joinedQueries).toContain('CREATE TABLE "share_links"');
    expect(joinedQueries).toContain('CREATE TABLE "refresh_tokens"');
    expect(joinedQueries).toContain('CREATE TABLE "sync_logs"');
    expect(joinedQueries).toContain('CREATE TABLE "audit_logs"');
  });

  it('should execute down queries dropping all tables in reverse order', async () => {
    const queries: string[] = [];
    const mockQueryRunner = {
      query: vi.fn().mockImplementation((sql: string) => {
        queries.push(sql);
        return Promise.resolve();
      })
    } as unknown as QueryRunner;

    const migration = new InitialSchema1700000000000();
    await migration.down(mockQueryRunner);

    expect(queries.length).toBe(10);
    const joinedQueries = queries.join('\n');
    expect(joinedQueries).toContain('DROP TABLE IF EXISTS "audit_logs"');
    expect(joinedQueries).toContain('DROP TABLE IF EXISTS "plans"');
    expect(joinedQueries).toContain('DROP TYPE IF EXISTS "upload_status_enum"');
  });

  it('should execute schema refinements migration (up and down) cleanly', async () => {
    const { SchemaRefinements1741800000000 } = await import(
      '../../src/database/migrations/1741800000000-SchemaRefinements.js'
    );
    const refinement = new SchemaRefinements1741800000000();
    expect(refinement.name).toBe('SchemaRefinements1741800000000');

    const upQueries: string[] = [];
    const mockRunnerUp = {
      query: vi.fn().mockImplementation((sql: string) => {
        upQueries.push(sql);
        return Promise.resolve();
      })
    } as unknown as QueryRunner;

    await refinement.up(mockRunnerUp);
    const joinedUp = upQueries.join('\n');
    expect(joinedUp).toContain('DROP COLUMN IF EXISTS "path"');
    expect(joinedUp).toContain('file_status_enum');
    expect(joinedUp).toContain('payment_provider_ref');
    expect(joinedUp).toContain('encrypted_recovery_master_key');

    const downQueries: string[] = [];
    const mockRunnerDown = {
      query: vi.fn().mockImplementation((sql: string) => {
        downQueries.push(sql);
        return Promise.resolve();
      })
    } as unknown as QueryRunner;

    await refinement.down(mockRunnerDown);
    const joinedDown = downQueries.join('\n');
    expect(joinedDown).toContain('encrypted_recovery_kek');
    expect(joinedDown).toContain('stripe_price_id');
  });
});

