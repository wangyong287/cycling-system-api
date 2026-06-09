import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum SubscriptionType {
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  LIFETIME = 'lifetime',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: SubscriptionType,
  })
  type: SubscriptionType;

  @Column({ name: 'start_at' })
  startAt: Date;

  @Column({ name: 'expire_at' })
  expireAt: Date;

  @Column({ name: 'auto_renew', default: false })
  autoRenew: boolean;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // 检查是否过期
  isExpired(): boolean {
    return new Date() > this.expireAt;
  }

  // 获取剩余天数
  getRemainingDays(): number {
    const now = new Date();
    const diff = this.expireAt.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ length: 50 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column()
  duration: number;

  @Column({ name: 'duration_type', length: 20 })
  durationType: string;

  @Column({ type: 'jsonb', nullable: true })
  features: string[];

  @Column({ default: false })
  recommended: boolean;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // 获取天数
  getDurationDays(): number {
    switch (this.durationType) {
      case 'day': return this.duration;
      case 'month': return this.duration * 30;
      case 'year': return this.duration * 365;
      default: return 0;
    }
  }
}