import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum DeviceType {
  BIKE = 'bike',
  HEART_RATE = 'heart_rate',
  CADENCE = 'cadence',
  SPEED = 'speed',
}

export enum DeviceStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
}

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: string;

  @ManyToOne(() => User, (user) => user.devices)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'device_type', type: 'enum', enum: DeviceType })
  deviceType: DeviceType;

  @Column({ nullable: true })
  brand: string;

  @Column({ nullable: true })
  model: string;

  @Column({ name: 'device_id', length: 100 })
  deviceId: string;

  @Column({ default: 'ble' })
  protocol: string;

  @Column({ type: 'enum', enum: DeviceStatus, default: DeviceStatus.DISCONNECTED })
  status: DeviceStatus;

  @Column({ name: 'last_connected_at', nullable: true })
  lastConnectedAt: Date;
}