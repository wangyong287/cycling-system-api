import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PointRecord, PointType } from './entities/point-record.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class PointsService {
  constructor(
    @InjectRepository(PointRecord)
    private pointRecordRepository: Repository<PointRecord>,
    private usersService: UsersService,
  ) {}

  // 获取积分余额
  async getBalance(userId: string): Promise<number> {
    const user = await this.usersService.findById(userId);
    return user?.points || 0;
  }

  // 增加积分
  async addPoints(
    userId: string,
    type: PointType,
    value: number,
    description?: string,
  ): Promise<PointRecord> {
    const currentBalance = await this.getBalance(userId);

    const record = this.pointRecordRepository.create({
      userId,
      type,
      value,
      balance: currentBalance + value,
      description,
    });

    await this.pointRecordRepository.save(record);

    // 更新用户积分
    const user = await this.usersService.findById(userId);
    user.points = currentBalance + value;
    await this.usersService.update(userId, user as any);

    return record;
  }

  // 扣除积分
  async consumePoints(
    userId: string,
    type: PointType,
    value: number,
    description?: string,
  ): Promise<PointRecord> {
    const currentBalance = await this.getBalance(userId);

    if (currentBalance < value) {
      throw new BadRequestException('积分不足');
    }

    const record = this.pointRecordRepository.create({
      userId,
      type,
      value: -value,
      balance: currentBalance - value,
      description,
    });

    await this.pointRecordRepository.save(record);

    // 更新用户积分
    const user = await this.usersService.findById(userId);
    user.points = currentBalance - value;
    await this.usersService.update(userId, user as any);

    return record;
  }

  // 骑行完成奖励积分
  async rewardRideComplete(userId: string, tss: number): Promise<PointRecord> {
    // 根据TSS计算积分
    const points = Math.min(100, Math.round(tss / 2));
    return this.addPoints(userId, PointType.RIDE_COMPLETE, points, '完成骑行');
  }

  // 每日登录奖励
  async rewardDailyLogin(userId: string): Promise<PointRecord | null> {
    // 检查今天是否已领取
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.pointRecordRepository.findOne({
      where: {
        userId,
        type: PointType.DAILY_LOGIN,
        createdAt: today as any,
      },
    });

    if (existing) {
      return null; // 已领取
    }

    return this.addPoints(userId, PointType.DAILY_LOGIN, 10, '每日登录');
  }

  // 积分记录
  async getRecords(
    userId: string,
    query: { page?: number; pageSize?: number } = {},
  ): Promise<{ data: PointRecord[]; total: number }> {
    const { page = 1, pageSize = 20 } = query;

    const [data, total] = await this.pointRecordRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, total };
  }

  // 兑换宠物/物品
  async exchange(
    userId: string,
    itemType: string,
    cost: number,
  ): Promise<PointRecord> {
    return this.consumePoints(userId, PointType.EXCHANGE, cost, `兑换${itemType}`);
  }
}