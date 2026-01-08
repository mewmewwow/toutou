import { Injectable } from '@nestjs/common';
import { TestModeType } from './test-scoring.service';

export interface StarCalculationInput {
  percentage: number;
  mode: TestModeType;
  passed: boolean;
}

export interface StarDisplay {
  filled: number;
  empty: number;
  total: number;
}

export interface ModuleStars {
  moduleType: number;
  stars: number;
}

@Injectable()
export class StarService {
  // Star thresholds for each mode
  private readonly starThresholds: Record<TestModeType, number[]> = {
    normal: [60, 70, 85], // 1-3 stars
    speed: [70, 80, 90, 95], // 1-4 stars
    ultimate: [90, 92, 95, 98, 100], // 1-5 stars
  };

  /**
   * Calculate stars earned based on score and mode
   */
  calculateStars(input: StarCalculationInput): number {
    if (!input.passed) {
      return 0;
    }

    const thresholds = this.starThresholds[input.mode];
    let stars = 0;

    for (const threshold of thresholds) {
      if (input.percentage >= threshold) {
        stars++;
      } else {
        break;
      }
    }

    return stars;
  }

  /**
   * Get maximum possible stars for a mode
   */
  getMaxStars(mode: TestModeType): number {
    return this.starThresholds[mode].length;
  }

  /**
   * Get star thresholds for a mode
   */
  getStarThresholds(mode: TestModeType): number[] {
    return this.starThresholds[mode];
  }

  /**
   * Calculate total stars for a unit across all modules
   */
  calculateUnitStars(moduleStars: ModuleStars[]): number {
    return moduleStars.reduce((total, m) => total + m.stars, 0);
  }

  /**
   * Get maximum possible stars for a unit
   */
  getMaxUnitStars(mode: TestModeType, moduleCount: number): number {
    return this.getMaxStars(mode) * moduleCount;
  }

  /**
   * Format stars for display (filled vs empty)
   */
  formatStarDisplay(stars: number, maxStars: number): StarDisplay {
    return {
      filled: stars,
      empty: maxStars - stars,
      total: maxStars,
    };
  }

  /**
   * Check if this is a new record (more stars than previous best)
   */
  isNewRecord(newStars: number, previousStars: number | null): boolean {
    if (previousStars === null) {
      return newStars > 0;
    }
    return newStars > previousStars;
  }

  /**
   * Calculate star percentage (useful for progress indicators)
   */
  calculateStarPercentage(stars: number, maxStars: number): number {
    if (maxStars === 0) return 0;
    return Math.round((stars / maxStars) * 100);
  }

  /**
   * Get star tier description
   */
  getStarTier(stars: number, mode: TestModeType): string {
    const maxStars = this.getMaxStars(mode);

    if (stars === 0) return '未通过';
    if (stars === maxStars) return '完美';
    if (stars >= maxStars * 0.8) return '优秀';
    if (stars >= maxStars * 0.6) return '良好';
    return '及格';
  }
}
