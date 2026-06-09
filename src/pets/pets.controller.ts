import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PetsService } from './pets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('宠物管理')
@Controller('pets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Get('types')
  @ApiOperation({ summary: '获取可领养宠物类型' })
  getTypes() {
    return { data: this.petsService.getAvailableTypes() };
  }

  @Post()
  @ApiOperation({ summary: '领养宠物' })
  async adopt(
    @Body() body: { petType: string; name?: string },
  ) {
    // TODO: 从request获取userId
    // const userId = req.user.id;
    const userId = '1';
    const pet = await this.petsService.adopt(userId, body.petType, body.name);
    return { data: pet };
  }

  @Get('me')
  @ApiOperation({ summary: '获取我的宠物' })
  async getMyPet() {
    // TODO: 从request获取userId
    const userId = '1';
    const pet = await this.petsService.findByUserId(userId);
    return { data: pet };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取宠物详情' })
  async getById(@Param('id') id: string) {
    const pet = await this.petsService.findById(id);
    return { data: pet };
  }

  @Post(':id/feed')
  @ApiOperation({ summary: '喂养宠物' })
  async feed(
    @Param('id') id: string,
    @Body() body: { foodType: string },
  ) {
    const pet = await this.petsService.feed(id, body.foodType);
    return { data: pet };
  }
}