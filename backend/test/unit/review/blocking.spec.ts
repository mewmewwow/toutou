import { ReviewBlockingService } from '../../../src/modules/review/review-blocking.service';

describe('ReviewBlockingService', () => {
  let service: ReviewBlockingService;

  beforeEach(() => {
    service = new ReviewBlockingService();
  });

  describe('shouldBlockNewLearning', () => {
    it('should not block when overdue count is below threshold', () => {
      const result = service.shouldBlockNewLearning(10);
      expect(result.isBlocked).toBe(false);
    });

    it('should not block when overdue count equals threshold', () => {
      const result = service.shouldBlockNewLearning(25);
      expect(result.isBlocked).toBe(false);
    });

    it('should block when overdue count exceeds threshold', () => {
      const result = service.shouldBlockNewLearning(26);
      expect(result.isBlocked).toBe(true);
    });

    it('should block when overdue count is significantly above threshold', () => {
      const result = service.shouldBlockNewLearning(100);
      expect(result.isBlocked).toBe(true);
    });

    it('should return blocking message when blocked', () => {
      const result = service.shouldBlockNewLearning(30);
      expect(result.isBlocked).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.overdueCount).toBe(30);
    });

    it('should not return blocking message when not blocked', () => {
      const result = service.shouldBlockNewLearning(10);
      expect(result.isBlocked).toBe(false);
      expect(result.message).toBeUndefined();
    });
  });

  describe('getBlockingThreshold', () => {
    it('should return 25 as default threshold', () => {
      expect(service.getBlockingThreshold()).toBe(25);
    });
  });

  describe('calculateReviewPriority', () => {
    it('should prioritize cards with lower retrievability', () => {
      const cards = [
        { id: '1', retrievability: 0.9 },
        { id: '2', retrievability: 0.5 },
        { id: '3', retrievability: 0.3 },
      ];

      const prioritized = service.calculateReviewPriority(cards);

      expect(prioritized[0].id).toBe('3'); // Lowest retrievability first
      expect(prioritized[1].id).toBe('2');
      expect(prioritized[2].id).toBe('1');
    });

    it('should handle empty card list', () => {
      const result = service.calculateReviewPriority([]);
      expect(result).toEqual([]);
    });

    it('should handle cards with same retrievability', () => {
      const cards = [
        { id: '1', retrievability: 0.5 },
        { id: '2', retrievability: 0.5 },
      ];

      const prioritized = service.calculateReviewPriority(cards);
      expect(prioritized).toHaveLength(2);
    });
  });

  describe('getBlockingStatus', () => {
    it('should return detailed blocking status', () => {
      const status = service.getBlockingStatus(30, 25);

      expect(status.isBlocked).toBe(true);
      expect(status.overdueCount).toBe(30);
      expect(status.threshold).toBe(25);
      expect(status.excessCount).toBe(5);
    });

    it('should calculate excess correctly when not blocked', () => {
      const status = service.getBlockingStatus(20, 25);

      expect(status.isBlocked).toBe(false);
      expect(status.excessCount).toBe(0);
    });
  });

  describe('estimateReviewTime', () => {
    it('should estimate 30 seconds per card', () => {
      const estimate = service.estimateReviewTime(10);
      expect(estimate.totalSeconds).toBe(300); // 10 * 30
      expect(estimate.minutes).toBe(5);
    });

    it('should return 0 for empty review', () => {
      const estimate = service.estimateReviewTime(0);
      expect(estimate.totalSeconds).toBe(0);
      expect(estimate.minutes).toBe(0);
    });

    it('should round up minutes', () => {
      const estimate = service.estimateReviewTime(3); // 90 seconds = 1.5 minutes
      expect(estimate.minutes).toBe(2); // Rounded up
    });
  });
});
