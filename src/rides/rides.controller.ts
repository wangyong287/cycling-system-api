import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RidesService } from './rides.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('骑行记录')
@Controller('rides')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Get()
  @ApiOperation({ summary: '获取骑行记录列表' })
  async findAll(
    @Query()
    query: { page?: number; pageSize?: number },
  ) {
    // TODO: 从request获取userId
    return { data: [], pagination: { total: 0, page: 1, pageSize: 20 } };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取骑行记录详情' })
  async findById(@Param('id') id: string) {
    const session = await this.ridesService.findById(id);
    return { data: session };
  }

  @Get('latest')
  @ApiOperation({ summary: '获取最近骑行记录' })
  async getLatest() {
    // TODO: 从request获取userId
    return { data: null };
  }
}