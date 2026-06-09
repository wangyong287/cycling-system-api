import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  Plan,
  PlanGoal,
  PlanLevel,
  PlanStatus,
  WeekPlan,
  DailyWorkout,
} from './entities/plan.entity';
import { UserPlan, UserPlanStatus } from './entities/user-plan.entity';
import { GeneratePlanDto, CreatePlanDto } from './dto/generate-plan.dto';
import { PlanGenerator } from './plan-generator';

/**
 * 训练计划服务
 */
@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
    @InjectRepository(UserPlan)
    private userPlanRepository: Repository<UserPlan>,
  ) {}

  /**
   * 核心：根据用户问卷生成个性化训练计划
   * 1. 先在模板库匹配最接近的方案
   * 2. 没有匹配则按规则生成全新方案
   * 3. 入库 + 返回完整结构
   */
  async generatePlan(userId: string, dto: GeneratePlanDto) {
    // 1. 查模板库，匹配最接近的方案
    const templates = await this.planRepository.find({
      where: {
        goal: dto.goal,
        level: dto.level,
        status: PlanStatus.PUBLISHED,
        isSystem: true,
      },
    });

    // 2. 按 daysPerWeek + durationWeeks 选最接近的
    const matched = this.findClosestTemplate(templates, dto.daysPerWeek, dto.durationWeeks);

    if (matched) {
      // 命中模板：直接订阅 + 返回
      const userPlan = await this.subscribeToPlan(userId, matched.id);
      return {
        data: matched,
        userPlan,
        source: 'template' as const,
      };
    }

    // 3. 未命中：按算法生成新方案
    const generated = PlanGenerator.generate(dto);

    const newPlan = this.planRepository.create({
      name: generated.name,
      description: generated.description,
      goal: dto.goal,
      level: dto.level,
      daysPerWeek: dto.daysPerWeek,
      durationWeeks: dto.durationWeeks,
      structure: generated.structure as any,
      estimatedCalories: generated.estimatedCalories,
      status: PlanStatus.PUBLISHED,
      isSystem: false,
    });
    const saved = await this.planRepository.save(newPlan);

    const userPlan = await this.subscribeToPlan(userId, saved.id);

    return {
      data: saved,
      userPlan,
      source: 'generated' as const,
    };
  }

  /**
   * 找最接近的模板（天数差 + 周数差最小的）
   */
  private findClosestTemplate(
    templates: Plan[],
    daysPerWeek: number,
    durationWeeks: number,
  ): Plan | null {
    if (templates.length === 0) return null;
    return templates.reduce((best, cur) => {
      const bestScore =
        Math.abs(best.daysPerWeek - daysPerWeek) * 2 +
        Math.abs(best.durationWeeks - durationWeeks);
      const curScore =
        Math.abs(cur.daysPerWeek - daysPerWeek) * 2 +
        Math.abs(cur.durationWeeks - durationWeeks);
      return curScore < bestScore ? cur : best;
    });
  }

  /**
   * 列出方案库
   */
  async findAll(query: {
    goal?: PlanGoal;
    level?: PlanLevel;
    page?: number;
    pageSize?: number;
  } = {}) {
    const { page = 1, pageSize = 20 } = query;
    const qb = this.planRepository
      .createQueryBuilder('plan')
      .where('plan.status = :status', { status: PlanStatus.PUBLISHED });

    if (query.goal) {
      qb.andWhere('plan.goal = :goal', { goal: query.goal });
    }
    if (query.level) {
      qb.andWhere('plan.level = :level', { level: query.level });
    }

    const [data, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy('plan.enrolledCount', 'DESC')
      .addOrderBy('plan.rating', 'DESC')
      .getManyAndCount();

    return { data, pagination: { total, page, pageSize } };
  }

  async findById(id: string): Promise<Plan> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) throw new NotFoundException(`方案 ${id} 不存在`);
    return plan;
  }

  /**
   * 订阅方案
   */
  async subscribeToPlan(userId: string, planId: string): Promise<UserPlan> {
    const plan = await this.findById(planId);
    const userPlan = this.userPlanRepository.create({
      userId,
      planId: plan.id,
      status: UserPlanStatus.ACTIVE,
      currentWeek: 1,
      currentDay: 1,
      completedDays: 0,
      totalCalories: 0,
      totalMinutes: 0,
      startedAt: new Date(),
    });
    const saved = await this.userPlanRepository.save(userPlan);

    // 方案订阅数 +1
    await this.planRepository.increment({ id: plan.id }, 'enrolledCount', 1);

    return saved;
  }

  /**
   * 用户的方案列表
   */
  async getMyPlans(userId: string) {
    const userPlans = await this.userPlanRepository.find({
      where: { userId },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });
    return { data: userPlans };
  }

  /**
   * 推荐方案（基于用户最近的训练记录 + 偏好）
   * 简化：返回热门 + 同 level 的前 N 个
   */
  async getRecommend(userId: string, limit = 5) {
    // 找该用户最近订阅的 plan
    const lastUserPlan = await this.userPlanRepository.findOne({
      where: { userId },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });

    const baseLevel = lastUserPlan?.plan?.level ?? PlanLevel.BEGINNER;

    const plans = await this.planRepository.find({
      where: {
        level: baseLevel,
        status: PlanStatus.PUBLISHED,
      },
      take: limit,
      order: { enrolledCount: 'DESC', rating: 'DESC' },
    });

    return { data: plans };
  }

  /**
   * 获取当前周/日对应的训练
   */
  async getCurrentWorkout(userId: string, userPlanId: string) {
    const userPlan = await this.userPlanRepository.findOne({
      where: { id: userPlanId, userId },
      relations: ['plan'],
    });
    if (!userPlan) throw new NotFoundException('用户方案不存在');
    if (userPlan.status !== UserPlanStatus.ACTIVE) {
      throw new BadRequestException('方案未在进行中');
    }

    const plan = userPlan.plan;
    const week = plan.structure?.[userPlan.currentWeek - 1];
    if (!week) return { data: null, message: '已超出计划范围' };

    const day = week.workouts.find((w) => w.day === userPlan.currentDay);
    if (!day) return { data: null, message: '本日休息' };

    return { data: { week, day, userPlan } };
  }

  /**
   * 推进计划（完成某一天）
   */
  async advanceProgress(userId: string, userPlanId: string, payload: { calories?: number; minutes?: number }) {
    const userPlan = await this.userPlanRepository.findOne({
      where: { id: userPlanId, userId },
      relations: ['plan'],
    });
    if (!userPlan) throw new NotFoundException('用户方案不存在');
    if (userPlan.status !== UserPlanStatus.ACTIVE) {
      throw new BadRequestException('方案未在进行中');
    }

    userPlan.completedDays += 1;
    if (payload.calories) userPlan.totalCalories += payload.calories;
    if (payload.minutes) userPlan.totalMinutes += payload.minutes;

    // 推进天/周
    const plan = userPlan.plan;
    const currentWeek = plan.structure?.[userPlan.currentWeek - 1];
    if (currentWeek) {
      if (userPlan.currentDay < currentWeek.workouts.length) {
        userPlan.currentDay += 1;
      } else {
        userPlan.currentWeek += 1;
        userPlan.currentDay = 1;
      }
    }

    // 检查是否完成
    if (userPlan.currentWeek > plan.durationWeeks) {
      userPlan.status = UserPlanStatus.COMPLETED;
      userPlan.completedAt = new Date();
    }

    await this.userPlanRepository.save(userPlan);
    return { data: userPlan };
  }

  /**
   * 手动建方案（管理员/CMS 用）
   */
  async createPlan(dto: CreatePlanDto): Promise<Plan> {
    const generated = PlanGenerator.generate({
      goal: dto.goal,
      level: dto.level,
      daysPerWeek: dto.daysPerWeek,
      durationWeeks: dto.durationWeeks,
    });
    const plan = this.planRepository.create({
      name: dto.name,
      goal: dto.goal,
      level: dto.level,
      daysPerWeek: dto.daysPerWeek,
      durationWeeks: dto.durationWeeks,
      structure: generated.structure as any,
      estimatedCalories: generated.estimatedCalories,
      status: PlanStatus.PUBLISHED,
      isSystem: true,
    });
    return this.planRepository.save(plan);
  }
}
