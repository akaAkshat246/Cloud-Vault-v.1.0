import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Enable uuid-ossp extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // 2. Create UploadStatus enum
    await queryRunner.query(`
      CREATE TYPE "upload_status_enum" AS ENUM ('PENDING', 'UPLOADING', 'COMPLETED', 'ABORTED');
    `);

    // 3. Create 'plans' table
    await queryRunner.query(`
      CREATE TABLE "plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(64) NOT NULL,
        "quota_bytes" bigint NOT NULL,
        "price_inr" integer NOT NULL,
        "stripe_price_id" varchar(128),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_plans_name" UNIQUE ("name"),
        CONSTRAINT "PK_plans_id" PRIMARY KEY ("id")
      );
    `);

    // 4. Create 'users' table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" varchar(255) NOT NULL,
        "auth_key_hash" varchar(255) NOT NULL,
        "salt" varchar(64) NOT NULL,
        "kdf_version" varchar(32) NOT NULL DEFAULT '1.0',
        "kdf_params" jsonb NOT NULL DEFAULT '{"m": 65536, "t": 3, "p": 1}'::jsonb,
        "encrypted_master_key" text NOT NULL,
        "master_key_nonce" varchar(32) NOT NULL,
        "encrypted_recovery_kek" text NOT NULL,
        "recovery_nonce" varchar(32) NOT NULL,
        "storage_used_bytes" bigint NOT NULL DEFAULT 0,
        "storage_quota_bytes" bigint NOT NULL DEFAULT 5368709120,
        "plan_id" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_users_plan_id" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE SET NULL
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email");`);

    // 5. Create 'folders' table
    await queryRunner.query(`
      CREATE TABLE "folders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "parent_id" uuid,
        "encrypted_name" text NOT NULL,
        "name_nonce" varchar(32) NOT NULL,
        "path" varchar(1024) NOT NULL,
        "is_trashed" boolean NOT NULL DEFAULT false,
        "trashed_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_folders_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_folders_user_path" UNIQUE ("user_id", "path"),
        CONSTRAINT "FK_folders_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_folders_parent_id" FOREIGN KEY ("parent_id") REFERENCES "folders"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_folders_user_id" ON "folders" ("user_id");`);
    await queryRunner.query(`CREATE INDEX "IDX_folders_parent_id" ON "folders" ("parent_id");`);

    // 6. Create 'files' table
    await queryRunner.query(`
      CREATE TABLE "files" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "folder_id" uuid,
        "encrypted_name" text NOT NULL,
        "name_nonce" varchar(32) NOT NULL,
        "encrypted_fek" text NOT NULL,
        "fek_nonce" varchar(32) NOT NULL,
        "size_bytes" bigint NOT NULL,
        "chunk_count" integer NOT NULL,
        "mime_type_encrypted" text,
        "is_trashed" boolean NOT NULL DEFAULT false,
        "trashed_at" TIMESTAMP WITH TIME ZONE,
        "s3_key" varchar(512) NOT NULL,
        "is_upload_complete" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_files_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_files_s3_key" UNIQUE ("s3_key"),
        CONSTRAINT "FK_files_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_files_folder_id" FOREIGN KEY ("folder_id") REFERENCES "folders"("id") ON DELETE SET NULL
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_files_user_id" ON "files" ("user_id");`);
    await queryRunner.query(`CREATE INDEX "IDX_files_folder_id" ON "files" ("folder_id");`);

    // 7. Create 'upload_sessions' table
    await queryRunner.query(`
      CREATE TABLE "upload_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "file_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "s3_upload_id" varchar(255) NOT NULL,
        "total_chunks" integer NOT NULL,
        "chunk_size" integer NOT NULL DEFAULT 5242880,
        "status" "upload_status_enum" NOT NULL DEFAULT 'PENDING',
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_upload_sessions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_upload_sessions_file_id" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_upload_sessions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_upload_sessions_file_id" ON "upload_sessions" ("file_id");`);
    await queryRunner.query(`CREATE INDEX "IDX_upload_sessions_user_id" ON "upload_sessions" ("user_id");`);
    await queryRunner.query(`CREATE INDEX "IDX_upload_sessions_expires_at" ON "upload_sessions" ("expires_at");`);

    // 8. Create 'share_links' table
    await queryRunner.query(`
      CREATE TABLE "share_links" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "file_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "token" varchar(128) NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE,
        "max_downloads" integer,
        "download_count" integer NOT NULL DEFAULT 0,
        "is_revoked" boolean NOT NULL DEFAULT false,
        "has_password" boolean NOT NULL DEFAULT false,
        "encrypted_password_fek" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_share_links_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_share_links_token" UNIQUE ("token"),
        CONSTRAINT "FK_share_links_file_id" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_share_links_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_share_links_file_id" ON "share_links" ("file_id");`);
    await queryRunner.query(`CREATE INDEX "IDX_share_links_user_id" ON "share_links" ("user_id");`);
    await queryRunner.query(`CREATE INDEX "IDX_share_links_token" ON "share_links" ("token");`);
    await queryRunner.query(`CREATE INDEX "IDX_share_links_expires_at" ON "share_links" ("expires_at");`);

    // 9. Create 'refresh_tokens' table
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token_hash" varchar(255) NOT NULL,
        "family_id" uuid NOT NULL,
        "is_revoked" boolean NOT NULL DEFAULT false,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_refresh_tokens_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_user_id" ON "refresh_tokens" ("user_id");`);
    await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_family_id" ON "refresh_tokens" ("family_id");`);
    await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_token_hash" ON "refresh_tokens" ("token_hash");`);
    await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_expires_at" ON "refresh_tokens" ("expires_at");`);

    // 10. Create 'sync_logs' table
    await queryRunner.query(`
      CREATE TABLE "sync_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "device_id" varchar(128) NOT NULL,
        "action" varchar(64) NOT NULL,
        "entity_type" varchar(32) NOT NULL,
        "entity_id" uuid,
        "client_timestamp" TIMESTAMP WITH TIME ZONE,
        "server_timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sync_logs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sync_logs_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_sync_logs_user_id" ON "sync_logs" ("user_id");`);
    await queryRunner.query(`CREATE INDEX "IDX_sync_logs_device_id" ON "sync_logs" ("device_id");`);

    // 11. Create 'audit_logs' table
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "ip_address" varchar(128),
        "user_agent" varchar(255),
        "action" varchar(64) NOT NULL,
        "status" varchar(32) NOT NULL,
        "details" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_audit_logs_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_user_id" ON "audit_logs" ("user_id");`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_action" ON "audit_logs" ("action");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sync_logs" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "share_links" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "upload_sessions" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "files" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "folders" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "plans" CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS "upload_status_enum";`);
  }
}

