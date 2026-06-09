import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CourseEnrollment } from './course-enrollment.entity';

export enum CourseType {
  POWER = 'power',
  HEART_RATE = 'heart_rate',
  MIXED = 'mixed',
}

export enum CourseDifficulty {
  ENTRY = '入门',
  BASIC = '基础',
  ADVANCED = '进阶',
  EXPERT = '高级',
}

export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export interface SectionConfig {
  name: string;
  type: string;
  duration: number;
  powerRange?: [number, number];
  heartRateZone?: [number, number];
  cadenceRange?: [number, number];
  tip?: string;
}

export interface RewardConfig {
  type: string;
  value: number;
  condition: string;
}

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ length: 100 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 255, nullable: true })
  cover: string;

  @Column({ name: 'coach_id', type: 'bigint' })
  coachId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'coach_id' })
  coach: User;

  @Column({
    type: 'enum',
    enum: CourseType,
    default: CourseType.POWER,
  })
  type: CourseType;

  @Column({
    type: 'enum',
    enum: CourseDifficulty,
    default: CourseDifficulty.BASIC,
  })
  difficulty: CourseDifficulty;

  @Column()
  duration: number;

  @Column({ name: 'section_config', type: 'jsonb' })
  sections: SectionConfig[];

  @Column({ name: 'reward_config', type: 'jsonb', nullable: true })
  rewards: RewardConfig[];

  @Column({ name: 'difficulty_value', default: 50 })
  difficultyValue: number;

  @Column({ default: 0 })
  tss: number;

  @Column({ type: 'decimal', precision: 4, scale: 2, default: 0 })
  ifValue: number;

  @Column({
    type: 'enum',
    enum: CourseStatus,
    default: CourseStatus.DRAFT,
  })
  status: CourseStatus;

  @Column({ name: 'enrolled_count', default: 0 })
  enrolledCount: number;

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 0 })
  rating: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'published_at', nullable: true })
  publishedAt: Date;

  @OneToMany(() => require('./course-enrollment.entity').CourseEnrollment, (enrollment: any) => enrollment.course)
  enrollments: CourseEnrollment[];

  // 计算课程TSS
  calculateTSS(): number {
    let totalTSS = 0;
    for (const section of this.sections) {
      const duration = section.duration / 60; // 转换为分钟
      if (section.powerRange) {
        const avgPower =
          (section.powerRange[0] + section.powerRange[1]) / 2;
        const ftp = 300; // 需要根据课程默认FTP
        const ifValue = avgPower / ftp;
        totalTSS += (duration / 60) * avgPower * ifValue * 100;
      }
    }
    this.tss = Math.round(totalTSS);
    return this.tss;
  }
}