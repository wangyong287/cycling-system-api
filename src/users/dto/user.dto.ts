import { IsString, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { UserGender } from '../entities/user.entity';

// 注册
export class RegisterDto {
  @ApiProperty({ example: '13800138000' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;

  @ApiProperty({ example: '骑手' })
  @IsString()
  nickname: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inviteCode?: string;
}

// 登录
export class LoginDto {
  @ApiProperty({ example: '13800138000' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;
}

// 更新用户信息
export class UpdateUserDto {
  @ApiPropertyOptional({ example: '新昵称' })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({ example: 'https://xxx.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ enum: UserGender })
  @IsOptional()
  @IsEnum(UserGender)
  gender?: UserGender;

  @ApiPropertyOptional({ example: 1995 })
  @IsOptional()
  @IsNumber()
  @Min(1900)
  @Max(2010)
  birthYear?: number;

  @ApiPropertyOptional({ example: 175 })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional({ example: 70 })
  @IsOptional()
  @IsNumber()
  weight?: number;
}

// 设置FTP
export class SetFtpDto {
  @ApiProperty({ example: 300 })
  @IsNumber()
  @Min(50)
  @Max(1000)
  ftp: number;

  @ApiProperty({ example: 185 })
  @IsNumber()
  @Min(100)
  @Max(220)
  lthr: number;

  @ApiPropertyOptional({ example: 520 })
  @IsOptional()
  @IsNumber()
  maxPower?: number;

  @ApiPropertyOptional({ enum: ['manual', '20min_test', 'ramp_test'] })
  @IsOptional()
  @IsString()
  source?: 'manual' | '20min_test' | 'ramp_test';
}

// 用户响应
export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  nickname: string;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiPropertyOptional({ enum: UserGender })
  gender?: UserGender;

  @ApiPropertyOptional()
  birthYear?: number;

  @ApiPropertyOptional()
  height?: number;

  @ApiPropertyOptional()
  weight?: number;

  @ApiProperty()
  ftp: number;

  @ApiProperty()
  wKg: number;

  @ApiProperty()
  lthr: number;

  @ApiProperty()
  level: number;

  @ApiProperty()
  points: number;

  @ApiProperty()
  createdAt: Date;
}

// 用户骑行记录查询
export class GetRidesQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pageSize?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;
}