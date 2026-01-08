import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, MemberType } from '../users/entities/user.entity';
import { GuestMigrationService } from './guest-migration.service';
import { MembershipService } from '../users/membership.service';
import { DeviceLimitService } from '../devices/device-limit.service';

export interface RegisterDto {
  email?: string;
  phone?: string;
  password: string;
  username: string;
  guestUserId?: string; // For guest migration
}

export interface LoginDto {
  email?: string;
  phone?: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string | null;
    phone: string | null;
    memberType: MemberType;
    memberExpireAt: Date | null;
  };
}

export interface JwtPayload {
  sub: string; // user id
  email: string | null;
  phone: string | null;
  memberType: MemberType;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly guestMigrationService: GuestMigrationService,
    private readonly membershipService: MembershipService,
    private readonly deviceLimitService: DeviceLimitService,
  ) {}

  /**
   * Register new user with email/phone
   */
  async register(dto: RegisterDto): Promise<AuthTokens> {
    // Check if email or phone already exists
    if (dto.email) {
      const existing = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException({
          code: 'EMAIL_ALREADY_EXISTS',
          message: '该邮箱已被注册',
        });
      }
    }

    if (dto.phone) {
      const existing = await this.userRepository.findOne({
        where: { phone: dto.phone },
      });
      if (existing) {
        throw new ConflictException({
          code: 'PHONE_ALREADY_EXISTS',
          message: '该手机号已被注册',
        });
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = this.userRepository.create({
      email: dto.email || null,
      phone: dto.phone || null,
      passwordHash,
      username: dto.username,
      memberType: MemberType.FREE,
    });

    await this.userRepository.save(user);

    // Grant 14-day trial
    await this.membershipService.grantTrial(user.id);

    // Migrate guest data if provided
    if (dto.guestUserId) {
      const canMigrate = await this.guestMigrationService.canMigrateGuest(
        dto.guestUserId,
      );
      if (canMigrate) {
        await this.guestMigrationService.migrateGuestData(
          dto.guestUserId,
          user.id,
        );
      }
    }

    // Refresh user data after trial grant
    const updatedUser = await this.userRepository.findOne({
      where: { id: user.id },
    });

    return this.generateTokens(updatedUser!);
  }

  /**
   * Login with email/phone and password
   */
  async login(dto: LoginDto): Promise<AuthTokens> {
    // Find user by email or phone
    let user: User | null = null;

    if (dto.email) {
      user = await this.userRepository.findOne({
        where: { email: dto.email },
      });
    } else if (dto.phone) {
      user = await this.userRepository.findOne({
        where: { phone: dto.phone },
      });
    }

    if (!user) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: '邮箱/手机号或密码错误',
      });
    }

    // Verify password
    if (!user.passwordHash) {
      throw new UnauthorizedException({
        code: 'NO_PASSWORD_SET',
        message: '该账号未设置密码',
      });
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: '邮箱/手机号或密码错误',
      });
    }

    // Check device limit
    try {
      await this.deviceLimitService.enforceDeviceLimit(user.id);
    } catch (error) {
      // Allow login but warn about device limit
      console.warn('Device limit reached for user:', user.id);
    }

    return this.generateTokens(user);
  }

  /**
   * Validate user for JWT strategy
   */
  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
    });
  }

  /**
   * Generate access and refresh tokens
   */
  generateTokens(user: User): AuthTokens {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      memberType: user.memberType,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        memberType: user.memberType,
        memberExpireAt: user.memberExpireAt,
      },
    };
  }

  /**
   * Refresh access token
   */
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.validateUser(payload.sub);

      if (!user) {
        throw new UnauthorizedException({
          code: 'USER_NOT_FOUND',
          message: '用户不存在',
        });
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token 无效或已过期',
      });
    }
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException({
        code: 'USER_NOT_FOUND',
        message: '用户不存在',
      });
    }

    const isValid = await bcrypt.compare(oldPassword, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException({
        code: 'INVALID_PASSWORD',
        message: '当前密码错误',
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);
  }

  /**
   * Request password reset (placeholder - needs email service)
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists
      return;
    }

    // TODO: Generate reset token and send email
    // For now, this is a placeholder
    console.log(`Password reset requested for user: ${user.id}`);
  }
}
