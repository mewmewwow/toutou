import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

export interface StreakRecordResult {
  currentStreak: number;
  longestStreak: number;
  isNewRecord: boolean;
  streakBroken: boolean;
  previousStreak?: number;
  alreadyLoggedToday: boolean;
  bonusCoins: number;
  isMilestone: boolean;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: Date | null;
  isActive: boolean;
  daysSinceLastLogin: number;
  nextMilestone: number;
  daysToNextMilestone: number;
}

@Injectable()
export class StreakService {
  private readonly streakMilestones = [7, 30, 100, 365];

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Record a daily login and update streak
   */
  async recordDailyLogin(userId: string): Promise<StreakRecordResult> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const now = new Date();
    const today = this.getDateOnly(now);
    const lastLogin = user.lastLoginDate
      ? this.getDateOnly(user.lastLoginDate)
      : null;

    // Check if already logged in today
    if (lastLogin && this.isSameDay(today, lastLogin)) {
      return {
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        isNewRecord: false,
        streakBroken: false,
        alreadyLoggedToday: true,
        bonusCoins: 0,
        isMilestone: false,
      };
    }

    const daysDiff = lastLogin ? this.getDaysDifference(lastLogin, today) : 0;
    let currentStreak = user.currentStreak || 0;
    let streakBroken = false;
    let previousStreak: number | undefined;

    if (!lastLogin) {
      // First login ever
      currentStreak = 1;
    } else if (daysDiff === 1) {
      // Consecutive day - increment streak
      currentStreak++;
    } else if (daysDiff > 1) {
      // Streak broken
      streakBroken = true;
      previousStreak = currentStreak;
      currentStreak = 1;
    }

    // Update longest streak if current exceeds it
    const longestStreak = Math.max(currentStreak, user.longestStreak || 0);
    const isNewRecord = currentStreak > (user.longestStreak || 0);

    // Calculate bonus coins
    const bonusCoins = this.getStreakBonus(currentStreak);
    const isMilestone = this.checkStreakMilestone(currentStreak);

    // Update user
    user.currentStreak = currentStreak;
    user.longestStreak = longestStreak;
    user.lastLoginDate = now;
    await this.userRepository.save(user);

    return {
      currentStreak,
      longestStreak,
      isNewRecord,
      streakBroken,
      previousStreak,
      alreadyLoggedToday: false,
      bonusCoins,
      isMilestone,
    };
  }

  /**
   * Get current streak information
   */
  async getStreakInfo(userId: string): Promise<StreakInfo> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const now = new Date();
    const today = this.getDateOnly(now);
    const lastLogin = user.lastLoginDate
      ? this.getDateOnly(user.lastLoginDate)
      : null;

    const daysSinceLastLogin = lastLogin
      ? this.getDaysDifference(lastLogin, today)
      : 0;

    // Streak is active if logged in today or yesterday
    const isActive = daysSinceLastLogin <= 1;

    // Find next milestone
    const nextMilestone =
      this.streakMilestones.find(
        (milestone) => milestone > user.currentStreak,
      ) || 0;
    const daysToNextMilestone = nextMilestone
      ? nextMilestone - user.currentStreak
      : 0;

    return {
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      lastLoginDate: user.lastLoginDate,
      isActive,
      daysSinceLastLogin,
      nextMilestone,
      daysToNextMilestone,
    };
  }

  /**
   * Get bonus coins for current streak length
   */
  getStreakBonus(streakDays: number): number {
    if (streakDays >= 100) return 200;
    if (streakDays >= 30) return 100;
    if (streakDays >= 7) return 50;
    return 0;
  }

  /**
   * Check if current streak day is a milestone
   */
  checkStreakMilestone(streakDays: number): boolean {
    return this.streakMilestones.includes(streakDays);
  }

  /**
   * Get all milestone thresholds
   */
  getMilestones(): number[] {
    return [...this.streakMilestones];
  }

  /**
   * Calculate days between two dates (ignoring time)
   */
  private getDaysDifference(date1: Date, date2: Date): number {
    const diffMs = date2.getTime() - date1.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Get date with time set to midnight
   */
  private getDateOnly(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Check if two dates are the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return this.getDaysDifference(date1, date2) === 0;
  }
}
