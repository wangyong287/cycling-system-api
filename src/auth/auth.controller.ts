import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegisterDto, LoginDto } from '../users/dto/user.dto';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  async register(@Body() dto: RegisterDto) {
    const user = await this.usersService.register(dto);
    const token = await this.authService.generateToken(user.id);
    return {
      data: {
        ...user,
        ...token,
      },
    };
  }

  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  async login(@Body() dto: LoginDto) {
    const user = await this.usersService.login(dto);
    const token = await this.authService.generateToken(user.id);
    return {
      data: {
        ...user,
        ...token,
      },
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: '刷新Token' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async refresh(@Request() req) {
    // 从header获取refresh_token
    const token = await this.authService.refreshToken(
      req.headers['x-refresh-token'],
    );
    return { data: token };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '退出登录' })
  async logout() {
    // JWT是无状态的，直接返回成功即可
    // 如需Redis黑名单可在此实现
    return { message: '退出成功' };
  }
}