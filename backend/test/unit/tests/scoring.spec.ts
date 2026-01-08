import { TestScoringService } from '../../../src/modules/tests/test-scoring.service';

describe('TestScoringService', () => {
  let service: TestScoringService;

  beforeEach(() => {
    service = new TestScoringService();
  });

  describe('calculateScore', () => {
    it('should calculate percentage correctly', () => {
      const result = service.calculateScore(80, 100);
      expect(result.score).toBe(80);
      expect(result.percentage).toBe(80);
    });

    it('should handle zero total questions', () => {
      const result = service.calculateScore(0, 0);
      expect(result.score).toBe(0);
      expect(result.percentage).toBe(0);
    });

    it('should round percentage', () => {
      const result = service.calculateScore(33, 100);
      expect(result.percentage).toBe(33);
    });
  });

  describe('calculateSpeedBonus', () => {
    it('should return 0 when time limit exceeded', () => {
      const bonus = service.calculateSpeedBonus(50000, 40000);
      expect(bonus).toBe(0);
    });

    it('should calculate bonus for time saved', () => {
      // 20 minutes taken, 40 minutes limit = 50% time saved
      const bonus = service.calculateSpeedBonus(20 * 60 * 1000, 40 * 60 * 1000);
      expect(bonus).toBeGreaterThan(0);
      expect(bonus).toBeLessThanOrEqual(20);
    });

    it('should cap bonus at maxSpeedBonus', () => {
      // Very fast completion
      const bonus = service.calculateSpeedBonus(1000, 40 * 60 * 1000);
      expect(bonus).toBeLessThanOrEqual(20);
    });

    it('should return 0 for no time limit', () => {
      const bonus = service.calculateSpeedBonus(1000, 0);
      expect(bonus).toBe(0);
    });
  });

  describe('calculateFinalScore', () => {
    it('should calculate normal mode without speed bonus', () => {
      const result = service.calculateFinalScore({
        correctCount: 80,
        totalQuestions: 100,
        timeTakenMs: 30 * 60 * 1000,
        timeLimitMs: 0,
        mode: 'normal',
      });

      expect(result.baseScore).toBe(80);
      expect(result.speedBonus).toBe(0);
      expect(result.finalScore).toBe(80);
      expect(result.passed).toBe(true); // 80% > 60% threshold
    });

    it('should calculate speed challenge with bonus', () => {
      const result = service.calculateFinalScore({
        correctCount: 70,
        totalQuestions: 100,
        timeTakenMs: 20 * 60 * 1000, // 20 minutes
        timeLimitMs: 40 * 60 * 1000, // 40 minutes limit
        mode: 'speed',
      });

      expect(result.baseScore).toBe(70);
      expect(result.speedBonus).toBeGreaterThan(0);
      expect(result.finalScore).toBeGreaterThan(70);
      expect(result.passed).toBe(true); // 70% = 70% threshold
    });

    it('should cap final score at 100', () => {
      const result = service.calculateFinalScore({
        correctCount: 95,
        totalQuestions: 100,
        timeTakenMs: 5 * 60 * 1000, // Very fast
        timeLimitMs: 40 * 60 * 1000,
        mode: 'speed',
      });

      expect(result.finalScore).toBeLessThanOrEqual(100);
    });

    it('should fail ultimate challenge below 90%', () => {
      const result = service.calculateFinalScore({
        correctCount: 85,
        totalQuestions: 100,
        timeTakenMs: 20 * 60 * 1000,
        timeLimitMs: 30 * 60 * 1000,
        mode: 'ultimate',
      });

      expect(result.passed).toBe(false);
    });

    it('should pass ultimate challenge at 90%+', () => {
      const result = service.calculateFinalScore({
        correctCount: 90,
        totalQuestions: 100,
        timeTakenMs: 20 * 60 * 1000,
        timeLimitMs: 30 * 60 * 1000,
        mode: 'ultimate',
      });

      expect(result.passed).toBe(true);
    });
  });

  describe('getPassingThreshold', () => {
    it('should return 60 for normal mode', () => {
      expect(service.getPassingThreshold('normal')).toBe(60);
    });

    it('should return 70 for speed challenge', () => {
      expect(service.getPassingThreshold('speed')).toBe(70);
    });

    it('should return 90 for ultimate challenge', () => {
      expect(service.getPassingThreshold('ultimate')).toBe(90);
    });
  });

  describe('isPassing', () => {
    it('should pass normal mode at 60%', () => {
      expect(service.isPassing(60, 'normal')).toBe(true);
    });

    it('should fail normal mode at 59%', () => {
      expect(service.isPassing(59, 'normal')).toBe(false);
    });

    it('should pass speed challenge at 70%', () => {
      expect(service.isPassing(70, 'speed')).toBe(true);
    });

    it('should fail speed challenge at 69%', () => {
      expect(service.isPassing(69, 'speed')).toBe(false);
    });

    it('should pass ultimate challenge at 90%', () => {
      expect(service.isPassing(90, 'ultimate')).toBe(true);
    });

    it('should fail ultimate challenge at 89%', () => {
      expect(service.isPassing(89, 'ultimate')).toBe(false);
    });
  });

  describe('calculateAccuracy', () => {
    it('should calculate accuracy percentage', () => {
      const accuracy = service.calculateAccuracy(85, 100);
      expect(accuracy).toBe(85);
    });

    it('should handle zero questions', () => {
      const accuracy = service.calculateAccuracy(0, 0);
      expect(accuracy).toBe(0);
    });

    it('should round accuracy', () => {
      const accuracy = service.calculateAccuracy(67, 100);
      expect(accuracy).toBe(67);
    });
  });
});
