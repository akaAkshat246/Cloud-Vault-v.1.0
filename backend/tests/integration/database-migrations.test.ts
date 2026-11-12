import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AppDataSource } from '../../src/database/data-source.js';
import { seedPlans } from '../../src/database/seeds/plan.seed.js';
import { Plan, User, Folder, FileEntity, UploadSession, RefreshToken } from '../../src/database/entities/index.js';

describe('Real PostgreSQL Integration - Migrations & Schema', () => {
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  it('should run migrations UP cleanly', async () => {
    const ranMigrations = await AppDataSource.runMigrations();
    expect(ranMigrations).toBeDefined();
  });

  it('should revert migrations DOWN cleanly (undo all)', async () => {
    // Undo SchemaRefinements
    await AppDataSource.undoLastMigration();
    // Undo InitialSchema
    await AppDataSource.undoLastMigration();

    // Verify tables are dropped
    const queryRunner = AppDataSource.createQueryRunner();
    const hasUsers = await queryRunner.hasTable('users');
    const hasFiles = await queryRunner.hasTable('files');
    await queryRunner.release();

    expect(hasUsers).toBe(false);
    expect(hasFiles).toBe(false);
  });

  it('should re-run migrations UP cleanly (idempotence verification)', async () => {
    const reRan = await AppDataSource.runMigrations();
    expect(reRan.length).toBe(2);
    expect(reRan[0].name).toContain('InitialSchema');
    expect(reRan[1].name).toContain('SchemaRefinements');

    // Verify all tables exist
    const queryRunner = AppDataSource.createQueryRunner();
    expect(await queryRunner.hasTable('plans')).toBe(true);
    expect(await queryRunner.hasTable('users')).toBe(true);
    expect(await queryRunner.hasTable('folders')).toBe(true);
    expect(await queryRunner.hasTable('files')).toBe(true);
    expect(await queryRunner.hasTable('upload_sessions')).toBe(true);
    expect(await queryRunner.hasTable('refresh_tokens')).toBe(true);
    expect(await queryRunner.hasTable('share_links')).toBe(true);
    expect(await queryRunner.hasTable('sync_logs')).toBe(true);
    expect(await queryRunner.hasTable('audit_logs')).toBe(true);
    await queryRunner.release();
  });

  it('should seed plans cleanly and verify constraints', async () => {
    await seedPlans(AppDataSource);
    const planRepo = AppDataSource.getRepository(Plan);
    const plans = await planRepo.find();
    expect(plans.length).toBe(3);
    const freePlan = plans.find((p) => p.name === 'Free');
    expect(freePlan).toBeDefined();
    expect(Number(freePlan!.quota_bytes)).toBe(5 * 1024 * 1024 * 1024);
  });
});
