import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { Revlog } from '../fsrs/entities/revlog.entity';
import { Card, CardStatus } from '../fsrs/entities/card.entity';

export interface DailyStats {
  date: string;
  reviewCount: number;
  correctCount: number;
  totalTimeSeconds: number;
  averageRating: number;
}

export interface WeeklyStats {
  weekStart: string;
  totalReviews: number;
  dailyAverage: number;
  retentionRate: number;
  streak: number;
}

export interface CalendarData {
  date: string;
  reviewCount: number;
  intensity: number; // 0-4 for heatmap coloring
}

export interface WordStats {
  wordId: string;
  word: string;
  reviewCount: number;
  lastReviewAt: Date | null;
  stability: number;
  difficulty: number;
  status: CardStatus;
  retrievability: number;
}

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(Revlog)
    private readonly revlogRepository: Repository<Revlog>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
  ) {}

  /**
   * Get daily review statistics
   */
  async getDailyStats(userId: string, date: Date): Promise<DailyStats> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const revlogs = await this.revlogRepository.find({
      where: {
        userId,
        createdAt: Between(startOfDay, endOfDay),
      },
    });

    const reviewCount = revlogs.length;
    const correctCount = revlogs.filter((r) => r.rating >= 3).length;
    const totalTimeSeconds = revlogs.reduce(
      (sum, r) => sum + r.responseTimeMs / 1000,
      0,
    );
    const averageRating =
      reviewCount > 0
        ? revlogs.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0;

    return {
      date: startOfDay.toISOString().split('T')[0],
      reviewCount,
      correctCount,
      totalTimeSeconds: Math.round(totalTimeSeconds),
      averageRating: Math.round(averageRating * 100) / 100,
    };
  }

  /**
   * Get weekly statistics
   */
  async getWeeklyStats(userId: string, weekStart: Date): Promise<WeeklyStats> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const revlogs = await this.revlogRepository.find({
      where: {
        userId,
        createdAt: Between(weekStart, weekEnd),
      },
    });

    const totalReviews = revlogs.length;
    const dailyAverage = totalReviews / 7;
    const correctCount = revlogs.filter((r) => r.rating >= 3).length;
    const retentionRate =
      totalReviews > 0 ? (correctCount / totalReviews) * 100 : 0;

    // Calculate streak
    const streak = await this.calculateStreak(userId);

    return {
      weekStart: weekStart.toISOString().split('T')[0],
      totalReviews,
      dailyAverage: Math.round(dailyAverage * 10) / 10,
      retentionRate: Math.round(retentionRate * 10) / 10,
      streak,
    };
  }

  /**
   * Get calendar heatmap data
   */
  async getCalendarData(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CalendarData[]> {
    const revlogs = await this.revlogRepository
      .createQueryBuilder('revlog')
      .select('DATE(revlog.created_at)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('revlog.user_id = :userId', { userId })
      .andWhere('revlog.created_at BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .groupBy('DATE(revlog.created_at)')
      .getRawMany();

    // Find max count for intensity calculation
    const maxCount = Math.max(...revlogs.map((r) => parseInt(r.count)), 1);

    return revlogs.map((r) => {
      const count = parseInt(r.count);
      return {
        date: r.date,
        reviewCount: count,
        intensity: Math.min(4, Math.floor((count / maxCount) * 5)),
      };
    });
  }

  /**
   * Get word-level statistics for word cloud
   */
  async getWordStats(userId: string, limit: number = 100): Promise<WordStats[]> {
    const cards = await this.cardRepository
      .createQueryBuilder('card')
      .leftJoinAndSelect('card.word', 'word')
      .where('card.user_id = :userId', { userId })
      .andWhere('card.status != :graduated', { graduated: CardStatus.GRADUATED })
      .orderBy('card.due_at', 'ASC')
      .take(limit)
      .getMany();

    const now = new Date();

    return cards.map((card) => {
      const stability = Number(card.stability);
      const daysSinceReview = card.lastReviewAt
        ? (now.getTime() - card.lastReviewAt.getTime()) / (1000 * 60 * 60 * 24)
        : 0;

      // Calculate retrievability using FSRS formula
      let retrievability = 1.0;
      if (stability > 0 && daysSinceReview > 0) {
        const factor = 19 / 81;
        retrievability = Math.pow(1 + (factor * daysSinceReview) / stability, -0.5);
        retrievability = Math.max(0, Math.min(1, retrievability));
      }

      return {
        wordId: card.wordId,
        word: card.word?.word || '',
        reviewCount: card.reviewCount,
        lastReviewAt: card.lastReviewAt,
        stability,
        difficulty: Number(card.difficulty),
        status: card.status,
        retrievability: Math.round(retrievability * 100) / 100,
      };
    });
  }

  /**
   * Calculate consecutive days streak
   */
  private async calculateStreak(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let checkDate = new Date(today);

    while (true) {
      const startOfDay = new Date(checkDate);
      const endOfDay = new Date(checkDate);
      endOfDay.setHours(23, 59, 59, 999);

      const count = await this.revlogRepository.count({
        where: {
          userId,
          createdAt: Between(startOfDay, endOfDay),
        },
      });

      if (count === 0) {
        // If today and no reviews yet, check yesterday
        if (checkDate.getTime() === today.getTime()) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }

      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  }

  /**
   * Get total review count for user
   */
  async getTotalReviewCount(userId: string): Promise<number> {
    return this.revlogRepository.count({ where: { userId } });
  }

  /**
   * Get reviews in date range
   */
  async getReviewsInRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Revlog[]> {
    return this.revlogRepository.find({
      where: {
        userId,
        createdAt: Between(startDate, endDate),
      },
      order: { createdAt: 'DESC' },
    });
  }
}
