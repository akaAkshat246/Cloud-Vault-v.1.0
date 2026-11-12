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

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  user_id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  token_hash!: string;

  @Index()
  @Column({ type: 'uuid' })
  family_id!: string;

  @Column({ type: 'varchar', length: 128, default: 'Web Browser' })
  device_name!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip_address!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  user_agent!: string | null;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  last_used_at!: Date;

  @Column({ type: 'boolean', default: false })
  is_revoked!: boolean;

  @Index()
  @Column({ type: 'timestamptz' })
  expires_at!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}

