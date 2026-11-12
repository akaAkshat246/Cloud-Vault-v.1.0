import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '../config/env.js';
import {
  User,
  Plan,
  Folder,
  FileEntity,
  UploadSession,
  ShareLink,
  RefreshToken,
  SyncLog,
  AuditLog
} from './entities/index.js';
import { InitialSchema1700000000000 } from './migrations/1700000000000-InitialSchema.js';
import { SchemaRefinements1741800000000 } from './migrations/1741800000000-SchemaRefinements.js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
  synchronize: false, // Invariant: Versioned migrations only
  logging: env.DB_LOGGING,
  entities: [
    User,
    Plan,
    Folder,
    FileEntity,
    UploadSession,
    ShareLink,
    RefreshToken,
    SyncLog,
    AuditLog
  ],
  migrations: [InitialSchema1700000000000, SchemaRefinements1741800000000],
  subscribers: []
});

