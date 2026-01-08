import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './entities/device.entity';
import { DevicesService } from './devices.service';
import { DeviceLimitService } from './device-limit.service';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Device, User])],
  providers: [DevicesService, DeviceLimitService],
  exports: [DevicesService, DeviceLimitService],
})
export class DevicesModule {}
