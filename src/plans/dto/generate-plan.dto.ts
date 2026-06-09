import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { PlanGoal, PlanLevel } from '../entities/plan.entity';

/**
 * 问卷生成方案请求 DTO
 */
export class GeneratePlanDto {
  @ApiProperty({ enum: PlanGoal, description: '训练目标' })
  @IsEnum(PlanGoal)
  goal: PlanGoal;

  @ApiProperty({ enum: PlanLevel, description: '当前水平' })
  @IsEnum(PlanLevel)
  level: PlanLevel;

  @ApiProperty({ minimum: 2, maximum: 7, description: '每周训练天数' })
  @IsInt()
  @Min(2)
  @Max(7)
  daysPerWeek: number;

  @ApiProperty({ minimum: 2, maximum: 12, description: '计划总周数' })
  @IsInt()
  @Min(2)
  @Max(12)
  durationWeeks: number;

  @ApiPropertyOptional({ description: '用户身高 (cm)' })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(250)
  heightCm?: number;

  @ApiPropertyOptional({ description: '用户体重 (kg)' })
  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(200)
  weightKg?: number;

  @ApiPropertyOptional({ description: '年龄' })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(100)
  age?: number;

  @ApiPropertyOptional({ description: 'FTP 功率阈值 (W)，可选' })
  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(500)
  ftp?: number;

  @ApiPropertyOptional({ description: '最大心率，可选' })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(230)
  maxHeartRate?: number;

  @ApiPropertyOptional({ description: '偏好课程类型，逗号分隔' })
  @IsOptional()
  @IsString()
  preferredTypes?: string;

  @ApiPropertyOptional({ description: '其他备注/伤病情况' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePlanDto {
  @ApiProperty({ description: '方案名称' })
  @IsString()
  name: string;

  @ApiProperty({ enum: PlanGoal })
  @IsEnum(PlanGoal)
  goal: PlanGoal;

  @ApiProperty({ enum: PlanLevel })
  @IsEnum(PlanLevel)
  level: PlanLevel;

  @ApiProperty({ minimum: 2, maximum: 7 })
  @IsInt()
  @Min(2)
  @Max(7)
  daysPerWeek: number;

  @ApiProperty({ minimum: 2, maximum: 12 })
  @IsInt()
  @Min(2)
  @Max(12)
  durationWeeks: number;
}
