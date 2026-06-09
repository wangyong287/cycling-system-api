import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, PaymentMethod } from './entities/order.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    private subscriptionsService: SubscriptionsService,
  ) {}

  // 创建订单
  async create(userId: string, planId: string, paymentMethod: PaymentMethod): Promise<Order> {
    // 获取套餐信息
    const plans = await this.subscriptionsService.getPlans();
    const plan = plans.find(p => p.id === planId);
    if (!plan) throw new NotFoundException('套餐不存在');

    const order = this.orderRepo.create({
      orderNo: this.generateOrderNo(),
      userId,
      planId,
      amount: plan.price,
      paymentMethod,
      status: OrderStatus.PENDING,
    });

    return this.orderRepo.save(order);
  }

  // 支付成功回调
  async handlePaymentCallback(orderNo: string, transactionId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { orderNo } });
    if (!order) throw new NotFoundException('订单不存在');

    // 更新订单状态
    order.status = OrderStatus.PAID;
    order.transactionId = transactionId;
    order.paidAt = new Date();
    await this.orderRepo.save(order);

    // 开通订阅
    await this.subscriptionsService.subscribe(order.userId, order.planId);

    return order;
  }

  // 获取用户订单
  async findByUserId(userId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // 订单列表（管理端）
  async findAll(query: {
    page?: number;
    pageSize?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, pageSize = 20 } = query;
    const qb = this.orderRepo.createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.plan', 'plan');

    if (query.status) {
      qb.andWhere('order.status = :status', { status: query.status });
    }
    if (query.startDate) {
      qb.andWhere('order.created_at >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      qb.andWhere('order.created_at <= :endDate', { endDate: query.endDate });
    }

    const [data, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy('order.created_at', 'DESC')
      .getManyAndCount();

    return { data, pagination: { total, page, pageSize } };
  }

  // 生成订单号
  private generateOrderNo(): string {
    const timestamp = Date.now().toString().slice(-10);
    const random = uuidv4().slice(0, 6);
    return `ORD${timestamp}${random}`;
  }

  // 统计收入
  async getRevenue(startDate?: string, endDate?: string): Promise<number> {
    const qb = this.orderRepo.createQueryBuilder('order')
      .where('order.status = :status', { status: OrderStatus.PAID });

    if (startDate) {
      qb.andWhere('order.paid_at >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('order.paid_at <= :endDate', { endDate });
    }

    const result = await qb.select('SUM(order.amount)', 'total').getRawOne();
    return Number(result?.total || 0);
  }
}