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

@Entity('share_links')
export class ShareLink {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  file_id!: string;

  @ManyToOne(() => FileEntity, (file) => file.shareLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'file_id' })
  file!: FileEntity;

  @Index()
  @Column({ type: 'uuid' })
  user_id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 128, unique: true })
  token!: string;

  @Index()
  @Column({ type: 'timestamptz', nullable: true })
  expires_at!: Date | null;

  @Column({ type: 'integer', nullable: true })
  max_downloads!: number | null;

  @Column({ type: 'integer', default: 0 })
  download_count!: number;

  @Column({ type: 'boolean', default: false })
  is_revoked!: boolean;

  @Column({ type: 'boolean', default: false })
  has_password!: boolean;

  @Column({ type: 'text', nullable: true })
  encrypted_password_fek!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}

