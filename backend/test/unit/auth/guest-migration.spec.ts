import { GuestMigrationService } from '../../../src/modules/auth/guest-migration.service';
import { Repository } from 'typeorm';
import { User, MemberType } from '../../../src/modules/users/entities/user.entity';
import { Card } from '../../../src/modules/fsrs/entities/card.entity';
import { LearningSession } from '../../../src/modules/learning/entities/learning-session.entity';
import { TestAttempt } from '../../../src/modules/tests/entities/test-attempt.entity';

describe('GuestMigrationService', () => {
  let service: GuestMigrationService;
  let userRepository: jest.Mocked<Repository<User>>;
  let cardRepository: jest.Mocked<Repository<Card>>;
  let sessionRepository: jest.Mocked<Repository<LearningSession>>;
  let attemptRepository: jest.Mocked<Repository<TestAttempt>>;

  beforeEach(() => {
    userRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as any;

    cardRepository = {
      update: jest.fn(),
      count: jest.fn(),
    } as any;

    sessionRepository = {
      update: jest.fn(),
      count: jest.fn(),
    } as any;

    attemptRepository = {
      update: jest.fn(),
      count: jest.fn(),
    } as any;

    service = new GuestMigrationService(
      userRepository,
      cardRepository,
      sessionRepository,
      attemptRepository,
    );
  });

  describe('migrateGuestData', () => {
    it('should migrate all guest data to registered user', async () => {
      const guestUser = {
        id: 'guest-123',
        memberType: MemberType.GUEST,
      } as User;

      const registeredUser = {
        id: 'user-456',
        memberType: MemberType.FREE,
      } as User;

      userRepository.findOne.mockResolvedValue(guestUser);
      cardRepository.count.mockResolvedValue(10);
      sessionRepository.count.mockResolvedValue(5);
      attemptRepository.count.mockResolvedValue(3);

      const result = await service.migrateGuestData('guest-123', 'user-456');

      expect(result.cardsM igrated).toBe(10);
      expect(result.sessionsMigrated).toBe(5);
      expect(result.attemptsMigrated).toBe(3);
      expect(cardRepository.update).toHaveBeenCalledWith(
        { userId: 'guest-123' },
        { userId: 'user-456' },
      );
      expect(sessionRepository.update).toHaveBeenCalledWith(
        { userId: 'guest-123' },
        { userId: 'user-456' },
      );
      expect(attemptRepository.update).toHaveBeenCalledWith(
        { userId: 'guest-123' },
        { userId: 'user-456' },
      );
    });

    it('should throw error if guest user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.migrateGuestData('guest-123', 'user-456'),
      ).rejects.toThrow();
    });

    it('should throw error if source user is not guest', async () => {
      const user = {
        id: 'user-123',
        memberType: MemberType.FREE,
      } as User;

      userRepository.findOne.mockResolvedValue(user);

      await expect(
        service.migrateGuestData('user-123', 'user-456'),
      ).rejects.toThrow('Source user must be a guest');
    });
  });

  describe('canMigrateGuest', () => {
    it('should return true for valid guest user', async () => {
      const guestUser = {
        id: 'guest-123',
        memberType: MemberType.GUEST,
      } as User;

      userRepository.findOne.mockResolvedValue(guestUser);

      const result = await service.canMigrateGuest('guest-123');
      expect(result).toBe(true);
    });

    it('should return false for non-guest user', async () => {
      const user = {
        id: 'user-123',
        memberType: MemberType.FREE,
      } as User;

      userRepository.findOne.mockResolvedValue(user);

      const result = await service.canMigrateGuest('user-123');
      expect(result).toBe(false);
    });

    it('should return false if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.canMigrateGuest('user-123');
      expect(result).toBe(false);
    });
  });

  describe('getGuestDataSummary', () => {
    it('should return summary of guest data', async () => {
      cardRepository.count.mockResolvedValue(15);
      sessionRepository.count.mockResolvedValue(8);
      attemptRepository.count.mockResolvedValue(2);

      const summary = await service.getGuestDataSummary('guest-123');

      expect(summary.cardCount).toBe(15);
      expect(summary.sessionCount).toBe(8);
      expect(summary.testAttemptCount).toBe(2);
    });
  });
});
