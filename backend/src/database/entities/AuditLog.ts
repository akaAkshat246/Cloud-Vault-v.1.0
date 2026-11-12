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

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  user_id!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  ip_address!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  user_agent!: string | null;

  @Column({ type: 'varchar', length: 64 })
  action!: string; // 'AUTH_LOGIN', 'AUTH_REGISTER', 'FILE_UPLOAD', 'FILE_DELETE', 'LINK_SHARE'

  @Column({ type: 'varchar', length: 32 })
  status!: string; // 'SUCCESS', 'FAILURE'

  @Column({ type: 'jsonb', nullable: true })
  details!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}

