import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { GeneratePlanDto, CreatePlanDto } from './dto/generate-plan.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlanGoal, PlanLevel } from './entities/plan.entity';

@ApiTags('训练计划')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  /**
   * 核心接口：问卷生成方案
   * 需要登录（拿 userId 关联用户方案）
   */
  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '根据问卷生成个性化训练计划' })
  async generate(@Request() req, @Body() dto: GeneratePlanDto) {
    return this.plansService.generatePlan(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: '方案库列表' })
  async findAll(
    @Query()
    query: {
      goal?: PlanGoal;
      level?: PlanLevel;
      page?: number;
      pageSize?: number;
    },
  ) {
    return this.plansService.findAll(query);
  }

  @Get('recommend')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '推荐方案（基于用户历史/水平）' })
  async recommend(@Request() req, @Query('limit') limit?: number) {
    return this.plansService.getRecommend(req.user.id, limit ? +limit : 5);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '我的训练计划' })
  async myPlans(@Request() req) {
    return this.plansService.getMyPlans(req.user.id);
  }

  @Get('my/:userPlanId/today')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前应进行的训练' })
  async todayWorkout(@Request() req, @Param('userPlanId') userPlanId: string) {
    return this.plansService.getCurrentWorkout(req.user.id, userPlanId);
  }

  @Get(':id')
  @ApiOperation({ summary: '方案详情' })
  async findById(@Param('id') id: string) {
    const plan = await this.plansService.findById(id);
    return { data: plan };
  }

  @Post(':id/subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '订阅方案' })
  async subscribe(@Request() req, @Param('id') id: string) {
    const userPlan = await this.plansService.subscribeToPlan(req.user.id, id);
    return { data: userPlan };
  }

  @Post('my/:userPlanId/progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '推进计划进度（完成某天）' })
  async advance(
    @Request() req,
    @Param('userPlanId') userPlanId: string,
    @Body() payload: { calories?: number; minutes?: number },
  ) {
    return this.plansService.advanceProgress(req.user.id, userPlanId, payload);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '手动创建方案（管理员/系统）' })
  async create(@Body() dto: CreatePlanDto) {
    const plan = await this.plansService.createPlan(dto);
    return { data: plan };
  }
}
