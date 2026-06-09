import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserGender, UserStatus } from './entities/user.entity';
import {
  RegisterDto,
  LoginDto,
  UpdateUserDto,
  SetFtpDto,
  UserResponseDto,
} from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async register(dto: RegisterDto): Promise<UserResponseDto> {
    const { phone, password, nickname } = dto;

    // 检查手机号是否已注册
    const existUser = await this.userRepository.findOne({ where: { phone } });
    if (existUser) {
      throw new UnauthorizedException('手机号已注册');
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建用户
    const user = this.userRepository.create({
      phone,
      passwordHash,
      nickname,
      gender: UserGender.UNKNOWN,
      status: UserStatus.ACTIVE,
    });

    await this.userRepository.save(user);

    return this.formatUserResponse(user);
  }

  async login(dto: LoginDto): Promise<UserResponseDto> {
    const { phone, password } = dto;

    const user = await this.userRepository.findOne({ where: { phone } });
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (user.status === UserStatus.BANNED) {
      throw new UnauthorizedException('账号已被禁用');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    return this.formatUserResponse(user);
  }

  async findById(id: string): Promise<User> {
    return this.userRepository.findOne({ where: { id } });
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.findById(id);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    Object.assign(user, dto);
    await this.userRepository.save(user);

    return this.formatUserResponse(user);
  }

  async setFtp(id: string, dto: SetFtpDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    user.ftp = dto.ftp;
    user.lthr = dto.lthr;

    // 计算W/kg
    if (user.weight) {
      user.wKg = Number((user.ftp / user.weight).toFixed(2));
    }

    // 更新最大功率
    if (dto.maxPower && dto.maxPower > user.mhr) {
      // mhr应该是静态的，这里简化处理
    }

    await this.userRepository.save(user);
    return user;
  }

  async findAll(page = 1, pageSize = 20): Promise<{ data: User[]; total: number }> {
    const [data, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    return { data, total };
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { phone } });
  }

  private formatUserResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      gender: user.gender,
      birthYear: user.birthYear,
      height: user.height,
      weight: user.weight,
      ftp: user.ftp,
      wKg: user.wKg,
      lthr: user.lthr,
      level: user.level,
      points: user.points,
      createdAt: user.createdAt,
    };
  }
}