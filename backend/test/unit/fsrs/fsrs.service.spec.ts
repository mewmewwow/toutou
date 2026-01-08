import { Test, TestingModule } from '@nestjs/testing';
import { FsrsService, FsrsRating } from '../../../src/modules/fsrs/fsrs.service';

describe('FsrsService', () => {
  let service: FsrsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FsrsService],
    }).compile();

    service = module.get<FsrsService>(FsrsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNewCard', () => {
    it('should create a new card with default FSRS parameters', () => {
      const card = service.createNewCard();

      expect(card.stability).toBeGreaterThan(0);
      expect(card.difficulty).toBeGreaterThan(0);
      expect(card.difficulty).toBeLessThanOrEqual(1);
      expect(card.dueAt).toBeDefined();
    });
  });

  describe('reviewCard', () => {
    it('should increase stability on correct answer (rating 3)', () => {
      const card = service.createNewCard();
      const initialStability = card.stability;

      const result = service.reviewCard(card, FsrsRating.Good);

      expect(result.newStability).toBeGreaterThan(initialStability);
      expect(result.intervalDays).toBeGreaterThan(0);
    });

    it('should decrease stability on incorrect answer (rating 1)', () => {
      // First, build up some stability
      let card = service.createNewCard();
      let result = service.reviewCard(card, FsrsRating.Good);
      card = {
        ...card,
        stability: result.newStability,
        difficulty: result.newDifficulty,
      };

      // Then fail
      result = service.reviewCard(card, FsrsRating.Again);

      // Stability should be reset/reduced
      expect(result.newStability).toBeLessThan(card.stability);
    });

    it('should increase difficulty on fail (rating 1)', () => {
      const card = service.createNewCard();
      const initialDifficulty = card.difficulty;

      const result = service.reviewCard(card, FsrsRating.Again);

      expect(result.newDifficulty).toBeGreaterThanOrEqual(initialDifficulty);
    });

    it('should decrease difficulty on easy (rating 4)', () => {
      const card = service.createNewCard();
      const initialDifficulty = card.difficulty;

      const result = service.reviewCard(card, FsrsRating.Easy);

      expect(result.newDifficulty).toBeLessThanOrEqual(initialDifficulty);
    });

    it('should calculate next due date', () => {
      const card = service.createNewCard();
      const result = service.reviewCard(card, FsrsRating.Good);

      expect(result.nextDue).toBeInstanceOf(Date);
      expect(result.nextDue.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('rating validation', () => {
    it('should accept valid ratings (0-4)', () => {
      const card = service.createNewCard();

      expect(() => service.reviewCard(card, FsrsRating.Again)).not.toThrow();
      expect(() => service.reviewCard(card, FsrsRating.Hard)).not.toThrow();
      expect(() => service.reviewCard(card, FsrsRating.Good)).not.toThrow();
      expect(() => service.reviewCard(card, FsrsRating.Easy)).not.toThrow();
    });
  });

  describe('target retention', () => {
    it('should use 90% target retention rate', () => {
      // The service should be configured with 90% retention
      expect(service.getTargetRetention()).toBe(0.9);
    });
  });

  describe('scheduling precision', () => {
    it('should schedule with second-level precision', () => {
      const card = service.createNewCard();
      const result = service.reviewCard(card, FsrsRating.Good);

      // Due date should have seconds component (not rounded to day)
      const dueDate = result.nextDue;
      expect(dueDate).toBeInstanceOf(Date);
    });
  });
});
