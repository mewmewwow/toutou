import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './entities/device.entity';
import { User, MemberType } from '../users/entities/user.entity';

@Injectable()
export class DevicesService {
  // Fingerprint must be 64 character hex string (SHA-256)
  private readonly FINGERPRINT_REGEX = /^[a-f0-9]{64}$/i;
  private readonly FINGERPRINT_LENGTH = 64;

  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Validate device fingerprint format
   * Must be a 64-character hexadecimal string (SHA-256 hash)
   */
  async validateFingerprint(fingerprint: string): Promise<boolean> {
    if (!fingerprint || fingerprint.length !== this.FINGERPRINT_LENGTH) {
      throw new BadRequestException({
        code: 'INVALID_FINGERPRINT',
        message: '设备指纹格式无效，必须为64位十六进制字符串',
      });
    }

    if (!this.FINGERPRINT_REGEX.test(fingerprint)) {
      throw new BadRequestException({
        code: 'INVALID_FINGERPRINT',
        message: '设备指纹格式无效，必须为64位十六进制字符串',
      });
    }

    return true;
  }

  /**
   * Get or create a guest user based on device fingerprint
   * If fingerprint exists, return existing guest user
   * If fingerprint is new, create new guest user and device record
   */
  async getOrCreateGuestUser(fingerprint: string): Promise<User> {
    // Normalize fingerprint to lowercase
    const normalizedFingerprint = fingerprint.toLowerCase();

    // Validate fingerprint format
    await this.validateFingerprint(normalizedFingerprint);

    // Check for existing user with this fingerprint
    let user = await this.userRepository.findOne({
      where: { deviceFingerprint: normalizedFingerprint },
    });

    if (user) {
      // Update last active timestamp
      await this.updateLastActive(normalizedFingerprint);
      return user;
    }

    // Create new guest user
    try {
      user = this.userRepository.create({
        username: `访客${Date.now().toString(36).slice(-6)}`,
        memberType: MemberType.GUEST,
        deviceFingerprint: normalizedFingerprint,
      });

      await this.userRepository.save(user);

      // Create device record
      const device = this.deviceRepository.create({
        userId: user.id,
        deviceFingerprint: normalizedFingerprint,
        lastActiveAt: new Date(),
      });

      await this.deviceRepository.save(device);

      return user;
    } catch (error: any) {
      // Handle race condition - another request might have created the user
      if (error.message?.includes('duplicate key') || error.code === '23505') {
        const existingUser = await this.userRepository.findOne({
          where: { deviceFingerprint: normalizedFingerprint },
        });

        if (existingUser) {
          return existingUser;
        }
      }
      throw error;
    }
  }

  /**
   * Update device last active timestamp
   */
  async updateLastActive(fingerprint: string): Promise<void> {
    await this.deviceRepository.update(
      { deviceFingerprint: fingerprint.toLowerCase() },
      { lastActiveAt: new Date() },
    );
  }

  /**
   * Get user by fingerprint
   */
  async getUserByFingerprint(fingerprint: string): Promise<User | null> {
    const normalizedFingerprint = fingerprint.toLowerCase();
    return this.userRepository.findOne({
      where: { deviceFingerprint: normalizedFingerprint },
    });
  }

  /**
   * Get device by fingerprint
   */
  async getDeviceByFingerprint(fingerprint: string): Promise<Device | null> {
    return this.deviceRepository.findOne({
      where: { deviceFingerprint: fingerprint.toLowerCase() },
    });
  }

  /**
   * Get all devices for a user
   */
  async getUserDevices(userId: string): Promise<Device[]> {
    return this.deviceRepository.find({
      where: { userId },
      order: { lastActiveAt: 'DESC' },
    });
  }

  /**
   * Register a device for an existing user
   */
  async registerDevice(
    userId: string,
    fingerprint: string,
    deviceName?: string,
  ): Promise<Device> {
    const normalizedFingerprint = fingerprint.toLowerCase();

    await this.validateFingerprint(normalizedFingerprint);

    // Check if device already exists
    let device = await this.deviceRepository.findOne({
      where: { deviceFingerprint: normalizedFingerprint },
    });

    if (device) {
      // Update device to associate with user
      device.userId = userId;
      device.deviceName = deviceName || device.deviceName;
      device.lastActiveAt = new Date();
      await this.deviceRepository.save(device);
      return device;
    }

    // Create new device
    device = this.deviceRepository.create({
      userId,
      deviceFingerprint: normalizedFingerprint,
      deviceName,
      lastActiveAt: new Date(),
    });

    return this.deviceRepository.save(device);
  }
}
