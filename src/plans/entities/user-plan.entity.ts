import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Plan } from './plan.entity';

export enum UserPlanStatus {
  ACTIVE = 'active',          // 进行中
  COMPLETED = 'completed',    // 已完成
  PAUSED = 'paused',          // 暂停
  ABANDONED = 'abandoned',    // 放弃
}

/**
 * 用户订阅的训练计划
 */
@Entity('user_plans')
@Index(['userId', 'status'])
export class UserPlan {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'bigint' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'bigint' })
  planId: string;

  @ManyToOne(() => Plan, (plan) => plan.userPlans, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'planId' })
  plan: Plan;

  @Column({
    type: 'enum',
    enum: UserPlanStatus,
    default: UserPlanStatus.ACTIVE,
  })
  status: UserPlanStatus;

  @Column({ type: 'smallint', default: 0 })
  currentWeek: number;          // 当前周

  @Column({ type: 'smallint', default: 0 })
  currentDay: number;           // 当前日（1-7）

  @Column({ type: 'smallint', default: 0 })
  completedDays: number;        // 已完成天数

  @Column({ type: 'int', default: 0 })
  totalCalories: number;        // 累计消耗

  @Column({ type: 'int', default: 0 })
  totalMinutes: number;         // 累计时长

  @Column({ type: 'date', nullable: true })
  startedAt: Date;

  @Column({ type: 'date', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
