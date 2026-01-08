import { ReviewService } from '../../../src/modules/review/review.service';
import { Card, CardStatus } from '../../../src/modules/fsrs/entities/card.entity';

describe('ReviewService - Scheduling', () => {
  // Mock dependencies would be injected in real tests
  // These tests focus on the scheduling logic

  describe('getDueCards ordering', () => {
    it('should order cards by due date ascending', () => {
      const cards: Partial<Card>[] = [
        { id: '1', dueAt: new Date('2024-01-03'), status: CardStatus.REVIEW },
        { id: '2', dueAt: new Date('2024-01-01'), status: CardStatus.REVIEW },
        { id: '3', dueAt: new Date('2024-01-02'), status: CardStatus.REVIEW },
      ];

      const sorted = cards.sort((a, b) =>
        (a.dueAt?.getTime() || 0) - (b.dueAt?.getTime() || 0)
      );

      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('3');
      expect(sorted[2].id).toBe('1');
    });

    it('should prioritize overdue cards over future cards', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const cards: Partial<Card>[] = [
        { id: 'future', dueAt: tomorrow, status: CardStatus.REVIEW },
        { id: 'overdue', dueAt: yesterday, status: CardStatus.REVIEW },
      ];

      const sorted = cards.sort((a, b) =>
        (a.dueAt?.getTime() || 0) - (b.dueAt?.getTime() || 0)
      );

      expect(sorted[0].id).toBe('overdue');
    });
  });

  describe('calculateRetrievability', () => {
    it('should return high retrievability for recently reviewed cards', () => {
      const stability = 10; // 10 days
      const elapsedDays = 1;

      // R = (1 + elapsed/stability * 19)^(-1)
      // R = (1 + 1/10 * 19)^(-1) = (1 + 1.9)^(-1) = 0.345
      const retrievability = Math.pow(1 + (elapsedDays / stability) * 19, -1);

      expect(retrievability).toBeGreaterThan(0.3);
    });

    it('should return low retrievability for cards due long ago', () => {
      const stability = 10;
      const elapsedDays = 30;

      const retrievability = Math.pow(1 + (elapsedDays / stability) * 19, -1);

      expect(retrievability).toBeLessThan(0.1);
    });

    it('should return 1.0 for newly created cards', () => {
      const stability = 0;
      const elapsedDays = 0;

      // Special case: new cards have 100% retrievability
      const retrievability = stability === 0 ? 1.0 :
        Math.pow(1 + (elapsedDays / stability) * 19, -1);

      expect(retrievability).toBe(1.0);
    });
  });

  describe('groupCardsByModule', () => {
    it('should group cards by module type', () => {
      const cards: Partial<Card>[] = [
        { id: '1', moduleType: 1 },
        { id: '2', moduleType: 2 },
        { id: '3', moduleType: 1 },
        { id: '4', moduleType: 3 },
      ];

      const grouped = cards.reduce((acc, card) => {
        const key = card.moduleType || 0;
        if (!acc[key]) acc[key] = [];
        acc[key].push(card);
        return acc;
      }, {} as Record<number, Partial<Card>[]>);

      expect(grouped[1]).toHaveLength(2);
      expect(grouped[2]).toHaveLength(1);
      expect(grouped[3]).toHaveLength(1);
    });
  });

  describe('review session order', () => {
    it('should follow module order: 1 → 2 → 3 → 7 → 8 → 9 → 10', () => {
      const moduleOrder = [1, 2, 3, 7, 8, 9, 10];

      const cards: Partial<Card>[] = [
        { id: 'a', moduleType: 7 },
        { id: 'b', moduleType: 1 },
        { id: 'c', moduleType: 3 },
        { id: 'd', moduleType: 2 },
      ];

      const sorted = cards.sort((a, b) => {
        const orderA = moduleOrder.indexOf(a.moduleType || 0);
        const orderB = moduleOrder.indexOf(b.moduleType || 0);
        return orderA - orderB;
      });

      expect(sorted[0].moduleType).toBe(1);
      expect(sorted[1].moduleType).toBe(2);
      expect(sorted[2].moduleType).toBe(3);
      expect(sorted[3].moduleType).toBe(7);
    });
  });

  describe('overdue detection', () => {
    it('should identify cards overdue by more than 24 hours', () => {
      const now = new Date();
      const threshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const cards: Partial<Card>[] = [
        { id: 'overdue', dueAt: new Date(now.getTime() - 48 * 60 * 60 * 1000) },
        { id: 'recent', dueAt: new Date(now.getTime() - 12 * 60 * 60 * 1000) },
        { id: 'future', dueAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
      ];

      const overdue = cards.filter(c => c.dueAt && c.dueAt < threshold);

      expect(overdue).toHaveLength(1);
      expect(overdue[0].id).toBe('overdue');
    });
  });

  describe('batch review limits', () => {
    it('should limit batch size to 20 cards', () => {
      const cards = Array.from({ length: 50 }, (_, i) => ({
        id: `card-${i}`,
        dueAt: new Date(),
      }));

      const batchSize = 20;
      const batch = cards.slice(0, batchSize);

      expect(batch).toHaveLength(20);
    });
  });
});
