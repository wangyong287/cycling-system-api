import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { RegisterDto, LoginDto, UpdateUserDto, SetFtpDto, GetRidesQueryDto, UserResponseDto } from './dto/user.dto';

@ApiTags('用户管理')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiResponse({ status: 201, description: '注册成功' })
  async register(@Body() dto: RegisterDto) {
    const user = await this.usersService.register(dto);
    return { data: user };
  }

  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  async login(@Body() dto: LoginDto) {
    const user = await this.usersService.login(dto);
    return { data: user };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  async getCurrentUser(@Request() req) {
    const user = await this.usersService.findById(req.user.id);
    return { data: user };
  }

  @Put('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新用户信息' })
  async updateUser(@Request() req, @Body() dto: UpdateUserDto) {
    const user = await this.usersService.update(req.user.id, dto);
    return { data: user };
  }

  @Put('me/ftp')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '设置FTP' })
  async setFtp(@Request() req, @Body() dto: SetFtpDto) {
    const user = await this.usersService.setFtp(req.user.id, dto);
    return { data: user };
  }

  @Get('me/rides')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取骑行记录' })
  async getRides(
    @Request() req,
    @Query() query: GetRidesQueryDto,
  ) {
    // TODO: 实现骑行记录查询
    return { data: [], pagination: { total: 0, page: 1, pageSize: 20 } };
  }
}