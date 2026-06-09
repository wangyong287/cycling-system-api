import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, In } from 'typeorm';
import { Subscription, SubscriptionPlan, SubscriptionType, SubscriptionStatus } from './entities/subscription.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepo: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private planRepo: Repository<SubscriptionPlan>,
  ) {}

  // 获取套餐列表
  async getPlans(): Promise<SubscriptionPlan[]> {
    return this.planRepo.find({
      where: { status: SubscriptionStatus.ACTIVE },
      order: { price: 'ASC' },
    });
  }

  // 创建套餐
  async createPlan(data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const plan = this.planRepo.create(data);
    return this.planRepo.save(plan);
  }

  // 更新套餐
  async updatePlan(id: string, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('套餐不存在');
    Object.assign(plan, data);
    return this.planRepo.save(plan);
  }

  // 用户订阅
  async subscribe(userId: string, planId: string): Promise<Subscription> {
    const plan = await this.planRepo.findOne({ where: { id: planId } });
    if (!plan) throw new NotFoundException('套餐不存在');

    // 计算过期时间
    const now = new Date();
    let expireAt: Date;
    switch (plan.durationType) {
      case 'day':
        expireAt = new Date(now.getTime() + plan.duration * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        expireAt = new Date(now.getTime() + plan.duration * 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        expireAt = new Date(now.getTime() + plan.duration * 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        throw new BadRequestException('无效的订阅时长');
    }

    // 检查是否已有订阅
    const existSub = await this.subscriptionRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
    });

    if (existSub) {
      // 续期：追加时长
      existSub.expireAt = new Date(existSub.expireAt.getTime() + plan.getDurationDays() * 24 * 60 * 60 * 1000);
      existSub.type = plan.durationType as any;
      return this.subscriptionRepo.save(existSub);
    }

    // 新订阅
    const subscription = this.subscriptionRepo.create({
      userId,
      type: plan.durationType as any,
      startAt: now,
      expireAt,
      status: SubscriptionStatus.ACTIVE,
    });

    return this.subscriptionRepo.save(subscription);
  }

  // 获取用户订阅
  async getUserSubscription(userId: string): Promise<Subscription | null> {
    return this.subscriptionRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
  }

  // 取消订阅
  async cancelSubscription(userId: string): Promise<void> {
    const sub = await this.getUserSubscription(userId);
    if (sub) {
      sub.status = SubscriptionStatus.CANCELLED;
      await this.subscriptionRepo.save(sub);
    }
  }

  // 检查订阅是否有效
  async isSubscribed(userId: string): Promise<boolean> {
    const sub = await this.getUserSubscription(userId);
    return sub ? !sub.isExpired() : false;
  }

  // 管理端：获取所有订阅
  async findAll(query: {
    page?: number;
    pageSize?: number;
    status?: string;
    keyword?: string;
  }) {
    const { page = 1, pageSize = 20 } = query;
    const qb = this.subscriptionRepo.createQueryBuilder('sub')
      .leftJoinAndSelect('sub.user', 'user');

    if (query.status) {
      qb.andWhere('sub.status = :status', { status: query.status });
    }
    if (query.keyword) {
      qb.andWhere('user.nickname LIKE :keyword', { keyword: `%${query.keyword}%` });
    }

    const [data, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy('sub.createdAt', 'DESC')
      .getManyAndCount();

    return { data, pagination: { total, page, pageSize } };
  }
}