import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('设备管理')
@Controller('devices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  @ApiOperation({ summary: '获取设备列表' })
  async list() {
    // TODO: 从request获取userId
    return { data: [] };
  }

  @Post('bind')
  @ApiOperation({ summary: '绑定设备' })
  async bind() {
    return { data: {} };
  }
}