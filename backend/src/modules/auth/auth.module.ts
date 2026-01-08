import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Card } from '../fsrs/entities/card.entity';
import { LearningSession } from '../learning/entities/learning-session.entity';
import { TestAttempt } from '../tests/entities/test-attempt.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GuestMigrationService } from './guest-migration.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsersModule } from '../users/users.module';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Card, LearningSession, TestAttempt]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
      signOptions: {
        expiresIn: '15m',
      },
    }),
    UsersModule,
    DevicesModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GuestMigrationService,
    JwtStrategy,
    LocalStrategy,
    JwtAuthGuard,
  ],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
