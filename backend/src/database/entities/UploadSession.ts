import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { User } from './User.js';
import { FileEntity } from './FileEntity.js';

export enum UploadStatus {
  PENDING = 'PENDING',
  UPLOADING = 'UPLOADING',
  COMPLETED = 'COMPLETED',
  ABORTED = 'ABORTED'
}

@Entity('upload_sessions')
export class UploadSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  file_id!: string;

  @ManyToOne(() => FileEntity, (file) => file.uploadSessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'file_id' })
  file!: FileEntity;

  @Index()
  @Column({ type: 'uuid' })
  user_id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 255 })
  s3_upload_id!: string;

  @Column({ type: 'integer' })
  total_chunks!: number;

  @Column({ type: 'integer', default: 5242880 })
  chunk_size!: number;

  @Column({
    type: 'enum',
    enum: UploadStatus,
    default: UploadStatus.PENDING
  })
  status!: UploadStatus;

  @Index()
  @Column({ type: 'timestamptz' })
  expires_at!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}

