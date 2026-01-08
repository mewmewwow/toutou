import { Test, TestingModule } from '@nestjs/testing';
import { DevicesService } from '../../../src/modules/devices/devices.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Device } from '../../../src/modules/devices/entities/device.entity';
import { User } from '../../../src/modules/users/entities/user.entity';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

describe('DevicesService - Fingerprint Validation', () => {
  let service: DevicesService;
  let deviceRepository: jest.Mocked<Repository<Device>>;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockDeviceRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevicesService,
        {
          provide: getRepositoryToken(Device),
          useValue: mockDeviceRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<DevicesService>(DevicesService);
    deviceRepository = module.get(getRepositoryToken(Device));
    userRepository = module.get(getRepositoryToken(User));

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('validateFingerprint', () => {
    it('should reject fingerprint with invalid length', async () => {
      const shortFingerprint = 'abc123';

      await expect(service.validateFingerprint(shortFingerprint)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject fingerprint with invalid characters', async () => {
      const invalidFingerprint = 'invalid-fingerprint-with-special-chars!@#$%';

      await expect(service.validateFingerprint(invalidFingerprint)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should accept valid 64-character hex fingerprint', async () => {
      const validFingerprint = 'a'.repeat(64);

      const result = await service.validateFingerprint(validFingerprint);

      expect(result).toBe(true);
    });

    it('should accept valid SHA-256 fingerprint', async () => {
      const validFingerprint = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

      const result = await service.validateFingerprint(validFingerprint);

      expect(result).toBe(true);
    });
  });

  describe('getOrCreateGuestUser', () => {
    it('should return existing guest user for known fingerprint', async () => {
      const fingerprint = 'a'.repeat(64);
      const existingUser = {
        id: 'user-123',
        memberType: 'guest',
        deviceFingerprint: fingerprint,
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser);

      const result = await service.getOrCreateGuestUser(fingerprint);

      expect(result).toEqual(existingUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { deviceFingerprint: fingerprint },
      });
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should create new guest user for unknown fingerprint', async () => {
      const fingerprint = 'b'.repeat(64);
      const newUser = {
        id: 'new-user-456',
        memberType: 'guest',
        deviceFingerprint: fingerprint,
        username: expect.stringContaining('访客'),
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(newUser);
      mockUserRepository.save.mockResolvedValue(newUser);

      const result = await service.getOrCreateGuestUser(fingerprint);

      expect(result).toEqual(newUser);
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          memberType: 'guest',
          deviceFingerprint: fingerprint,
        }),
      );
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should register device when creating guest user', async () => {
      const fingerprint = 'c'.repeat(64);
      const newUser = {
        id: 'new-user-789',
        memberType: 'guest',
        deviceFingerprint: fingerprint,
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(newUser);
      mockUserRepository.save.mockResolvedValue(newUser);
      mockDeviceRepository.findOne.mockResolvedValue(null);
      mockDeviceRepository.create.mockReturnValue({});
      mockDeviceRepository.save.mockResolvedValue({});

      await service.getOrCreateGuestUser(fingerprint);

      expect(mockDeviceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceFingerprint: fingerprint,
          userId: newUser.id,
        }),
      );
    });
  });

  describe('updateLastActive', () => {
    it('should update device last active timestamp', async () => {
      const fingerprint = 'd'.repeat(64);

      mockDeviceRepository.update.mockResolvedValue({ affected: 1 });

      await service.updateLastActive(fingerprint);

      expect(mockDeviceRepository.update).toHaveBeenCalledWith(
        { deviceFingerprint: fingerprint },
        expect.objectContaining({
          lastActiveAt: expect.any(Date),
        }),
      );
    });
  });

  describe('edge cases', () => {
    it('should handle concurrent fingerprint registrations gracefully', async () => {
      const fingerprint = 'e'.repeat(64);
      const existingUser = {
        id: 'concurrent-user',
        memberType: 'guest',
        deviceFingerprint: fingerprint,
      };

      // First call returns null, second returns existing user (race condition resolved)
      mockUserRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existingUser);

      mockUserRepository.save.mockRejectedValueOnce(
        new Error('duplicate key value violates unique constraint'),
      );

      const result = await service.getOrCreateGuestUser(fingerprint);

      expect(result).toEqual(existingUser);
    });

    it('should normalize fingerprint to lowercase', async () => {
      const upperFingerprint = 'A'.repeat(64);
      const lowerFingerprint = 'a'.repeat(64);

      mockUserRepository.findOne.mockResolvedValue({
        id: 'user-normalized',
        deviceFingerprint: lowerFingerprint,
      });

      await service.getOrCreateGuestUser(upperFingerprint);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { deviceFingerprint: lowerFingerprint },
      });
    });
  });
});
