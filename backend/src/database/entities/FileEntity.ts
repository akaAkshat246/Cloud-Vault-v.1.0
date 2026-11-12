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
import { User } from './User.js';
import { Folder } from './Folder.js';
import { UploadSession } from './UploadSession.js';
import { ShareLink } from './ShareLink.js';

export enum FileStatus {
  PENDING = 'PENDING',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED'
}

@Entity('files')
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'smallint', default: 1 })
  format_version!: number;

  @Index()
  @Column({ type: 'uuid' })
  user_id!: string;

  @ManyToOne(() => User, (user) => user.files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  folder_id!: string | null;

  @ManyToOne(() => Folder, (folder) => folder.files, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'folder_id' })
  folder!: Folder | null;

  @Column({ type: 'text' })
  encrypted_name!: string;

  @Column({ type: 'varchar', length: 32 })
  name_nonce!: string;

  @Column({ type: 'text' })
  encrypted_fek!: string;

  @Column({ type: 'varchar', length: 32 })
  fek_nonce!: string;

  @Column({ type: 'bigint' })
  size_bytes!: string;

  @Column({ type: 'integer' })
  chunk_count!: number;

  @Column({ type: 'text', nullable: true })
  mime_type_encrypted!: string | null;

  @Column({ type: 'boolean', default: false })
  is_trashed!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  trashed_at!: Date | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 512, unique: true })
  s3_key!: string;

  @Column({
    type: 'enum',
    enum: FileStatus,
    default: FileStatus.PENDING
  })
  status!: FileStatus;

  @OneToMany(() => UploadSession, (session) => session.file)
  uploadSessions!: UploadSession[];

  @OneToMany(() => ShareLink, (share) => share.file)
  shareLinks!: ShareLink[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}

