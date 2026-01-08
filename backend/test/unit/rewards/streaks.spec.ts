import { StreakService } from '../../../src/modules/rewards/streak.service';
import { Repository } from 'typeorm';
import { User } from '../../../src/modules/users/entities/user.entity';

describe('StreakService', () => {
  let service: StreakService;
  let userRepository: jest.Mocked<Repository<User>>;

  beforeEach(() => {
    userRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as any;

    service = new StreakService(userRepository);
  });

  describe('recordDailyLogin', () => {
    it('should start new streak on first login', async () => {
      const user = {
        id: 'user-123',
        currentStreak: 0,
        longestStreak: 0,
        lastLoginDate: null,
      } as User;

      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue({
        ...user,
        currentStreak: 1,
        longestStreak: 1,
      } as User);

      const result = await service.recordDailyLogin('user-123');

      expect(result.currentStreak).toBe(1);
      expect(result.isNewRecord).toBe(true);
      expect(result.streakBroken).toBe(false);
    });

    it('should increment streak on consecutive day login', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(12, 0, 0, 0);

      const user = {
        id: 'user-123',
        currentStreak: 5,
        longestStreak: 10,
        lastLoginDate: yesterday,
      } as User;

      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue({
        ...user,
        currentStreak: 6,
      } as User);

      const result = await service.recordDailyLogin('user-123');

      expect(result.currentStreak).toBe(6);
      expect(result.streakBroken).toBe(false);
      expect(result.isNewRecord).toBe(false);
    });

    it('should reset streak if user missed a day', async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      threeDaysAgo.setHours(12, 0, 0, 0);

      const user = {
        id: 'user-123',
        currentStreak: 15,
        longestStreak: 20,
        lastLoginDate: threeDaysAgo,
      } as User;

      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue({
        ...user,
        currentStreak: 1,
      } as User);

      const result = await service.recordDailyLogin('user-123');

      expect(result.currentStreak).toBe(1);
      expect(result.streakBroken).toBe(true);
      expect(result.previousStreak).toBe(15);
    });

    it('should not increment streak for same-day login', async () => {
      const today = new Date();
      today.setHours(8, 0, 0, 0);

      const user = {
        id: 'user-123',
        currentStreak: 7,
        longestStreak: 15,
        lastLoginDate: today,
      } as User;

      userRepository.findOne.mockResolvedValue(user);

      const result = await service.recordDailyLogin('user-123');

      expect(result.currentStreak).toBe(7);
      expect(result.alreadyLoggedToday).toBe(true);
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should update longest streak when current exceeds it', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(12, 0, 0, 0);

      const user = {
        id: 'user-123',
        currentStreak: 20,
        longestStreak: 20,
        lastLoginDate: yesterday,
      } as User;

      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue({
        ...user,
        currentStreak: 21,
        longestStreak: 21,
      } as User);

      const result = await service.recordDailyLogin('user-123');

      expect(result.currentStreak).toBe(21);
      expect(result.isNewRecord).toBe(true);
      expect(result.longestStreak).toBe(21);
    });
  });

  describe('getStreakInfo', () => {
    it('should return current streak information', async () => {
      const user = {
        id: 'user-123',
        currentStreak: 10,
        longestStreak: 25,
        lastLoginDate: new Date(),
      } as User;

      userRepository.findOne.mockResolvedValue(user);

      const info = await service.getStreakInfo('user-123');

      expect(info.currentStreak).toBe(10);
      expect(info.longestStreak).toBe(25);
      expect(info.isActive).toBe(true);
    });

    it('should detect inactive streak', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const user = {
        id: 'user-123',
        currentStreak: 5,
        longestStreak: 10,
        lastLoginDate: twoDaysAgo,
      } as User;

      userRepository.findOne.mockResolvedValue(user);

      const info = await service.getStreakInfo('user-123');

      expect(info.isActive).toBe(false);
      expect(info.daysSinceLastLogin).toBe(2);
    });
  });

  describe('getStreakBonus', () => {
    it('should return 0 bonus for streaks less than 7 days', () => {
      expect(service.getStreakBonus(3)).toBe(0);
      expect(service.getStreakBonus(6)).toBe(0);
    });

    it('should return 50 coins for 7-29 day streak', () => {
      expect(service.getStreakBonus(7)).toBe(50);
      expect(service.getStreakBonus(15)).toBe(50);
      expect(service.getStreakBonus(29)).toBe(50);
    });

    it('should return 100 coins for 30-99 day streak', () => {
      expect(service.getStreakBonus(30)).toBe(100);
      expect(service.getStreakBonus(50)).toBe(100);
      expect(service.getStreakBonus(99)).toBe(100);
    });

    it('should return 200 coins for 100+ day streak', () => {
      expect(service.getStreakBonus(100)).toBe(200);
      expect(service.getStreakBonus(365)).toBe(200);
    });
  });

  describe('checkStreakMilestone', () => {
    it('should detect milestone achievements', () => {
      expect(service.checkStreakMilestone(7)).toBe(true);
      expect(service.checkStreakMilestone(30)).toBe(true);
      expect(service.checkStreakMilestone(100)).toBe(true);
      expect(service.checkStreakMilestone(365)).toBe(true);
    });

    it('should return false for non-milestone days', () => {
      expect(service.checkStreakMilestone(8)).toBe(false);
      expect(service.checkStreakMilestone(31)).toBe(false);
      expect(service.checkStreakMilestone(101)).toBe(false);
    });
  });
});
