import { CoinService } from '../../../src/modules/rewards/coin.service';
import { Repository } from 'typeorm';
import { CoinTransaction } from '../../../src/modules/rewards/entities/coin-transaction.entity';
import { User } from '../../../src/modules/users/entities/user.entity';

describe('CoinService', () => {
  let service: CoinService;
  let transactionRepository: jest.Mocked<Repository<CoinTransaction>>;
  let userRepository: jest.Mocked<Repository<User>>;

  beforeEach(() => {
    transactionRepository = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    userRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as any;

    service = new CoinService(transactionRepository, userRepository);
  });

  describe('awardCoins', () => {
    it('should award coins for learning completion', async () => {
      const user = {
        id: 'user-123',
        totalCoins: 100,
      } as User;

      userRepository.findOne.mockResolvedValue(user);
      transactionRepository.create.mockReturnValue({} as CoinTransaction);
      transactionRepository.save.mockResolvedValue({} as CoinTransaction);

      const queryBuilder = {
        where: jest.fn().returnThis(),
        andWhere: jest.fn().returnThis(),
        select: jest.fn().returnThis(),
        getRawOne: jest.fn().resolvedValue({ total: 400 }),
      };
      (transactionRepository.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilder);

      const result = await service.awardCoins('user-123', 50, 'learning');

      expect(result.amount).toBe(50);
      expect(result.newBalance).toBe(150);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should enforce daily cap of 500 coins', async () => {
      const user = {
        id: 'user-123',
        totalCoins: 1000,
      } as User;

      userRepository.findOne.mockResolvedValue(user);

      const queryBuilder = {
        where: jest.fn().returnThis(),
        andWhere: jest.fn().returnThis(),
        select: jest.fn().returnThis(),
        getRawOne: jest.fn().resolvedValue({ total: 480 }),
      };
      (transactionRepository.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilder);

      await expect(
        service.awardCoins('user-123', 50, 'learning'),
      ).rejects.toThrow('DAILY_COIN_LIMIT_REACHED');
    });

    it('should allow partial coins up to cap', async () => {
      const user = {
        id: 'user-123',
        totalCoins: 1000,
      } as User;

      userRepository.findOne.mockResolvedValue(user);
      transactionRepository.create.mockReturnValue({} as CoinTransaction);
      transactionRepository.save.mockResolvedValue({} as CoinTransaction);

      const queryBuilder = {
        where: jest.fn().returnThis(),
        andWhere: jest.fn().returnThis(),
        select: jest.fn().returnThis(),
        getRawOne: jest.fn().resolvedValue({ total: 490 }),
      };
      (transactionRepository.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilder);

      const result = await service.awardCoins('user-123', 50, 'learning');

      expect(result.amount).toBe(10); // Only 10 coins to reach 500 cap
      expect(result.cappedAmount).toBe(10);
    });
  });

  describe('getDailyTotal', () => {
    it('should return total coins earned today', async () => {
      const queryBuilder = {
        where: jest.fn().returnThis(),
        andWhere: jest.fn().returnThis(),
        select: jest.fn().returnThis(),
        getRawOne: jest.fn().resolvedValue({ total: 350 }),
      };
      (transactionRepository.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilder);

      const total = await service.getDailyTotal('user-123');
      expect(total).toBe(350);
    });

    it('should return 0 if no coins earned today', async () => {
      const queryBuilder = {
        where: jest.fn().returnThis(),
        andWhere: jest.fn().returnThis(),
        select: jest.fn().returnThis(),
        getRawOne: jest.fn().resolvedValue(null),
      };
      (transactionRepository.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilder);

      const total = await service.getDailyTotal('user-123');
      expect(total).toBe(0);
    });
  });

  describe('getRemainingDailyCoins', () => {
    it('should return remaining coins for the day', async () => {
      const queryBuilder = {
        where: jest.fn().returnThis(),
        andWhere: jest.fn().returnThis(),
        select: jest.fn().returnThis(),
        getRawOne: jest.fn().resolvedValue({ total: 300 }),
      };
      (transactionRepository.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilder);

      const remaining = await service.getRemainingDailyCoins('user-123');
      expect(remaining).toBe(200); // 500 - 300
    });

    it('should return 0 if cap reached', async () => {
      const queryBuilder = {
        where: jest.fn().returnThis(),
        andWhere: jest.fn().returnThis(),
        select: jest.fn().returnThis(),
        getRawOne: jest.fn().resolvedValue({ total: 500 }),
      };
      (transactionRepository.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilder);

      const remaining = await service.getRemainingDailyCoins('user-123');
      expect(remaining).toBe(0);
    });
  });

  describe('calculateCoinReward', () => {
    it('should calculate coins for learning module', () => {
      const coins = service.calculateCoinReward('learning', 10);
      expect(coins).toBe(50); // 5 coins per word
    });

    it('should calculate coins for review', () => {
      const coins = service.calculateCoinReward('review', 20);
      expect(coins).toBe(40); // 2 coins per review
    });

    it('should calculate coins for test completion', () => {
      const coins = service.calculateCoinReward('test', 1);
      expect(coins).toBe(100); // 100 coins per test
    });

    it('should calculate coins for daily login', () => {
      const coins = service.calculateCoinReward('daily_login', 1);
      expect(coins).toBe(10);
    });
  });
});
