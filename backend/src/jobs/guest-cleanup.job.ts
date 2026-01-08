import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { User, MemberType } from '../modules/users/entities/user.entity';
import { Card } from '../modules/fsrs/entities/card.entity';
import { LearningSession } from '../modules/learning/entities/learning-session.entity';
import { TestAttempt } from '../modules/tests/entities/test-attempt.entity';
import { CoinTransaction } from '../modules/rewards/entities/coin-transaction.entity';

export interface GuestCleanupResult {
  usersDeleted: number;
  cardsDeleted: number;
  sessionsDeleted: number;
  attemptsDeleted: number;
  transactionsDeleted: number;
  executionTime: number;
}

@Injectable()
export class GuestCleanupJob {
  private readonly logger = new Logger(GuestCleanupJob.name);
  private readonly retentionDays = 30;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    @InjectRepository(LearningSession)
    private readonly sessionRepository: Repository<LearningSession>,
    @InjectRepository(TestAttempt)
    private readonly attemptRepository: Repository<TestAttempt>,
    @InjectRepository(CoinTransaction)
    private readonly transactionRepository: Repository<CoinTransaction>,
  ) {}

  /**
   * Execute guest data cleanup job
   * Removes guest users and their associated data after 30 days of inactivity
   */
  async execute(): Promise<GuestCleanupResult> {
    const startTime = Date.now();
    this.logger.log('Starting guest data cleanup job...');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    try {
      // Find inactive guest users
      const inactiveGuests = await this.userRepository.find({
        where: {
          memberType: MemberType.GUEST,
          updatedAt: LessThan(cutoffDate),
        },
      });

      if (inactiveGuests.length === 0) {
        this.logger.log('No inactive guest users found');
        return {
          usersDeleted: 0,
          cardsDeleted: 0,
          sessionsDeleted: 0,
          attemptsDeleted: 0,
          transactionsDeleted: 0,
          executionTime: Date.now() - startTime,
        };
      }

      const guestIds = inactiveGuests.map((u) => u.id);
      this.logger.log(`Found ${guestIds.length} inactive guest users to cleanup`);

      // Delete associated data (in reverse dependency order)
      const transactionsDeleted = await this.deleteTransactions(guestIds);
      const attemptsDeleted = await this.deleteTestAttempts(guestIds);
      const sessionsDeleted = await this.deleteLearninSessions(guestIds);
      const cardsDeleted = await this.deleteCards(guestIds);

      // Finally, delete the guest users
      const usersDeleted = await this.deleteUsers(guestIds);

      const result: GuestCleanupResult = {
        usersDeleted,
        cardsDeleted,
        sessionsDeleted,
        attemptsDeleted,
        transactionsDeleted,
        executionTime: Date.now() - startTime,
      };

      this.logger.log(`Cleanup complete: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`Guest cleanup job failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete coin transactions for guest users
   */
  private async deleteTransactions(userIds: string[]): Promise<number> {
    const result = await this.transactionRepository.delete({
      userId: LessThan(userIds.length) ? userIds : undefined,
    });

    // More efficient batch delete
    const deleteResult = await this.transactionRepository
      .createQueryBuilder()
      .delete()
      .where('user_id IN (:...userIds)', { userIds })
      .execute();

    return deleteResult.affected || 0;
  }

  /**
   * Delete test attempts for guest users
   */
  private async deleteTestAttempts(userIds: string[]): Promise<number> {
    const deleteResult = await this.attemptRepository
      .createQueryBuilder()
      .delete()
      .where('user_id IN (:...userIds)', { userIds })
      .execute();

    return deleteResult.affected || 0;
  }

  /**
   * Delete learning sessions for guest users
   */
  private async deleteLearninSessions(userIds: string[]): Promise<number> {
    const deleteResult = await this.sessionRepository
      .createQueryBuilder()
      .delete()
      .where('user_id IN (:...userIds)', { userIds })
      .execute();

    return deleteResult.affected || 0;
  }

  /**
   * Delete FSRS cards for guest users
   */
  private async deleteCards(userIds: string[]): Promise<number> {
    const deleteResult = await this.cardRepository
      .createQueryBuilder()
      .delete()
      .where('user_id IN (:...userIds)', { userIds })
      .execute();

    return deleteResult.affected || 0;
  }

  /**
   * Delete guest users
   */
  private async deleteUsers(userIds: string[]): Promise<number> {
    const deleteResult = await this.userRepository
      .createQueryBuilder()
      .delete()
      .where('id IN (:...userIds)', { userIds })
      .execute();

    return deleteResult.affected || 0;
  }

  /**
   * Get statistics about guest data to be cleaned
   */
  async getCleanupPreview(): Promise<{
    inactiveGuestCount: number;
    cutoffDate: Date;
    retentionDays: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    const inactiveGuestCount = await this.userRepository.count({
      where: {
        memberType: MemberType.GUEST,
        updatedAt: LessThan(cutoffDate),
      },
    });

    return {
      inactiveGuestCount,
      cutoffDate,
      retentionDays: this.retentionDays,
    };
  }

  /**
   * Get retention period in days
   */
  getRetentionDays(): number {
    return this.retentionDays;
  }
}
