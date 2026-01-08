import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email', // Can be email or phone
      passwordField: 'password',
    });
  }

  async validate(emailOrPhone: string, password: string): Promise<any> {
    // Determine if input is email or phone
    const isEmail = emailOrPhone.includes('@');

    const loginDto = isEmail
      ? { email: emailOrPhone, password }
      : { phone: emailOrPhone, password };

    try {
      const result = await this.authService.login(loginDto);
      return result.user;
    } catch (error) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: '邮箱/手机号或密码错误',
      });
    }
  }
}
