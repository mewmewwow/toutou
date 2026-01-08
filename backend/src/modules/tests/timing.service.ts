import { Injectable } from '@nestjs/common';

export type TestModeType = 'normal' | 'speed' | 'ultimate';

export interface TimingConfig {
  timeLimitMs: number | null;
  warningThresholdMs: number | null;
}

@Injectable()
export class TimingService {
  // Time limits in milliseconds
  private readonly timeLimits: Record<TestModeType, number | null> = {
    normal: null, // No time limit
    speed: 40 * 60 * 1000, // 40 minutes
    ultimate: 30 * 60 * 1000, // 30 minutes
  };

  // Warning threshold (when to show warning)
  private readonly warningThresholds: Record<TestModeType, number | null> = {
    normal: null,
    speed: 5 * 60 * 1000, // 5 minutes warning
    ultimate: 3 * 60 * 1000, // 3 minutes warning
  };

  /**
   * Get timing configuration for a test mode
   */
  getTimingConfig(mode: TestModeType): TimingConfig {
    return {
      timeLimitMs: this.timeLimits[mode],
      warningThresholdMs: this.warningThresholds[mode],
    };
  }

  /**
   * Get time limit for a mode
   */
  getTimeLimit(mode: TestModeType): number | null {
    return this.timeLimits[mode];
  }

  /**
   * Check if time has expired
   */
  isTimeExpired(startTime: Date, mode: TestModeType): boolean {
    const limit = this.timeLimits[mode];
    if (!limit) return false;

    const elapsed = Date.now() - startTime.getTime();
    return elapsed > limit;
  }

  /**
   * Get remaining time in milliseconds
   */
  getRemainingTime(startTime: Date, mode: TestModeType): number | null {
    const limit = this.timeLimits[mode];
    if (!limit) return null;

    const elapsed = Date.now() - startTime.getTime();
    return Math.max(0, limit - elapsed);
  }

  /**
   * Check if should show warning
   */
  shouldShowWarning(startTime: Date, mode: TestModeType): boolean {
    const remaining = this.getRemainingTime(startTime, mode);
    const warning = this.warningThresholds[mode];

    if (remaining === null || warning === null) return false;
    return remaining <= warning && remaining > 0;
  }

  /**
   * Format time for display
   */
  formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Validate submitted time against server time
   */
  validateSubmittedTime(
    startTime: Date,
    submittedTimeMs: number,
    tolerance: number = 5000, // 5 second tolerance
  ): boolean {
    const actualElapsed = Date.now() - startTime.getTime();
    const difference = Math.abs(actualElapsed - submittedTimeMs);
    return difference <= tolerance;
  }

  /**
   * Check if test was completed within time limit
   */
  isWithinTimeLimit(timeTakenMs: number, mode: TestModeType): boolean {
    const limit = this.timeLimits[mode];
    if (!limit) return true; // No limit means always within
    return timeTakenMs <= limit;
  }
}
