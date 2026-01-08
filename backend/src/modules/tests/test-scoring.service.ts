import { Injectable } from '@nestjs/common';

export type TestModeType = 'normal' | 'speed' | 'ultimate';

export interface ScoreResult {
  score: number;
  percentage: number;
}

export interface FinalScoreResult {
  baseScore: number;
  speedBonus: number;
  finalScore: number;
  percentage: number;
  passed: boolean;
}

export interface FinalScoreInput {
  correctCount: number;
  totalQuestions: number;
  timeTakenMs: number;
  timeLimitMs: number;
  mode: TestModeType;
}

@Injectable()
export class TestScoringService {
  private readonly passingThresholds: Record<TestModeType, number> = {
    normal: 60,
    speed: 70,
    ultimate: 90,
  };

  private readonly maxSpeedBonus = 20; // Max 20% bonus

  /**
   * Calculate base score from correct answers
   */
  calculateScore(correctCount: number, totalQuestions: number): ScoreResult {
    if (totalQuestions === 0) {
      return { score: 0, percentage: 0 };
    }

    const percentage = Math.round((correctCount / totalQuestions) * 100);
    return {
      score: percentage,
      percentage,
    };
  }

  /**
   * Calculate speed bonus for finishing under time limit
   */
  calculateSpeedBonus(timeTakenMs: number, timeLimitMs: number): number {
    if (timeLimitMs <= 0 || timeTakenMs >= timeLimitMs) {
      return 0;
    }

    // Calculate how much time was saved (as percentage of limit)
    const timeSavedPercent = ((timeLimitMs - timeTakenMs) / timeLimitMs) * 100;

    // Convert to bonus (scaled to max bonus)
    const bonus = Math.min(this.maxSpeedBonus, timeSavedPercent / 2);

    return Math.round(bonus * 100) / 100;
  }

  /**
   * Calculate final score with mode-specific bonuses
   */
  calculateFinalScore(input: FinalScoreInput): FinalScoreResult {
    const { correctCount, totalQuestions, timeTakenMs, timeLimitMs, mode } = input;

    const baseResult = this.calculateScore(correctCount, totalQuestions);
    let speedBonus = 0;
    let finalScore = baseResult.score;

    // Apply speed bonus for timed modes
    if (mode !== 'normal' && timeLimitMs > 0) {
      speedBonus = this.calculateSpeedBonus(timeTakenMs, timeLimitMs);
      finalScore = Math.min(100, baseResult.score + speedBonus);
    }

    // Check if passed
    const passed = this.isPassing(baseResult.percentage, mode);

    return {
      baseScore: baseResult.score,
      speedBonus,
      finalScore: Math.round(finalScore * 100) / 100,
      percentage: baseResult.percentage,
      passed,
    };
  }

  /**
   * Get passing threshold for a mode
   */
  getPassingThreshold(mode: TestModeType): number {
    return this.passingThresholds[mode];
  }

  /**
   * Check if score passes for given mode
   */
  isPassing(percentage: number, mode: TestModeType): boolean {
    return percentage >= this.passingThresholds[mode];
  }

  /**
   * Calculate accuracy percentage
   */
  calculateAccuracy(correctCount: number, totalQuestions: number): number {
    if (totalQuestions === 0) return 0;
    return Math.round((correctCount / totalQuestions) * 100);
  }
}
