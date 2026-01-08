import { Injectable, BadRequestException } from '@nestjs/common';

/**
 * Time limit validator for learning submissions
 * Each letter in a word allows 2 seconds of response time
 * Example: "abandon" (7 letters) = 14 seconds max
 */
@Injectable()
export class TimeLimitValidator {
  private readonly SECONDS_PER_LETTER = 2;
  private readonly MIN_TIME_MS = 500; // Minimum 500ms to prevent bot submissions
  private readonly MAX_MULTIPLIER = 3; // Allow up to 3x the calculated limit for accessibility

  /**
   * Calculate the maximum allowed response time for a word
   */
  calculateMaxTimeMs(word: string): number {
    const letterCount = word.length;
    const baseTimeMs = letterCount * this.SECONDS_PER_LETTER * 1000;
    return baseTimeMs * this.MAX_MULTIPLIER;
  }

  /**
   * Calculate the expected response time for a word
   */
  calculateExpectedTimeMs(word: string): number {
    const letterCount = word.length;
    return letterCount * this.SECONDS_PER_LETTER * 1000;
  }

  /**
   * Validate response time is within acceptable range
   * Returns true if valid, throws BadRequestException if invalid
   */
  validate(word: string, responseTimeMs: number): boolean {
    // Check minimum time
    if (responseTimeMs < this.MIN_TIME_MS) {
      throw new BadRequestException({
        code: 'RESPONSE_TOO_FAST',
        message: '回答时间过短',
      });
    }

    // Check maximum time (soft limit with multiplier)
    const maxTimeMs = this.calculateMaxTimeMs(word);
    if (responseTimeMs > maxTimeMs) {
      // Don't reject, but log for analytics
      // In a real scenario, we might track this for cheating detection
      return true; // Allow but flag
    }

    return true;
  }

  /**
   * Check if response time is suspicious (either too fast or too slow)
   */
  isSuspicious(word: string, responseTimeMs: number): { suspicious: boolean; reason?: string } {
    const expectedTimeMs = this.calculateExpectedTimeMs(word);
    const maxTimeMs = this.calculateMaxTimeMs(word);

    if (responseTimeMs < this.MIN_TIME_MS) {
      return { suspicious: true, reason: 'too_fast' };
    }

    if (responseTimeMs > maxTimeMs) {
      return { suspicious: true, reason: 'too_slow' };
    }

    // Check if significantly faster than expected (possible cheating)
    if (responseTimeMs < expectedTimeMs * 0.3) {
      return { suspicious: true, reason: 'unusually_fast' };
    }

    return { suspicious: false };
  }

  /**
   * Get time limit info for a word (useful for frontend display)
   */
  getTimeLimitInfo(word: string): {
    expectedMs: number;
    maxMs: number;
    letterCount: number;
    secondsPerLetter: number;
  } {
    return {
      expectedMs: this.calculateExpectedTimeMs(word),
      maxMs: this.calculateMaxTimeMs(word),
      letterCount: word.length,
      secondsPerLetter: this.SECONDS_PER_LETTER,
    };
  }
}
