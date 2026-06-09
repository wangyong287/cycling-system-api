import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { UserPlan } from './user-plan.entity';

export enum PlanGoal {
  FAT_BURN = 'fat_burn',        // 燃脂
  ENDURANCE = 'endurance',      // 耐力
  STRENGTH = 'strength',        // 力量
  REHAB = 'rehab',              // 康复
  WEIGHT_LOSS = 'weight_loss',  // 减重
  COMPETITION = 'competition',  // 备赛
}

export enum PlanLevel {
  BEGINNER = 'beginner',        // 新手
  INTERMEDIATE = 'intermediate',// 中级
  ADVANCED = 'advanced',        // 高级
  EXPERT = 'expert',            // 资深
}

export enum PlanStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

/**
 * 单日训练配置
 */
export interface DailyWorkout {
  day: number;                  // 第几天（1-7）
  type: 'rest' | 'recovery' | 'endurance' | 'interval' | 'strength' | 'mixed';
  durationMin: number;
  intensity: 'low' | 'moderate' | 'high' | 'peak';
  targetZone?: { min: number; max: number };  // 心率/功率区间
  description: string;
  courseIds?: string[];          // 推荐课程 ID
  tip?: string;
}

/**
 * 周训练配置
 */
export interface WeekPlan {
  week: number;
  theme: string;
  totalDurationMin: number;
  workouts: DailyWorkout[];
}

/**
 * 训练计划主表
 * 模板库：管理员/系统预置的训练方案
 */
@Entity('plans')
@Index(['goal', 'level', 'status'])
export class Plan {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  cover: string;

  @Column({
    type: 'enum',
    enum: PlanGoal,
  })
  goal: PlanGoal;

  @Column({
    type: 'enum',
    enum: PlanLevel,
  })
  level: PlanLevel;

  @Column({ type: 'smallint', default: 3 })
  daysPerWeek: number;

  @Column({ type: 'smallint', default: 4 })
  durationWeeks: number;

  @Column({ type: 'jsonb', nullable: true })
  structure: WeekPlan[] | null;    // 完整周计划结构

  @Column({ type: 'int', default: 0 })
  estimatedCalories: number;    // 预估总消耗

  @Column({ type: 'int', default: 0 })
  enrolledCount: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({
    type: 'enum',
    enum: PlanStatus,
    default: PlanStatus.PUBLISHED,
  })
  status: PlanStatus;

  @Column({ type: 'boolean', default: false })
  isSystem: boolean;             // 系统预置

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => UserPlan, (userPlan) => userPlan.plan)
  userPlans: UserPlan[];
}
