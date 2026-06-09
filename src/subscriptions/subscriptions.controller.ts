import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('订阅管理')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({ summary: '获取订阅套餐' })
  async getPlans() {
    const plans = await this.service.getPlans();
    return { data: plans };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '订阅套餐' })
  async subscribe(
    @Body() body: { planId: string },
  ) {
    // TODO: 从request获取userId
    const userId = '1';
    const subscription = await this.service.subscribe(userId, body.planId);
    return { data: subscription };
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '我的订阅' })
  async getMySubscription() {
    const userId = '1';
    const subscription = await this.service.getUserSubscription(userId);
    return { data: subscription };
  }

  @Get('check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '检查订阅状态' })
  async checkSubscription() {
    const userId = '1';
    const isSubscribed = await this.service.isSubscribed(userId);
    return { data: { subscribed: isSubscribed } };
  }
}

// 管理端控制器
@ApiTags('管理-订阅管理')
@Controller('admin/subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminSubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: '订阅列表' })
  async findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Post('plans')
  @ApiOperation({ summary: '创建套餐' })
  async createPlan(@Body() body: any) {
    const plan = await this.service.createPlan(body);
    return { data: plan };
  }

  @Put('plans/:id')
  @ApiOperation({ summary: '更新套餐' })
  async updatePlan(@Param('id') id: string, @Body() body: any) {
    const plan = await this.service.updatePlan(id, body);
    return { data: plan };
  }
}