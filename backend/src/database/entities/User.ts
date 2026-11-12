import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index
} from 'typeorm';
import { Plan } from './Plan.js';
import { Folder } from './Folder.js';
import { FileEntity } from './FileEntity.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  auth_key_hash!: string;

  @Column({ type: 'varchar', length: 64 })
  salt!: string;

  @Column({ type: 'varchar', length: 32, default: '1.0' })
  kdf_version!: string;

  @Column({ type: 'jsonb', default: { m: 65536, t: 3, p: 1 } })
  kdf_params!: { m: number; t: number; p: number };

  @Column({ type: 'text' })
  encrypted_master_key!: string;

  @Column({ type: 'varchar', length: 32 })
  master_key_nonce!: string;

  // Recovery-wrapped MasterKey (derived from 24-word BIP-39 RecoveryKey per CRYPTO_SPEC Section 7)
  @Column({ type: 'text' })
  encrypted_recovery_master_key!: string;

  @Column({ type: 'varchar', length: 32 })
  recovery_master_key_nonce!: string;

  @Column({ type: 'timestamptz', nullable: true })
  recovery_confirmed_at!: Date | null;

  @Column({ type: 'boolean', default: false })
  is_email_verified!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email_verification_token!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  email_verification_expires_at!: Date | null;

  @Column({ type: 'integer', default: 0 })
  failed_login_attempts!: number;

  @Column({ type: 'timestamptz', nullable: true })
  lockout_until!: Date | null;

  // ADR-014 Path B: 30-day grace period for orphaned vault data during Account Reset
  @Column({ type: 'boolean', default: false })
  is_orphaned!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  orphaned_at!: Date | null;

  @Column({ type: 'bigint', default: 0 })
  storage_used_bytes!: string;

  @Column({ type: 'bigint', default: 0 })
  storage_reserved_bytes!: string;

  @Column({ type: 'bigint', default: 5368709120 }) // 5 GiB default
  storage_quota_bytes!: string;

  @Column({ type: 'jsonb', nullable: true })
  previous_key_bundle!: Record<string, any> | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  security_action_token!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  security_action_expires_at!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  plan_id!: string | null;

  @ManyToOne(() => Plan, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'plan_id' })
  plan!: Plan | null;

  @OneToMany(() => Folder, (folder) => folder.user)
  folders!: Folder[];

  @OneToMany(() => FileEntity, (file) => file.user)
  files!: FileEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}

