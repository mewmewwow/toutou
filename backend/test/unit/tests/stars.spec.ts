import { StarService } from '../../../src/modules/tests/star.service';

describe('StarService', () => {
  let service: StarService;

  beforeEach(() => {
    service = new StarService();
  });

  describe('calculateStars', () => {
    it('should award 0 stars for failing score', () => {
      const stars = service.calculateStars({
        percentage: 59,
        mode: 'normal',
        passed: false,
      });
      expect(stars).toBe(0);
    });

    it('should award 1 star for passing with 60-69% in normal mode', () => {
      const stars = service.calculateStars({
        percentage: 65,
        mode: 'normal',
        passed: true,
      });
      expect(stars).toBe(1);
    });

    it('should award 2 stars for 70-84% in normal mode', () => {
      const stars = service.calculateStars({
        percentage: 75,
        mode: 'normal',
        passed: true,
      });
      expect(stars).toBe(2);
    });

    it('should award 3 stars for 85-100% in normal mode', () => {
      const stars = service.calculateStars({
        percentage: 90,
        mode: 'normal',
        passed: true,
      });
      expect(stars).toBe(3);
    });

    it('should award bonus star for speed challenge completion', () => {
      const normalStars = service.calculateStars({
        percentage: 85,
        mode: 'normal',
        passed: true,
      });

      const speedStars = service.calculateStars({
        percentage: 85,
        mode: 'speed',
        passed: true,
      });

      expect(speedStars).toBe(normalStars + 1);
    });

    it('should award max stars for ultimate challenge completion', () => {
      const stars = service.calculateStars({
        percentage: 95,
        mode: 'ultimate',
        passed: true,
      });
      expect(stars).toBe(5); // Max stars
    });

    it('should not award stars for failed ultimate challenge', () => {
      const stars = service.calculateStars({
        percentage: 85, // Below 90% threshold
        mode: 'ultimate',
        passed: false,
      });
      expect(stars).toBe(0);
    });
  });

  describe('getMaxStars', () => {
    it('should return 3 for normal mode', () => {
      expect(service.getMaxStars('normal')).toBe(3);
    });

    it('should return 4 for speed challenge', () => {
      expect(service.getMaxStars('speed')).toBe(4);
    });

    it('should return 5 for ultimate challenge', () => {
      expect(service.getMaxStars('ultimate')).toBe(5);
    });
  });

  describe('getStarThresholds', () => {
    it('should return correct thresholds for normal mode', () => {
      const thresholds = service.getStarThresholds('normal');
      expect(thresholds).toEqual([60, 70, 85]);
    });

    it('should return correct thresholds for speed challenge', () => {
      const thresholds = service.getStarThresholds('speed');
      expect(thresholds).toEqual([70, 80, 90, 95]);
    });

    it('should return correct thresholds for ultimate challenge', () => {
      const thresholds = service.getStarThresholds('ultimate');
      expect(thresholds).toEqual([90, 92, 95, 98, 100]);
    });
  });

  describe('calculateUnitStars', () => {
    it('should aggregate stars across all modules for a unit', () => {
      const moduleStars = [
        { moduleType: 1, stars: 3 },
        { moduleType: 2, stars: 2 },
        { moduleType: 3, stars: 3 },
      ];

      const total = service.calculateUnitStars(moduleStars);
      expect(total).toBe(8);
    });

    it('should handle empty module list', () => {
      const total = service.calculateUnitStars([]);
      expect(total).toBe(0);
    });

    it('should calculate max possible stars for unit', () => {
      const maxStars = service.getMaxUnitStars('normal', 3); // 3 modules
      expect(maxStars).toBe(9); // 3 stars × 3 modules
    });
  });

  describe('formatStarDisplay', () => {
    it('should format stars as filled and empty icons', () => {
      const display = service.formatStarDisplay(2, 3);
      expect(display.filled).toBe(2);
      expect(display.empty).toBe(1);
      expect(display.total).toBe(3);
    });

    it('should handle zero stars', () => {
      const display = service.formatStarDisplay(0, 3);
      expect(display.filled).toBe(0);
      expect(display.empty).toBe(3);
    });

    it('should handle max stars', () => {
      const display = service.formatStarDisplay(5, 5);
      expect(display.filled).toBe(5);
      expect(display.empty).toBe(0);
    });
  });

  describe('isNewRecord', () => {
    it('should return true if new stars exceed previous', () => {
      const isRecord = service.isNewRecord(3, 2);
      expect(isRecord).toBe(true);
    });

    it('should return false if new stars equal previous', () => {
      const isRecord = service.isNewRecord(3, 3);
      expect(isRecord).toBe(false);
    });

    it('should return false if new stars less than previous', () => {
      const isRecord = service.isNewRecord(2, 3);
      expect(isRecord).toBe(false);
    });

    it('should return true for first attempt (no previous)', () => {
      const isRecord = service.isNewRecord(1, null);
      expect(isRecord).toBe(true);
    });
  });
});
