import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, MemberType } from '../users/entities/user.entity';
import { Card } from '../fsrs/entities/card.entity';
import { LearningSession } from '../learning/entities/learning-session.entity';
import { TestAttempt } from '../tests/entities/test-attempt.entity';

export interface MigrationResult {
  cardsMigrated: number;
  sessionsMigrated: number;
  attemptsMigrated: number;
  success: boolean;
}

export interface GuestDataSummary {
  cardCount: number;
  sessionCount: number;
  testAttemptCount: number;
}

@Injectable()
export class GuestMigrationService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    @InjectRepository(LearningSession)
    private readonly sessionRepository: Repository<LearningSession>,
    @InjectRepository(TestAttempt)
    private readonly attemptRepository: Repository<TestAttempt>,
  ) {}

  /**
   * Migrate all data from guest user to registered user
   */
  async migrateGuestData(
    guestUserId: string,
    registeredUserId: string,
  ): Promise<MigrationResult> {
    // Verify guest user exists and is actually a guest
    const guestUser = await this.userRepository.findOne({
      where: { id: guestUserId },
    });

    if (!guestUser) {
      throw new BadRequestException({
        code: 'GUEST_USER_NOT_FOUND',
        message: '访客用户不存在',
      });
    }

    if (guestUser.memberType !== MemberType.GUEST) {
      throw new BadRequestException({
        code: 'NOT_GUEST_USER',
        message: 'Source user must be a guest',
      });
    }

    // Get counts before migration
    const cardCount = await this.cardRepository.count({
      where: { userId: guestUserId },
    });
    const sessionCount = await this.sessionRepository.count({
      where: { userId: guestUserId },
    });
    const attemptCount = await this.attemptRepository.count({
      where: { userId: guestUserId },
    });

    // Migrate cards
    await this.cardRepository.update(
      { userId: guestUserId },
      { userId: registeredUserId },
    );

    // Migrate learning sessions
    await this.sessionRepository.update(
      { userId: guestUserId },
      { userId: registeredUserId },
    );

    // Migrate test attempts
    await this.attemptRepository.update(
      { userId: guestUserId },
      { userId: registeredUserId },
    );

    return {
      cardsMigrated: cardCount,
      sessionsMigrated: sessionCount,
      attemptsMigrated: attemptCount,
      success: true,
    };
  }

  /**
   * Check if user can be migrated (is guest with data)
   */
  async canMigrateGuest(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || user.memberType !== MemberType.GUEST) {
      return false;
    }

    return true;
  }

  /**
   * Get summary of guest data (for migration preview)
   */
  async getGuestDataSummary(userId: string): Promise<GuestDataSummary> {
    const cardCount = await this.cardRepository.count({
      where: { userId },
    });
    const sessionCount = await this.sessionRepository.count({
      where: { userId },
    });
    const testAttemptCount = await this.attemptRepository.count({
      where: { userId },
    });

    return {
      cardCount,
      sessionCount,
      testAttemptCount,
    };
  }

  /**
   * Check if guest has any data worth migrating
   */
  async hasGuestData(userId: string): Promise<boolean> {
    const summary = await this.getGuestDataSummary(userId);
    return (
      summary.cardCount > 0 ||
      summary.sessionCount > 0 ||
      summary.testAttemptCount > 0
    );
  }
}
