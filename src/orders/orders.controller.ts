import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('订单管理')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Get()
  @ApiOperation({ summary: '我的订单' })
  async findMyOrders() {
    // TODO: 从request获取userId
    const userId = '1';
    const orders = await this.service.findByUserId(userId);
    return { data: orders };
  }

  @Post('pay')
  @ApiOperation({ summary: '创建订单' })
  async createOrder(
    @Body() body: { planId: string; paymentMethod: string },
  ) {
    // TODO: 从request获取userId
    const userId = '1';
    const order = await this.service.create(userId, body.planId, body.paymentMethod as any);
    return { data: order };
  }
}

// 管理端
@ApiTags('管理-订单管理')
@Controller('admin/orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminOrdersController {
  constructor(private readonly service: OrdersService) {}

  @Get()
  @ApiOperation({ summary: '订单列表' })
  async findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get('revenue')
  @ApiOperation({ summary: '收入统计' })
  async getRevenue(@Query() query: { startDate?: string; endDate?: string }) {
    const revenue = await this.service.getRevenue(query.startDate, query.endDate);
    return { data: { revenue } };
  }
}