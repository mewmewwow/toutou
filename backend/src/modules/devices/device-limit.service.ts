import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './entities/device.entity';

@Injectable()
export class DeviceLimitService {
  private readonly maxDevices = 3;

  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
  ) {}

  /**
   * Check if user has reached device limit
   */
  async hasReachedLimit(userId: string): Promise<boolean> {
    const count = await this.deviceRepository.count({
      where: { userId, isActive: true },
    });

    return count >= this.maxDevices;
  }

  /**
   * Get device count for user
   */
  async getDeviceCount(userId: string): Promise<number> {
    return this.deviceRepository.count({
      where: { userId, isActive: true },
    });
  }

  /**
   * Enforce device limit before adding new device
   */
  async enforceDeviceLimit(userId: string): Promise<void> {
    const hasReached = await this.hasReachedLimit(userId);

    if (hasReached) {
      throw new ForbiddenException({
        code: 'DEVICE_LIMIT_REACHED',
        message: `您已达到设备数量上限（${this.maxDevices}台），请先移除其他设备`,
        maxDevices: this.maxDevices,
      });
    }
  }

  /**
   * Deactivate a device
   */
  async deactivateDevice(deviceId: string, userId: string): Promise<void> {
    const device = await this.deviceRepository.findOne({
      where: { id: deviceId, userId },
    });

    if (!device) {
      throw new Error('Device not found');
    }

    device.isActive = false;
    device.lastActiveAt = new Date();
    await this.deviceRepository.save(device);
  }

  /**
   * Get all active devices for user
   */
  async getActiveDevices(userId: string): Promise<Device[]> {
    return this.deviceRepository.find({
      where: { userId, isActive: true },
      order: { lastActiveAt: 'DESC' },
    });
  }

  /**
   * Get max device limit
   */
  getMaxDevices(): number {
    return this.maxDevices;
  }

  /**
   * Get remaining device slots
   */
  async getRemainingSlots(userId: string): Promise<number> {
    const count = await this.getDeviceCount(userId);
    return Math.max(0, this.maxDevices - count);
  }
}
