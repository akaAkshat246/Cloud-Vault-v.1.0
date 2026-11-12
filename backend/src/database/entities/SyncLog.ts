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

@Entity('sync_logs')
export class SyncLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  user_id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index()
  @Column({ type: 'varchar', length: 128 })
  device_id!: string;

  @Column({ type: 'varchar', length: 64 })
  action!: string; // 'CREATE', 'UPDATE', 'DELETE', 'RENAME', 'MOVE'

  @Column({ type: 'varchar', length: 32 })
  entity_type!: string; // 'FILE', 'FOLDER'

  @Column({ type: 'uuid', nullable: true })
  entity_id!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  client_timestamp!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  server_timestamp!: Date;
}

