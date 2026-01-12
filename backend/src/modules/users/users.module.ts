import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MembershipService } from './membership.service';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), DevicesModule],
  controllers: [UsersController],
  providers: [UsersService, MembershipService],
  exports: [UsersService, MembershipService, TypeOrmModule],
})
export class UsersModule {}

