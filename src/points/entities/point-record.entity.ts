import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum PointType {
  // 获得
  RIDE_COMPLETE = 'ride_complete',
  DAILY_LOGIN = 'daily_login',
  ACHIEVEMENT = 'achievement',
  REWARD = 'reward',
  INVITE = 'invite',
  // 消耗
  EXCHANGE = 'exchange',
}

@Entity('point_records')
export class PointRecord {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: string;

  @ManyToOne(() => User, (user) => user.pointRecords)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: PointType,
  })
  type: PointType;

  @Column()
  value: number;

  @Column()
  balance: number;

  @Column({ name: 'source_id', nullable: true })
  sourceId: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}