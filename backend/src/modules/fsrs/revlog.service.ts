import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Revlog, ReviewType } from './entities/revlog.entity';
import { Card, CardStatus } from './entities/card.entity';
import { Rating } from 'ts-fsrs';

export interface CreateRevlogDto {
  cardId: string;
  userId: string;
  rating: number;
  responseTimeMs: number;
  stabilityBefore: number;
  stabilityAfter: number;
  difficultyBefore: number;
  difficultyAfter: number;
  intervalBefore: number;
  intervalAfter: number;
  reviewType: ReviewType;
}

export interface ReviewStats {
  totalReviews: number;
  correctReviews: number;
  averageResponseTime: number;
  byModule: Record<number, { total: number; correct: number }>;
}

@Injectable()
export class RevlogService {
  constructor(
    @InjectRepository(Revlog)
    private readonly revlogRepository: Repository<Revlog>,
  ) {}

  /**
   * Create a review log entry
   */
  async createLog(dto: CreateRevlogDto): Promise<Revlog> {
    const revlog = this.revlogRepository.create({
      cardId: dto.cardId,
      userId: dto.userId,
      rating: dto.rating,
      responseTimeMs: dto.responseTimeMs,
      stabilityBefore: dto.stabilityBefore,
      stabilityAfter: dto.stabilityAfter,
      difficultyBefore: dto.difficultyBefore,
      difficultyAfter: dto.difficultyAfter,
      intervalBefore: dto.intervalBefore,
      intervalAfter: dto.intervalAfter,
      reviewType: dto.reviewType,
    });

    return this.revlogRepository.save(revlog);
  }

  /**
   * Create review log from card update result
   */
  async logCardReview(
    card: Card,
    rating: Rating,
    responseTimeMs: number,
    previousStability: number,
    previousDifficulty: number,
    intervalDays: number,
    previousStatus: CardStatus,
  ): Promise<Revlog> {
    // Determine review type based on previous status
    let reviewType: ReviewType;
    if (previousStatus === CardStatus.NEW) {
      reviewType = ReviewType.LEARNING;
    } else if (rating <= Rating.Hard && previousStatus === CardStatus.REVIEW) {
      reviewType = ReviewType.RELEARNING;
    } else {
      reviewType = ReviewType.REVIEW;
    }

    // Calculate previous interval (days since last review)
    const intervalBefore = card.lastReviewAt
      ? Math.floor((Date.now() - card.lastReviewAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return this.createLog({
      cardId: card.id,
      userId: card.userId,
      rating,
      responseTimeMs,
      stabilityBefore: previousStability,
      stabilityAfter: Number(card.stability),
      difficultyBefore: previousDifficulty,
      difficultyAfter: Number(card.difficulty),
      intervalBefore,
      intervalAfter: intervalDays,
      reviewType,
    });
  }

  /**
   * Get review history for a card
   */
  async getCardHistory(cardId: string, limit: number = 50): Promise<Revlog[]> {
    return this.revlogRepository.find({
      where: { cardId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get user's review history
   */
  async getUserHistory(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100,
  ): Promise<Revlog[]> {
    const query = this.revlogRepository.createQueryBuilder('revlog')
      .where('revlog.user_id = :userId', { userId })
      .orderBy('revlog.created_at', 'DESC')
      .take(limit);

    if (startDate && endDate) {
      query.andWhere('revlog.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    return query.getMany();
  }

  /**
   * Get review stats for a user
   */
  async getUserStats(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ReviewStats> {
    const reviews = await this.revlogRepository.find({
      where: {
        userId,
        createdAt: Between(startDate, endDate),
      },
    });

    const totalReviews = reviews.length;
    const correctReviews = reviews.filter((r) => r.rating >= Rating.Good).length;
    const averageResponseTime = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.responseTimeMs, 0) / totalReviews
      : 0;

    // Group by module (from card)
    const byModule: Record<number, { total: number; correct: number }> = {};

    // Note: Would need to join with cards to get module info
    // For now, return empty module stats

    return {
      totalReviews,
      correctReviews,
      averageResponseTime,
      byModule,
    };
  }

  /**
   * Get today's review count for a user
   */
  async getTodayReviewCount(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.revlogRepository.count({
      where: {
        userId,
        createdAt: Between(today, tomorrow),
      },
    });
  }

  /**
   * Get review streak (consecutive days with reviews)
   */
  async getReviewStreak(userId: string): Promise<number> {
    // Get distinct review dates in descending order
    const result = await this.revlogRepository
      .createQueryBuilder('revlog')
      .select('DATE(revlog.created_at)', 'review_date')
      .where('revlog.user_id = :userId', { userId })
      .groupBy('DATE(revlog.created_at)')
      .orderBy('review_date', 'DESC')
      .getRawMany();

    if (result.length === 0) {
      return 0;
    }

    let streak = 0;
    let expectedDate = new Date();
    expectedDate.setHours(0, 0, 0, 0);

    for (const row of result) {
      const reviewDate = new Date(row.review_date);
      reviewDate.setHours(0, 0, 0, 0);

      // Check if this is the expected date (today or consecutive day)
      if (reviewDate.getTime() === expectedDate.getTime()) {
        streak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else if (reviewDate.getTime() === expectedDate.getTime() - 24 * 60 * 60 * 1000) {
        // Allow for yesterday if no review today yet
        if (streak === 0) {
          streak++;
          expectedDate = new Date(reviewDate);
          expectedDate.setDate(expectedDate.getDate() - 1);
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return streak;
  }
}
