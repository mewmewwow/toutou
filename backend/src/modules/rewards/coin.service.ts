import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CoinTransaction, CoinTransactionType } from './entities/coin-transaction.entity';
import { User } from '../users/entities/user.entity';

export type CoinEarnType = 'learning' | 'review' | 'test' | 'daily_login' | 'streak';

export interface CoinAwardResult {
  amount: number;
  newBalance: number;
  transactionId: string;
  cappedAmount?: number;
  dailyTotal: number;
}

@Injectable()
export class CoinService {
  private readonly dailyCap = 500;
  private readonly coinRates = {
    learning: 5, // 5 coins per word learned
    review: 2, // 2 coins per review
    test: 100, // 100 coins per test passed
    daily_login: 10, // 10 coins per daily login
    streak: 50, // 50 coins for maintaining streak
  };

  constructor(
    @InjectRepository(CoinTransaction)
    private readonly transactionRepository: Repository<CoinTransaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Award coins to user (with daily cap enforcement)
   */
  async awardCoins(
    userId: string,
    amount: number,
    type: CoinEarnType,
    referenceId?: string,
  ): Promise<CoinAwardResult> {
    // Check daily cap
    const dailyTotal = await this.getDailyTotal(userId);
    const remaining = this.dailyCap - dailyTotal;

    if (remaining <= 0) {
      throw new BadRequestException({
        code: 'DAILY_COIN_LIMIT_REACHED',
        message: `今日金币已达上限（${this.dailyCap}），明天再来吧！`,
        dailyCap: this.dailyCap,
        dailyTotal,
      });
    }

    // Cap the award amount if it exceeds remaining
    const actualAmount = Math.min(amount, remaining);
    const cappedAmount = amount > remaining ? remaining : undefined;

    // Get user and update balance
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const newBalance = user.totalCoins + actualAmount;
    user.totalCoins = newBalance;
    await this.userRepository.save(user);

    // Create transaction record
    const transaction = this.transactionRepository.create({
      userId,
      amount: actualAmount,
      balanceAfter: newBalance,
      type: this.mapTypeToTransactionType(type),
      referenceId: referenceId || null,
      description: this.getDescription(type, actualAmount),
    });

    await this.transactionRepository.save(transaction);

    return {
      amount: actualAmount,
      newBalance,
      transactionId: transaction.id,
      cappedAmount,
      dailyTotal: dailyTotal + actualAmount,
    };
  }

  /**
   * Get total coins earned today
   */
  async getDailyTotal(userId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.user_id = :userId', { userId })
      .andWhere('transaction.created_at BETWEEN :start AND :end', {
        start: startOfDay,
        end: endOfDay,
      })
      .andWhere('transaction.amount > 0') // Only count earnings
      .select('SUM(transaction.amount)', 'total')
      .getRawOne();

    return result?.total ? parseInt(result.total) : 0;
  }

  /**
   * Get remaining coins available today
   */
  async getRemainingDailyCoins(userId: string): Promise<number> {
    const dailyTotal = await this.getDailyTotal(userId);
    return Math.max(0, this.dailyCap - dailyTotal);
  }

  /**
   * Calculate coin reward based on activity
   */
  calculateCoinReward(type: CoinEarnType, quantity: number): number {
    return (this.coinRates[type] || 0) * quantity;
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    userId: string,
    limit: number = 50,
  ): Promise<CoinTransaction[]> {
    return this.transactionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get coins earned in a date range
   */
  async getCoinsInRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.user_id = :userId', { userId })
      .andWhere('transaction.created_at BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .andWhere('transaction.amount > 0')
      .select('SUM(transaction.amount)', 'total')
      .getRawOne();

    return result?.total ? parseInt(result.total) : 0;
  }

  /**
   * Get daily cap
   */
  getDailyCap(): number {
    return this.dailyCap;
  }

  /**
   * Check if user has reached daily cap
   */
  async hasReachedDailyCap(userId: string): Promise<boolean> {
    const dailyTotal = await this.getDailyTotal(userId);
    return dailyTotal >= this.dailyCap;
  }

  /**
   * Map earn type to transaction type enum
   */
  private mapTypeToTransactionType(type: CoinEarnType): CoinTransactionType {
    const mapping: Record<CoinEarnType, CoinTransactionType> = {
      learning: CoinTransactionType.LEARNING_TIME,
      review: CoinTransactionType.LEARNING_TIME,
      test: CoinTransactionType.TEST_PASS,
      daily_login: CoinTransactionType.DAILY_LOGIN,
      streak: CoinTransactionType.MONTHLY_STREAK,
    };
    return mapping[type];
  }

  /**
   * Generate description for transaction
   */
  private getDescription(type: CoinEarnType, amount: number): string {
    const descriptions: Record<CoinEarnType, string> = {
      learning: `学习奖励 +${amount}`,
      review: `复习奖励 +${amount}`,
      test: `测试通过 +${amount}`,
      daily_login: `每日登录 +${amount}`,
      streak: `连续打卡 +${amount}`,
    };
    return descriptions[type] || `获得金币 +${amount}`;
  }
}
