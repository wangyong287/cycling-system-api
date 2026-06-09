import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PointsService } from './points.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('积分管理')
@Controller('points')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('balance')
  @ApiOperation({ summary: '获取积分余额' })
  async getBalance() {
    // TODO: 从request获取userId
    const userId = '1';
    const balance = await this.pointsService.getBalance(userId);
    return { data: { balance } };
  }

  @Get('records')
  @ApiOperation({ summary: '获取积分记录' })
  async getRecords(
    @Query() query: { page?: number; pageSize?: number },
  ) {
    // TODO: 从request获取userId
    const userId = '1';
    return this.pointsService.getRecords(userId, query);
  }

  @Post('daily-login')
  @ApiOperation({ summary: '每日登录领奖' })
  async dailyLogin() {
    // TODO: 从request获取userId
    const userId = '1';
    const result = await this.pointsService.rewardDailyLogin(userId);
    return { data: result };
  }

  @Post('exchange')
  @ApiOperation({ summary: '积分兑换' })
  async exchange(
    @Body() body: { itemType: string; cost: number },
  ) {
    // TODO: 从request获取userId
    const userId = '1';
    const result = await this.pointsService.exchange(
      userId,
      body.itemType,
      body.cost,
    );
    return { data: result };
  }
}