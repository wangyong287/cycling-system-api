import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum CoachStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  SUSPENDED = 'suspended',
}

@Entity('coaches')
export class Coach {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'user_id', type: 'bigint', unique: true })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 50, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ length: 255, nullable: true })
  certificate: string;

  @Column({ type: 'jsonb', nullable: true })
  specialties: string[];

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 0 })
  rating: number;

  @Column({ name: 'total_students', default: 0 })
  totalStudents: number;

  @Column({
    type: 'enum',
    enum: CoachStatus,
    default: CoachStatus.PENDING,
  })
  status: CoachStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ length: 50, unique: true })
  name: string;

  @Column({ type: 'jsonb' })
  permissions: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('coach_permissions')
export class CoachPermission {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: string;

  @Column({ name: 'role_id', type: 'bigint' })
  roleId: string;

  @Column({ name: 'granted_by', type: 'bigint' })
  grantedBy: string;

  @CreateDateColumn({ name: 'granted_at' })
  grantedAt: Date;
}