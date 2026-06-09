import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course, CourseDifficulty, CourseStatus } from './entities/course.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
  ) {}

  async findAll(
    query: {
      type?: string;
      difficulty?: string;
      durationMin?: number;
      durationMax?: number;
      page?: number;
      pageSize?: number;
    } = {},
  ) {
    const { page = 1, pageSize = 20 } = query;
    const qb = this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.coach', 'coach')
      .where('course.status = :status', { status: CourseStatus.PUBLISHED });

    if (query.type) {
      qb.andWhere('course.type = :type', { type: query.type });
    }
    if (query.difficulty) {
      qb.andWhere('course.difficulty = :difficulty', {
        difficulty: query.difficulty,
      });
    }
    if (query.durationMin) {
      qb.andWhere('course.duration >= :durationMin', {
        durationMin: query.durationMin,
      });
    }
    if (query.durationMax) {
      qb.andWhere('course.duration <= :durationMax', {
        durationMax: query.durationMax,
      });
    }

    const [data, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy('course.createdAt', 'DESC')
      .getManyAndCount();

    return { data, pagination: { total, page, pageSize } };
  }

  async findById(id: string): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: ['coach'],
    });
    if (!course) {
      throw new NotFoundException('课程不存在');
    }
    return course;
  }

  async findByCoachId(coachId: string): Promise<Course[]> {
    return this.courseRepository.find({
      where: { coachId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 推荐课程（公开接口，未登录也能调）
   * 简化策略：按 enrolled_count + rating 排序，取前 N 个已发布课程
   */
  async getRecommend(limit = 5) {
    const data = await this.courseRepository.find({
      where: { status: CourseStatus.PUBLISHED },
      relations: ['coach'],
      order: { enrolledCount: 'DESC', rating: 'DESC' },
      take: limit,
    });
    return { data };
  }

  async create(data: Partial<Course>, coachId: string): Promise<Course> {
    const course = this.courseRepository.create({
      ...data,
      coachId,
    });
    return this.courseRepository.save(course);
  }

  async update(id: string, data: Partial<Course>): Promise<Course> {
    const course = await this.findById(id);
    Object.assign(course, data);
    return this.courseRepository.save(course);
  }

  async publish(id: string): Promise<Course> {
    const course = await this.findById(id);
    course.status = CourseStatus.PUBLISHED;
    course.publishedAt = new Date();
    return this.courseRepository.save(course);
  }
}