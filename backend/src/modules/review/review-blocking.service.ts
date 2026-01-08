import { Injectable } from '@nestjs/common';

export interface BlockingResult {
  isBlocked: boolean;
  overdueCount?: number;
  message?: string;
}

export interface BlockingStatus {
  isBlocked: boolean;
  overdueCount: number;
  threshold: number;
  excessCount: number;
}

export interface ReviewTimeEstimate {
  totalSeconds: number;
  minutes: number;
}

export interface PrioritizedCard {
  id: string;
  retrievability: number;
}

@Injectable()
export class ReviewBlockingService {
  private readonly blockingThreshold = 25;
  private readonly secondsPerCard = 30;

  /**
   * Check if new learning should be blocked based on overdue count
   */
  shouldBlockNewLearning(overdueCount: number): BlockingResult {
    if (overdueCount > this.blockingThreshold) {
      return {
        isBlocked: true,
        overdueCount,
        message: `您有 ${overdueCount} 个单词需要复习。请先完成复习再学习新单词。`,
      };
    }

    return {
      isBlocked: false,
    };
  }

  /**
   * Get the blocking threshold
   */
  getBlockingThreshold(): number {
    return this.blockingThreshold;
  }

  /**
   * Calculate review priority - cards with lower retrievability first
   */
  calculateReviewPriority<T extends PrioritizedCard>(cards: T[]): T[] {
    return [...cards].sort((a, b) => a.retrievability - b.retrievability);
  }

  /**
   * Get detailed blocking status
   */
  getBlockingStatus(overdueCount: number, threshold: number): BlockingStatus {
    const isBlocked = overdueCount > threshold;
    return {
      isBlocked,
      overdueCount,
      threshold,
      excessCount: isBlocked ? overdueCount - threshold : 0,
    };
  }

  /**
   * Estimate time to complete review
   */
  estimateReviewTime(cardCount: number): ReviewTimeEstimate {
    const totalSeconds = cardCount * this.secondsPerCard;
    const minutes = Math.ceil(totalSeconds / 60);

    return {
      totalSeconds,
      minutes,
    };
  }
}
