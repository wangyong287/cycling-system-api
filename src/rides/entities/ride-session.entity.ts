import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Course } from '../../courses/entities/course.entity';

export enum RideSessionType { SOLO = 'solo', LIVE = 'live', GROUP = 'group' }
export enum RideStatus { PENDING = 'pending', ACTIVE = 'active', COMPLETED = 'completed', CANCELLED = 'cancelled' }

@Entity('ride_sessions')
export class RideSession {
 @PrimaryGeneratedColumn('increment', { type: 'bigint' }) id: string;
 @Column({ name: 'user_id', type: 'bigint' }) userId: string;
 @Column({ name: 'course_id', type: 'bigint', nullable: true }) courseId: string;
 @Column({ type: 'enum', enum: RideSessionType, default: RideSessionType.SOLO }) sessionType: RideSessionType;
 @Column({ type: 'enum', enum: RideStatus, default: RideStatus.PENDING }) status: RideStatus;
 @Column({ name: 'started_at', type: 'timestamp', nullable: true }) startedAt: Date;
 @Column({ name: 'ended_at', type: 'timestamp', nullable: true }) endedAt: Date;
 @Column({ type: 'int', default: 0 }) duration: number;
 @Column({ name: 'avg_power', type: 'int', default: 0 }) avgPower: number;
 @Column({ name: 'max_power', type: 'int', default: 0 }) maxPower: number;
 @Column({ type: 'int', default: 0 }) heartRate: number;
 @Column({ type: 'int', default: 0 }) cadence: number;
 @Column({ type: 'int', default: 0 }) speed: number;
 @Column({ type: 'int', default: 0 }) calories: number;
 @Column({ type: 'int', default: 0 }) tss: number;
 @Column({ name: 'if_value', type: 'decimal', precision: 3, scale: 2, default: 0 }) ifValue: number;
 @Column({ type: 'int', default: 0 }) np: number;
 @Column({ type: 'jsonb', nullable: true }) powerCurve: [number, number][];
 @Column({ name: 'heart_rate_curve', type: 'jsonb', nullable: true }) heartRateCurve: [number, number][];
 @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
 @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
 @ManyToOne(() => User, (user) => user.rides) @JoinColumn({ name: 'user_id' }) user: User;
 @ManyToOne(() => Course) @JoinColumn({ name: 'course_id' }) course: Course;
}
