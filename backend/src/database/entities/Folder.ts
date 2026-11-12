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
import { FileEntity } from './FileEntity.js';

@Entity('folders')
export class Folder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  user_id!: string;

  @ManyToOne(() => User, (user) => user.folders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  parent_id!: string | null;

  @ManyToOne(() => Folder, (folder) => folder.children, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent!: Folder | null;

  @OneToMany(() => Folder, (folder) => folder.parent)
  children!: Folder[];

  @Column({ type: 'text' })
  encrypted_name!: string;

  @Column({ type: 'varchar', length: 32 })
  name_nonce!: string;

  // Zero-Knowledge Invariant (ADR-004): Plaintext folder path is NEVER stored on the server.
  // Folder hierarchy is strictly represented via parent_id. Path resolution and duplicate-name
  // checks are executed client-side on decrypted folder names.

  @Column({ type: 'boolean', default: false })
  is_trashed!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  trashed_at!: Date | null;

  @OneToMany(() => FileEntity, (file) => file.folder)
  files!: FileEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}

