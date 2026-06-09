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
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('课程管理')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: '获取课程列表' })
  async findAll(
    @Query()
    query: {
      type?: string;
      difficulty?: string;
      durationMin?: number;
      durationMax?: number;
      page?: number;
      pageSize?: number;
    },
  ) {
    return this.coursesService.findAll(query);
  }

  @Get('recommend')
  @ApiOperation({ summary: '推荐课程（公开）' })
  async recommend(@Query('limit') limit?: number) {
    return this.coursesService.getRecommend(limit ? +limit : 5);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取课程详情' })
  async findById(@Param('id') id: string) {
    const course = await this.coursesService.findById(id);
    return { data: course };
  }

  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '预约课程' })
  async enroll(@Param('id') id: string, @Request() req) {
    // TODO: 实现预约逻辑
    return { data: { courseId: id, userId: req.user.id } };
  }
}