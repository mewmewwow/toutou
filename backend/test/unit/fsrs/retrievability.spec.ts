import { Test, TestingModule } from '@nestjs/testing';
import { FsrsService } from '../../../src/modules/fsrs/fsrs.service';
import { calculateRetrievability, getUrgencyLevel } from '../../../src/modules/fsrs/fsrs.utils';

describe('Retrievability Calculation', () => {
  let service: FsrsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FsrsService],
    }).compile();

    service = module.get<FsrsService>(FsrsService);
  });

  describe('calculateRetrievability', () => {
    it('should return 100% for just-reviewed card', () => {
      const stability = 10;
      const daysSinceReview = 0;

      const retrievability = calculateRetrievability(stability, daysSinceReview);

      expect(retrievability).toBeCloseTo(1, 2);
    });

    it('should decrease as days increase', () => {
      const stability = 10;

      const r0 = calculateRetrievability(stability, 0);
      const r5 = calculateRetrievability(stability, 5);
      const r10 = calculateRetrievability(stability, 10);
      const r30 = calculateRetrievability(stability, 30);

      expect(r0).toBeGreaterThan(r5);
      expect(r5).toBeGreaterThan(r10);
      expect(r10).toBeGreaterThan(r30);
    });

    it('should be higher for more stable cards at same elapsed time', () => {
      const daysSinceReview = 7;

      const rLowStability = calculateRetrievability(5, daysSinceReview);
      const rHighStability = calculateRetrievability(20, daysSinceReview);

      expect(rHighStability).toBeGreaterThan(rLowStability);
    });

    it('should return approximately 90% at the scheduled interval', () => {
      // For a card with stability S, it should be ~90% at day S (with target retention 0.9)
      const stability = 10;
      const daysSinceReview = stability;

      const retrievability = calculateRetrievability(stability, daysSinceReview);

      // Should be close to target retention (0.9)
      expect(retrievability).toBeGreaterThan(0.85);
      expect(retrievability).toBeLessThan(0.95);
    });

    it('should never return negative values', () => {
      const retrievability = calculateRetrievability(1, 1000);
      expect(retrievability).toBeGreaterThanOrEqual(0);
    });

    it('should never return values greater than 1', () => {
      const retrievability = calculateRetrievability(1000, 0);
      expect(retrievability).toBeLessThanOrEqual(1);
    });

    it('should handle zero stability', () => {
      const retrievability = calculateRetrievability(0, 5);
      expect(retrievability).toBe(0);
    });

    it('should handle negative days (return 0)', () => {
      const retrievability = calculateRetrievability(10, -5);
      expect(retrievability).toBe(0);
    });
  });

  describe('getUrgencyLevel', () => {
    it('should return "overdue" for past due cards', () => {
      const pastDue = new Date();
      pastDue.setDate(pastDue.getDate() - 2);

      const urgency = getUrgencyLevel(pastDue);

      expect(urgency).toBe('overdue');
    });

    it('should return "due_today" for cards due today', () => {
      const today = new Date();

      const urgency = getUrgencyLevel(today);

      expect(urgency).toBe('due_today');
    });

    it('should return "due_soon" for cards due within 3 days', () => {
      const soon = new Date();
      soon.setDate(soon.getDate() + 2);

      const urgency = getUrgencyLevel(soon);

      expect(urgency).toBe('due_soon');
    });

    it('should return "stable" for cards due later', () => {
      const later = new Date();
      later.setDate(later.getDate() + 10);

      const urgency = getUrgencyLevel(later);

      expect(urgency).toBe('stable');
    });
  });

  describe('integration with FsrsService', () => {
    it('should match service calculation', () => {
      const stability = 15;
      const daysSinceReview = 7;

      const utilResult = calculateRetrievability(stability, daysSinceReview);
      const serviceResult = service.calculateRetrievability(stability, daysSinceReview);

      expect(utilResult).toBeCloseTo(serviceResult, 5);
    });
  });
});
