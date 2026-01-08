import {
  Controller,
  Get,
  Patch,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UsersService, UpdateUserDto } from './users.service';
import { MembershipService } from './membership.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DeviceLimitService } from '../devices/device-limit.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly membershipService: MembershipService,
    private readonly deviceLimitService: DeviceLimitService,
  ) {}

  /**
   * GET /users/me
   * Get current user profile
   */
  @Get('me')
  async getProfile(@Request() req) {
    const user = await this.usersService.findById(req.user.id);
    if (!user) {
      throw new Error('User not found');
    }

    const trialInfo = await this.membershipService.getTrialInfo(user.id);
    const deviceCount = await this.deviceLimitService.getDeviceCount(user.id);
    const maxDevices = this.deviceLimitService.getMaxDevices();

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      birthday: user.birthday,
      totalCoins: user.totalCoins,
      totalCredits: user.totalCredits,
      level: user.level,
      memberType: user.memberType,
      memberExpireAt: user.memberExpireAt,
      pronunciationPref: user.pronunciationPref,
      trial: trialInfo,
      devices: {
        count: deviceCount,
        max: maxDevices,
        remaining: maxDevices - deviceCount,
      },
      createdAt: user.createdAt,
    };
  }

  /**
   * PATCH /users/me
   * Update current user profile
   */
  @Patch('me')
  async updateProfile(@Request() req, @Body() dto: UpdateUserDto) {
    const updatedUser = await this.usersService.updateProfile(req.user.id, dto);

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      avatar: updatedUser.avatar,
      birthday: updatedUser.birthday,
      pronunciationPref: updatedUser.pronunciationPref,
    };
  }

  /**
   * GET /users/me/devices
   * Get user's devices
   */
  @Get('me/devices')
  async getDevices(@Request() req) {
    const devices = await this.deviceLimitService.getActiveDevices(req.user.id);
    const maxDevices = this.deviceLimitService.getMaxDevices();

    return {
      devices: devices.map((d) => ({
        id: d.id,
        fingerprint: d.fingerprint,
        lastActiveAt: d.lastActiveAt,
        userAgent: d.userAgent,
        ipAddress: d.ipAddress,
      })),
      count: devices.length,
      max: maxDevices,
      remaining: maxDevices - devices.length,
    };
  }
}
