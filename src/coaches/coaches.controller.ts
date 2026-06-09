import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CoachesService } from './coaches.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('教练管理')
@Controller('coaches')
export class CoachesController {
  constructor(private readonly service: CoachesService) {}

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '申请成为教练' })
  async apply(@Body() body: { title: string; bio: string }) {
    // TODO: 从request获取userId
    const userId = '1';
    const coach = await this.service.apply(userId, body);
    return { data: coach };
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '我的教练信息' })
  async getMyCoach() {
    const userId = '1';
    const coach = await this.service.findByUserId(userId);
    return { data: coach };
  }
}

// 管理端
@ApiTags('管理-教练管理')
@Controller('admin/coaches')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminCoachesController {
  constructor(private readonly service: CoachesService) {}

  @Get()
  @ApiOperation({ summary: '教练列表' })
  async findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: '审核通过' })
  async approve(@Param('id') id: string) {
    const coach = await this.service.approve(id);
    return { data: coach };
  }

  @Get('roles')
  @ApiOperation({ summary: '权限角色列表' })
  async getRoles() {
    const roles = await this.service.getRoles();
    return { data: roles };
  }

  @Post('grant')
  @ApiOperation({ summary: '授予权限' })
  async grant(@Body() body: { userId: string; roleId: string }) {
    // TODO: 从request获取grantedBy
    const grantedBy = '1';
    const perm = await this.service.grantPermission(body.userId, body.roleId, grantedBy);
    return { data: perm };
  }
}