import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { User, MemberType } from '../modules/users/entities/user.entity';

export interface TrialExpirationResult {
  trialsExpired: number;
  usersDowngraded: number;
  executionTime: number;
  expiredUserIds: string[];
}

export interface ExpiringTrialNotification {
  userId: string;
  email: string | null;
  phone: string | null;
  daysRemaining: number;
  expireAt: Date;
}

@Injectable()
export class TrialExpirationJob {
  private readonly logger = new Logger(TrialExpirationJob.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Execute trial expiration job
   * Downgrade expired trial users to free tier
   */
  async execute(): Promise<TrialExpirationResult> {
    const startTime = Date.now();
    this.logger.log('Starting trial expiration job...');

    try {
      const now = new Date();

      // Find expired trial users
      const expiredTrials = await this.userRepository.find({
        where: {
          memberType: MemberType.TRIAL,
          memberExpireAt: LessThan(now),
        },
      });

      if (expiredTrials.length === 0) {
        this.logger.log('No expired trials found');
        return {
          trialsExpired: 0,
          usersDowngraded: 0,
          executionTime: Date.now() - startTime,
          expiredUserIds: [],
        };
      }

      this.logger.log(`Found ${expiredTrials.length} expired trial users`);

      // Downgrade users to FREE tier
      const expiredUserIds: string[] = [];
      let usersDowngraded = 0;

      for (const user of expiredTrials) {
        try {
          user.memberType = MemberType.FREE;
          user.memberExpireAt = null;
          await this.userRepository.save(user);

          expiredUserIds.push(user.id);
          usersDowngraded++;

          this.logger.log(
            `Downgraded trial user ${user.id} (${user.email || user.phone}) to FREE`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to downgrade user ${user.id}: ${error.message}`,
          );
        }
      }

      const result: TrialExpirationResult = {
        trialsExpired: expiredTrials.length,
        usersDowngraded,
        executionTime: Date.now() - startTime,
        expiredUserIds,
      };

      this.logger.log(`Trial expiration complete: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Trial expiration job failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get users with trials expiring soon (for notification purposes)
   * @param daysThreshold Number of days before expiration (default: 3)
   */
  async getExpiringTrials(
    daysThreshold: number = 3,
  ): Promise<ExpiringTrialNotification[]> {
    const now = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const expiringUsers = await this.userRepository
      .createQueryBuilder('user')
      .where('user.member_type = :memberType', { memberType: MemberType.TRIAL })
      .andWhere('user.member_expire_at > :now', { now })
      .andWhere('user.member_expire_at <= :threshold', {
        threshold: thresholdDate,
      })
      .getMany();

    return expiringUsers.map((user) => {
      const daysRemaining = Math.ceil(
        (user.memberExpireAt!.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      return {
        userId: user.id,
        email: user.email,
        phone: user.phone,
        daysRemaining,
        expireAt: user.memberExpireAt!,
      };
    });
  }

  /**
   * Get count of expired trials
   */
  async getExpiredTrialCount(): Promise<number> {
    const now = new Date();

    return this.userRepository.count({
      where: {
        memberType: MemberType.TRIAL,
        memberExpireAt: LessThan(now),
      },
    });
  }

  /**
   * Get count of active trials
   */
  async getActiveTrialCount(): Promise<number> {
    const now = new Date();

    return this.userRepository
      .createQueryBuilder('user')
      .where('user.member_type = :memberType', { memberType: MemberType.TRIAL })
      .andWhere('user.member_expire_at > :now', { now })
      .getCount();
  }

  /**
   * Get trial statistics
   */
  async getTrialStats(): Promise<{
    activeTrials: number;
    expiredTrials: number;
    expiringIn3Days: number;
    expiringIn7Days: number;
  }> {
    const now = new Date();
    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);

    const [
      activeTrials,
      expiredTrials,
      expiringIn3Days,
      expiringIn7Days,
    ] = await Promise.all([
      this.getActiveTrialCount(),
      this.getExpiredTrialCount(),
      this.userRepository
        .createQueryBuilder('user')
        .where('user.member_type = :memberType', {
          memberType: MemberType.TRIAL,
        })
        .andWhere('user.member_expire_at > :now', { now })
        .andWhere('user.member_expire_at <= :in3Days', { in3Days })
        .getCount(),
      this.userRepository
        .createQueryBuilder('user')
        .where('user.member_type = :memberType', {
          memberType: MemberType.TRIAL,
        })
        .andWhere('user.member_expire_at > :now', { now })
        .andWhere('user.member_expire_at <= :in7Days', { in7Days })
        .getCount(),
    ]);

    return {
      activeTrials,
      expiredTrials,
      expiringIn3Days,
      expiringIn7Days,
    };
  }

  /**
   * Manually expire a specific trial user
   */
  async expireTrialUser(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId, memberType: MemberType.TRIAL },
    });

    if (!user) {
      throw new Error('User not found or not a trial user');
    }

    user.memberType = MemberType.FREE;
    user.memberExpireAt = null;
    await this.userRepository.save(user);

    this.logger.log(`Manually expired trial for user ${userId}`);
  }
}
