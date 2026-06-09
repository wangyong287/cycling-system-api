import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum PetStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

// 支持的宠物类型
export const PET_TYPES = {
  // 狗狗
  BORDER_COLLIE: '边境牧羊犬',
  GOLDEN_RETRIEVER: '金毛',
  CORGI: '柯基',
  SHIBA: '柴犬',
  HUSKY: '哈士奇',
  POODLE: '泰迪',
  // 猫咪
  BRITISH_SHORTHAIR: '英短',
  RAGDOLL: '布偶',
  SIAMESE: '暹罗',
  // 小宠
  RABBIT: '荷兰垂耳兔',
  HAMSTER: '金丝熊',
  GUINEA_PIG: '荷兰猪',
} as const;

export type PetType = (typeof PET_TYPES)[keyof typeof PET_TYPES];

@Entity('pets')
export class Pet {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: string;

  @ManyToOne(() => User, (user) => user.pets)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'pet_type', length: 20 })
  petType: string;

  @Column({ length: 50 })
  name: string;

  @Column({ default: 1 })
  level: number;

  @Column({ default: 0 })
  intimacy: number;

  @Column({ default: 0 })
  energy: number;

  @Column({ nullable: true })
  skin: string;

  @Column({
    type: 'enum',
    enum: PetStatus,
    default: PetStatus.ACTIVE,
  })
  status: PetStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'last_interaction_at', nullable: true })
  lastInteractionAt: Date;

  // 升级所需亲密度
  static getIntimacyForLevel(level: number): number {
    return level * 100;
  }

  // 检查是否可以升级
  canLevelUp(): boolean {
    return this.intimacy >= Pet.getIntimacyForLevel(this.level + 1);
  }

  // 获取互动文字
  getEncourageText(powerPercent: number): string {
    if (powerPercent < 55) return '慢慢来，不着急~';
    if (powerPercent < 75) return '保持节奏！';
    if (powerPercent < 90) return '加油！冲！';
    if (powerPercent < 105) return '极限挑战！';
    return '你是最棒的！';
  }
}