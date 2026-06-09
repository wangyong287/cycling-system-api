import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { RideSession } from '../../rides/entities/ride-session.entity';
import { Device } from '../../devices/entities/device.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { Pet } from '../../pets/entities/pet.entity';
import { PointRecord } from '../../points/entities/point-record.entity';
import { Coach } from '../../coaches/entities/coach.entity';

export enum UserGender {
  MALE = 'male',
  FEMALE = 'female',
  UNKNOWN = 'unknown',
}

export enum UserStatus {
  ACTIVE = 'active',
  BANNED = 'banned',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ unique: true, length: 20 })
  phone: string;

  @Exclude()
  @Column({ name: 'password_hash', length: 64 })
  passwordHash: string;

  @Column({ length: 50 })
  nickname: string;

  @Column({ name: 'avatar', length: 255, nullable: true })
  avatar: string;

  @Column({
    type: 'enum',
    enum: UserGender,
    default: UserGender.UNKNOWN,
  })
  gender: UserGender;

  @Column({ name: 'birth_year', nullable: true })
  birthYear: number;

  @Column({ nullable: true })
  height: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight: number;

  @Column({ default: 0 })
  ftp: number;

  @Column({ type: 'decimal', precision: 4, scale: 2, default: 0 })
  wKg: number;

  @Column({ default: 0 })
  lthr: number;

  @Column({ default: 0 })
  mhr: number;

  @Column({ default: 1 })
  level: number;

  @Column({ default: 0 })
  points: number;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 关联
  @OneToMany(() => RideSession, (ride) => ride.user)
  rides: RideSession[];

  @OneToMany(() => Device, (device) => device.user)
  devices: Device[];

  @OneToMany(() => Subscription, (sub) => sub.user)
  subscriptions: Subscription[];

  @OneToMany(() => Pet, (pet) => pet.user)
  pets: Pet[];

  @OneToMany(() => PointRecord, (record) => record.user)
  pointRecords: PointRecord[];

  @OneToOne(() => Coach, (coach) => coach.user)
  coach: Coach;

  // 计算W/kg
  calculateWKg(): number {
    if (this.ftp && this.weight) {
      this.wKg = Number((this.ftp / this.weight).toFixed(2));
    }
    return this.wKg;
  }
}
