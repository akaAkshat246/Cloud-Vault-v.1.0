import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env if present
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000), // 15 mins
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),

  // Database
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_USER: z.string().default('cloudvault'),
  DB_PASSWORD: z.string().default('cloudvault_dev_password'),
  DB_NAME: z.string().default('cloudvault_db'),
  DB_SSL: z.coerce.boolean().default(false),
  DB_LOGGING: z.coerce.boolean().default(false),

  // S3 / MinIO
  S3_ENDPOINT: z.string().default('http://localhost:9000'),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY_ID: z.string().default('minioadmin'),
  S3_SECRET_ACCESS_KEY: z.string().default('minioadmin'),
  S3_BUCKET_NAME: z.string().default('cloudvault-storage'),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true),
  S3_PRESIGNED_EXPIRATION_SECONDS: z.coerce.number().int().positive().default(900),
  S3_ABORT_INCOMPLETE_MULTIPART_DAYS: z.coerce.number().int().positive().default(2),

  // Secrets (M3 Auth)
  JWT_ACCESS_SECRET: z.string().min(32).default('dev_jwt_access_secret_do_not_use_in_prod_minimum_32_characters_long'),
  JWT_REFRESH_SECRET: z.string().min(32).default('dev_jwt_refresh_secret_do_not_use_in_prod_minimum_32_characters_long'),
});

export type EnvConfig = z.infer<typeof envSchema>;

let validatedEnv: EnvConfig;

try {
  validatedEnv = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ FATAL: Invalid backend environment variables:');
    error.issues.forEach((err: any) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
  } else {
    console.error('❌ FATAL: Failed to parse environment configuration:', error);
  }
  process.exit(1);
}

export const env = validatedEnv;

