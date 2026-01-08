import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
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
  constructor(private readonly devicesService: DevicesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check for Bearer token first (authenticated user)
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // For now, just validate token format
      // Full JWT validation will be implemented in auth module
      const token = authHeader.substring(7);
      if (token) {
        // Extract user from token (placeholder until JWT is fully implemented)
        // In production, this would verify JWT and get user ID
        if (token.startsWith('mock-jwt-for-')) {
          const userId = token.replace('mock-jwt-for-', '');
          request.user = { id: userId, isGuest: false };
          return true;
        }
        // Real JWT validation will be added later
        request.user = { isGuest: false };
        return true;
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
