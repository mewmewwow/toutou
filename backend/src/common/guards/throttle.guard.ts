import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { getRedisClient } from '../../config/redis.config';
import { AppException } from '../exceptions/app.exception';

export const THROTTLE_KEY = 'throttle';

export interface ThrottleOptions {
  limit: number;
  ttl: number; // in seconds
  keyPrefix?: string;
}

export const Throttle = (options: ThrottleOptions) => {
  return (target: object, key?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(THROTTLE_KEY, options, descriptor.value);
    } else {
      Reflect.defineMetadata(THROTTLE_KEY, options, target);
    }
    return descriptor || target;
  };
};

@Injectable()
export class ThrottleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<ThrottleOptions>(THROTTLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!options) {
      return true; // No throttling configured
    }

    const request = context.switchToHttp().getRequest<Request>();
    const key = this.generateKey(request, options.keyPrefix);

    const redis = getRedisClient();
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, options.ttl);
    }

    if (current > options.limit) {
      const ttl = await redis.ttl(key);
      throw new AppException(
        'RATE_LIMIT_EXCEEDED',
        {
          retryAfter: ttl,
          limit: options.limit,
          window: options.ttl >= 60 ? 'minute' : 'second',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private generateKey(request: Request, prefix?: string): string {
    const userId = (request as Record<string, unknown>).user
      ? ((request as Record<string, unknown>).user as Record<string, unknown>).id
      : null;
    const fingerprint = request.headers['x-device-fingerprint'];
    const identifier = userId || fingerprint || request.ip;

    return `throttle:${prefix || 'default'}:${identifier}`;
  }
}

// Default throttle options for learning submissions (60/minute)
export const LearningThrottle = () => Throttle({ limit: 60, ttl: 60, keyPrefix: 'learning' });

// SMS throttle (1 per 60 seconds)
export const SmsThrottle = () => Throttle({ limit: 1, ttl: 60, keyPrefix: 'sms' });

// Login throttle (5 attempts per 5 minutes)
export const LoginThrottle = () => Throttle({ limit: 5, ttl: 300, keyPrefix: 'login' });
