import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, MemberType } from './entities/user.entity';

export interface TrialInfo {
  isActive: boolean;
  daysRemaining: number | null;
  expireAt: Date | null;
}

@Injectable()
export class MembershipService {
  private readonly trialDurationDays = 14;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Grant 14-day trial to user upon registration
   */
  async grantTrial(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Calculate expiration date (14 days from now)
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + this.trialDurationDays);

    user.memberType = MemberType.TRIAL;
    user.memberExpireAt = expireAt;

    return this.userRepository.save(user);
  }

  /**
   * Check if user's trial/subscription is active
   */
  async isSubscriptionActive(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      return false;
    }

    return user.hasActiveSubscription();
  }

  /**
   * Get trial information for user
   */
  async getTrialInfo(userId: string): Promise<TrialInfo> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      return {
        isActive: false,
        daysRemaining: null,
        expireAt: null,
      };
    }

    const isActive = user.isTrial() && user.hasActiveSubscription();
    const daysRemaining = user.getTrialDaysRemaining();
    const expireAt = user.memberExpireAt;

    return {
      isActive,
      daysRemaining,
      expireAt,
    };
  }

  /**
   * Upgrade user to paid membership
   */
  async upgradeToPaid(userId: string, durationDays: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + durationDays);

    user.memberType = MemberType.PAID;
    user.memberExpireAt = expireAt;

    return this.userRepository.save(user);
  }

  /**
   * Downgrade expired membership
   */
  async handleExpiredMembership(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.hasActiveSubscription()) {
      user.memberType = MemberType.FREE;
      user.memberExpireAt = null;
      return this.userRepository.save(user);
    }

    return user;
  }

  /**
   * Check and update expired memberships (should be run periodically)
   */
  async checkExpiredMemberships(): Promise<number> {
    const expiredUsers = await this.userRepository
      .createQueryBuilder('user')
      .where('user.member_type IN (:...types)', {
        types: [MemberType.TRIAL, MemberType.PAID],
      })
      .andWhere('user.member_expire_at < :now', { now: new Date() })
      .getMany();

    let updatedCount = 0;
    for (const user of expiredUsers) {
      await this.handleExpiredMembership(user.id);
      updatedCount++;
    }

    return updatedCount;
  }

  /**
   * Get trial duration in days
   */
  getTrialDurationDays(): number {
    return this.trialDurationDays;
  }

  /**
   * Check if user can access content based on membership
   */
  canAccessContent(user: User, requiresPaid: boolean): boolean {
    // Guests can only access Unit 1
    if (user.isGuest()) {
      return !requiresPaid;
    }

    // Trial and paid users can access everything
    if (user.hasActiveSubscription()) {
      return true;
    }

    // Free users can access free content
    return !requiresPaid;
  }
}
