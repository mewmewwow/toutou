import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DevicesService } from '../../modules/devices/devices.service';

/**
 * Guard that allows either:
 * 1. Authenticated users with Bearer token (JWT)
 * 2. Guest users with X-Device-Fingerprint header
 *
 * Use this guard for endpoints that should be accessible to both
 * registered users and guests (like learning sessions for Unit 1)
 */
@Injectable()
export class GuestAuthGuard implements CanActivate {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check for Bearer token first (authenticated user)
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token) {
        try {
          // 验证 JWT token 并提取用户信息
          const payload = this.jwtService.verify(token);
          request.user = {
            id: payload.sub,
            email: payload.email,
            phone: payload.phone,
            memberType: payload.memberType,
            isGuest: false,
          };
          return true;
        } catch {
          // JWT 验证失败，尝试使用设备指纹
        }
      }
    }

    // Check for guest fingerprint
    const fingerprint = request.headers['x-device-fingerprint'];
    if (fingerprint) {
      try {
        const user = await this.devicesService.getOrCreateGuestUser(fingerprint);
        request.user = {
          id: user.id,
          isGuest: true,
          memberType: user.memberType,
        };
        return true;
      } catch (error) {
        throw new UnauthorizedException({
          code: 'INVALID_FINGERPRINT',
          message: '设备指纹无效',
        });
      }
    }

    // Neither token nor fingerprint provided
    throw new UnauthorizedException({
      code: 'AUTH_REQUIRED',
      message: '需要登录或提供设备指纹',
    });
  }
}
