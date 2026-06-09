import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coach, CoachPermission, Role, CoachStatus } from './entities/coach.entity';

@Injectable()
export class CoachesService {
  constructor(
    @InjectRepository(Coach)
    private coachRepo: Repository<Coach>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    @InjectRepository(CoachPermission)
    private permRepo: Repository<CoachPermission>,
  ) {}

  // 成为教练
  async apply(userId: string, data: { title: string; bio: string }): Promise<Coach> {
    const exist = await this.coachRepo.findOne({ where: { userId } });
    if (exist) throw new ForbiddenException('已是教练');

    const coach = this.coachRepo.create({
      userId,
      title: data.title,
      bio: data.bio,
      status: CoachStatus.PENDING,
    });

    return this.coachRepo.save(coach);
  }

  // 获取教练信息
  async findByUserId(userId: string): Promise<Coach | null> {
    return this.coachRepo.findOne({ where: { userId } });
  }

  // 检查用户是否是教练
  async isCoach(userId: string): Promise<boolean> {
    const coach = await this.findByUserId(userId);
    return coach?.status === CoachStatus.APPROVED;
  }

  // 检查是否是教练管理员
  async isCoachAdmin(userId: string): Promise<boolean> {
    const perm = await this.permRepo.findOne({
      where: { userId },
      relations: ['role'],
    });
    return (perm as any)?.role?.name === 'coach_admin';
  }

  // 检查是否是超级管理员
  async isSuperAdmin(userId: string): Promise<boolean> {
    const perm = await this.permRepo.findOne({
      where: { userId },
      relations: ['role'],
    });
    return (perm as any)?.role?.name === 'super_admin';
  }

  // 授予教练权限
  async grantPermission(
    targetUserId: string,
    roleId: string,
    grantedBy: string,
  ): Promise<CoachPermission> {
    // 检查权限
    const granterPerm = await this.permRepo.findOne({
      where: { userId: grantedBy },
    });
    if (!granterPerm) throw new ForbiddenException('无权限');

    const perm = this.permRepo.create({
      userId: targetUserId,
      roleId,
      grantedBy,
    });

    return this.permRepo.save(perm);
  }

  // 撤销权限
  async revokePermission(userId: string): Promise<void> {
    await this.permRepo.delete({ userId });
  }

  // 获取权限列表
  async getRoles(): Promise<Role[]> {
    return this.roleRepo.find();
  }

  // 获取教练列表
  async findAll(query: { page?: number; pageSize?: number; status?: string }) {
    const { page = 1, pageSize = 20 } = query;
    const qb = this.coachRepo.createQueryBuilder('coach')
      .leftJoinAndSelect('coach.user', 'user');

    if (query.status) {
      qb.andWhere('coach.status = :status', { status: query.status });
    }

    const [data, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data, pagination: { total, page, pageSize } };
  }

  // 审核教练
  async approve(coachId: string): Promise<Coach> {
    const coach = await this.coachRepo.findOne({ where: { id: coachId } });
    if (!coach) throw new NotFoundException('教练不存在');

    coach.status = CoachStatus.APPROVED;
    return this.coachRepo.save(coach);
  }
}