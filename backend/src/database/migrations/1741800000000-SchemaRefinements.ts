import { MigrationInterface, QueryRunner } from 'typeorm';

export class SchemaRefinements1741800000000 implements MigrationInterface {
  name = 'SchemaRefinements1741800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Folders: Drop plaintext path column and unique constraint (ADR-004 compliance)
    await queryRunner.query(`ALTER TABLE "folders" DROP CONSTRAINT IF EXISTS "UQ_folders_user_path";`);
    await queryRunner.query(`ALTER TABLE "folders" DROP COLUMN IF EXISTS "path";`);

    // 2. Files: Add format_version and file_status_enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "file_status_enum" AS ENUM ('PENDING', 'COMPLETE', 'FAILED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "format_version" smallint NOT NULL DEFAULT 1;`);
    await queryRunner.query(`ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "status" "file_status_enum" NOT NULL DEFAULT 'PENDING';`);
    await queryRunner.query(`ALTER TABLE "files" DROP COLUMN IF EXISTS "is_upload_complete";`);

    // 3. Plans: Rename stripe_price_id to generic payment_provider_ref
    await queryRunner.query(`ALTER TABLE "plans" RENAME COLUMN "stripe_price_id" TO "payment_provider_ref";`);

    // 4. Users: Rename recovery columns and add auth & account reset columns
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "encrypted_recovery_kek" TO "encrypted_recovery_master_key";`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "recovery_nonce" TO "recovery_master_key_nonce";`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "recovery_confirmed_at" TIMESTAMP WITH TIME ZONE;`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_email_verified" boolean NOT NULL DEFAULT false;`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verification_token" varchar(255);`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verification_expires_at" TIMESTAMP WITH TIME ZONE;`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failed_login_attempts" integer NOT NULL DEFAULT 0;`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lockout_until" TIMESTAMP WITH TIME ZONE;`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_orphaned" boolean NOT NULL DEFAULT false;`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "orphaned_at" TIMESTAMP WITH TIME ZONE;`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "storage_reserved_bytes" bigint NOT NULL DEFAULT 0;`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "previous_key_bundle" jsonb;`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "security_action_token" varchar(255);`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "security_action_expires_at" TIMESTAMP WITH TIME ZONE;`);

    // 5. Refresh Tokens: Add session tracking columns
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD COLUMN IF NOT EXISTS "device_name" varchar(128) NOT NULL DEFAULT 'Web Browser';`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD COLUMN IF NOT EXISTS "ip_address" varchar(64);`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD COLUMN IF NOT EXISTS "user_agent" varchar(255);`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD COLUMN IF NOT EXISTS "last_used_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert Refresh Tokens
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN IF EXISTS "last_used_at";`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN IF EXISTS "user_agent";`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN IF EXISTS "ip_address";`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN IF EXISTS "device_name";`);

    // Revert Users
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "security_action_expires_at";`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "security_action_token";`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "previous_key_bundle";`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "storage_reserved_bytes";`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "orphaned_at";`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "is_orphaned";`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "lockout_until";`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "failed_login_attempts";`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "email_verification_expires_at";`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "email_verification_token";`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "is_email_verified";`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "recovery_confirmed_at";`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "recovery_master_key_nonce" TO "recovery_nonce";`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "encrypted_recovery_master_key" TO "encrypted_recovery_kek";`);

    // Revert Plans
    await queryRunner.query(`ALTER TABLE "plans" RENAME COLUMN "payment_provider_ref" TO "stripe_price_id";`);

    // Revert Files
    await queryRunner.query(`ALTER TABLE "files" ADD COLUMN "is_upload_complete" boolean NOT NULL DEFAULT false;`);
    await queryRunner.query(`ALTER TABLE "files" DROP COLUMN IF EXISTS "status";`);
    await queryRunner.query(`ALTER TABLE "files" DROP COLUMN IF EXISTS "format_version";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "file_status_enum";`);

    // Revert Folders
    await queryRunner.query(`ALTER TABLE "folders" ADD COLUMN "path" varchar(1024) NOT NULL DEFAULT '';`);
    await queryRunner.query(`ALTER TABLE "folders" ADD CONSTRAINT "UQ_folders_user_path" UNIQUE ("user_id", "path");`);
  }
}
