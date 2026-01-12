import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { GuestMigrationService } from './guest-migration.service';
import { RegisterDto, LoginDto, ChangePasswordDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GuestAuthGuard } from '../../common/guards/guest-auth.guard';

// 定义经过 JWT 认证后的请求类型
interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: string;
    isGuest?: boolean;
    [key: string]: unknown;
  };
}

@Controller('auth')
@UseGuards(ThrottlerGuard)  // 防止暴力破解攻击
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly guestMigrationService: GuestMigrationService,
  ) {}

  /**
   * POST /auth/register
   * Register new user
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    // Validate that either email or phone is provided
    if (!dto.email && !dto.phone) {
      throw new BadRequestException({
        code: 'MISSING_CREDENTIALS',
        message: '请提供邮箱或手机号',
      });
    }

    return this.authService.register(dto);
  }

  /**
   * POST /auth/login
   * Login with email/phone and password
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException({
        code: 'MISSING_CREDENTIALS',
        message: '请提供邮箱或手机号',
      });
    }

    return this.authService.login(dto);
  }

  /**
   * POST /auth/refresh
   * Refresh access token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  /**
   * POST /auth/change-password
   * Change user password (requires authentication)
   */
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(@Request() req: AuthenticatedRequest, @Body() dto: ChangePasswordDto) {
    await this.authService.changePassword(
      req.user.id,
      dto.oldPassword,
      dto.newPassword,
    );
    return { message: '密码修改成功' };
  }

  /**
   * POST /auth/forgot-password
   * Request password reset
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string) {
    await this.authService.requestPasswordReset(email);
    return {
      message: '如果该邮箱已注册，您将收到密码重置邮件',
    };
  }

  /**
   * POST /auth/guest/migrate
   * Migrate guest data after registration (requires auth)
   */
  @Post('guest/migrate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async migrateGuest(@Request() req: AuthenticatedRequest, @Body('guestUserId') guestUserId: string) {
    const result = await this.guestMigrationService.migrateGuestData(
      guestUserId,
      req.user.id,
    );
    return {
      message: '数据迁移成功',
      ...result,
    };
  }

  /**
   * GET /auth/guest/preview
   * Preview guest data before migration
   */
  @Get('guest/preview')
  @UseGuards(GuestAuthGuard)
  async previewGuestData(@Request() req: AuthenticatedRequest) {
    const summary = await this.guestMigrationService.getGuestDataSummary(
      req.user.id,
    );
    const hasData = await this.guestMigrationService.hasGuestData(req.user.id);

    return {
      summary,
      hasData,
      canMigrate: req.user.isGuest && hasData,
    };
  }

  /**
   * GET /auth/me
   * Get current user info
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@Request() req: AuthenticatedRequest) {
    return req.user;
  }
}
