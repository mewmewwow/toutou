import { Test, TestingModule } from '@nestjs/testing';
import { LearningSessionService } from '../../../src/modules/learning/learning-session.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LearningSession, SessionStatus } from '../../../src/modules/learning/entities/learning-session.entity';
import { Card } from '../../../src/modules/fsrs/entities/card.entity';
import { WordsService } from '../../../src/modules/books/words.service';
import { FsrsService } from '../../../src/modules/fsrs/fsrs.service';

describe('LearningSessionService - Batch Management', () => {
  let service: LearningSessionService;

  const mockSessionRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockCardRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  };

  const mockWordsService = {
    getUnitWordCount: jest.fn(),
    getWordsForBatch: jest.fn(),
    getWordsByIds: jest.fn(),
    getWordById: jest.fn(),
  };

  const mockFsrsService = {
    processRating: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearningSessionService,
        {
          provide: getRepositoryToken(LearningSession),
          useValue: mockSessionRepository,
        },
        {
          provide: getRepositoryToken(Card),
          useValue: mockCardRepository,
        },
        {
          provide: WordsService,
          useValue: mockWordsService,
        },
        {
          provide: FsrsService,
          useValue: mockFsrsService,
        },
      ],
    }).compile();

    service = module.get<LearningSessionService>(LearningSessionService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Batch Size Constraints', () => {
    const BATCH_SIZE = 10;

    it('should return exactly 10 words per batch when available', async () => {
      const session = {
        id: 'session-1',
        userId: 'user-1',
        bookId: 'book-1',
        unitNumber: 1,
        moduleType: 1,
        wordsCompleted: 0,
        wordsTotal: 30,
        status: SessionStatus.ACTIVE,
        isReinforcement: false,
      };

      const words = Array(10).fill(null).map((_, i) => ({
        id: `word-${i}`,
        word: `testword${i}`,
        definitions: [{ pos: 'n.', meaning: `meaning ${i}` }],
      }));

      mockSessionRepository.findOne.mockResolvedValue(session);
      mockWordsService.getWordsForBatch.mockResolvedValue(words);
      mockWordsService.getWordsByIds.mockResolvedValue(words);

      const result = await service.getNextBatch('session-1', 'user-1');

      expect(result.words).toHaveLength(BATCH_SIZE);
      expect(mockWordsService.getWordsForBatch).toHaveBeenCalledWith(
        'book-1',
        1,
        0, // offset
        BATCH_SIZE,
      );
    });

    it('should return remaining words if less than 10 left', async () => {
      const session = {
        id: 'session-1',
        userId: 'user-1',
        bookId: 'book-1',
        unitNumber: 1,
        moduleType: 1,
        wordsCompleted: 25,
        wordsTotal: 30,
        status: SessionStatus.ACTIVE,
        isReinforcement: false,
      };

      const words = Array(5).fill(null).map((_, i) => ({
        id: `word-${i}`,
        word: `testword${i}`,
        definitions: [{ pos: 'n.', meaning: `meaning ${i}` }],
      }));

      mockSessionRepository.findOne.mockResolvedValue(session);
      mockWordsService.getWordsForBatch.mockResolvedValue(words);
      mockWordsService.getWordsByIds.mockResolvedValue(words);

      const result = await service.getNextBatch('session-1', 'user-1');

      expect(result.words).toHaveLength(5);
      expect(mockWordsService.getWordsForBatch).toHaveBeenCalledWith(
        'book-1',
        1,
        25, // offset
        5, // remaining words
      );
    });

    it('should return empty array when all words completed', async () => {
      const session = {
        id: 'session-1',
        userId: 'user-1',
        bookId: 'book-1',
        unitNumber: 1,
        moduleType: 1,
        wordsCompleted: 30,
        wordsTotal: 30,
        status: SessionStatus.ACTIVE,
        isReinforcement: false,
      };

      mockSessionRepository.findOne.mockResolvedValue(session);

      const result = await service.getNextBatch('session-1', 'user-1');

      expect(result.words).toHaveLength(0);
      expect(result.progress.completed).toBe(30);
      expect(result.progress.total).toBe(30);
    });
  });

  describe('Batch Progress Tracking', () => {
    it('should track batch number correctly', async () => {
      const testCases = [
        { wordsCompleted: 0, expectedBatch: 1 },
        { wordsCompleted: 5, expectedBatch: 1 },
        { wordsCompleted: 10, expectedBatch: 2 },
        { wordsCompleted: 15, expectedBatch: 2 },
        { wordsCompleted: 20, expectedBatch: 3 },
        { wordsCompleted: 25, expectedBatch: 3 },
      ];

      for (const tc of testCases) {
        const session = {
          id: 'session-1',
          userId: 'user-1',
          bookId: 'book-1',
          unitNumber: 1,
          moduleType: 1,
          wordsCompleted: tc.wordsCompleted,
          wordsTotal: 30,
          status: SessionStatus.ACTIVE,
          isReinforcement: false,
        };

        const words = Array(10).fill(null).map((_, i) => ({
          id: `word-${i}`,
          word: `testword${i}`,
          definitions: [],
        }));

        mockSessionRepository.findOne.mockResolvedValue(session);
        mockWordsService.getWordsForBatch.mockResolvedValue(words);
        mockWordsService.getWordsByIds.mockResolvedValue(words);

        const result = await service.getNextBatch('session-1', 'user-1');

        expect(result.progress.batchNumber).toBe(tc.expectedBatch);
      }
    });

    it('should return correct progress counts', async () => {
      const session = {
        id: 'session-1',
        userId: 'user-1',
        bookId: 'book-1',
        unitNumber: 1,
        moduleType: 1,
        wordsCompleted: 15,
        wordsTotal: 50,
        status: SessionStatus.ACTIVE,
        isReinforcement: false,
      };

      const words = Array(10).fill(null).map((_, i) => ({
        id: `word-${i}`,
        word: `testword${i}`,
        definitions: [],
      }));

      mockSessionRepository.findOne.mockResolvedValue(session);
      mockWordsService.getWordsForBatch.mockResolvedValue(words);
      mockWordsService.getWordsByIds.mockResolvedValue(words);

      const result = await service.getNextBatch('session-1', 'user-1');

      expect(result.progress).toEqual({
        completed: 15,
        total: 50,
        batchNumber: 2,
      });
    });
  });

  describe('Batch Offset Calculation', () => {
    it('should use correct offset for each batch', async () => {
      const batches = [
        { wordsCompleted: 0, expectedOffset: 0 },
        { wordsCompleted: 10, expectedOffset: 10 },
        { wordsCompleted: 20, expectedOffset: 20 },
      ];

      for (const batch of batches) {
        const session = {
          id: 'session-1',
          userId: 'user-1',
          bookId: 'book-1',
          unitNumber: 1,
          moduleType: 1,
          wordsCompleted: batch.wordsCompleted,
          wordsTotal: 50,
          status: SessionStatus.ACTIVE,
          isReinforcement: false,
        };

        mockSessionRepository.findOne.mockResolvedValue(session);
        mockWordsService.getWordsForBatch.mockResolvedValue([]);
        mockWordsService.getWordsByIds.mockResolvedValue([]);

        await service.getNextBatch('session-1', 'user-1');

        expect(mockWordsService.getWordsForBatch).toHaveBeenCalledWith(
          'book-1',
          1,
          batch.expectedOffset,
          expect.any(Number),
        );
      }
    });
  });

  describe('Word Order Preservation', () => {
    it('should maintain word order from database', async () => {
      const session = {
        id: 'session-1',
        userId: 'user-1',
        bookId: 'book-1',
        unitNumber: 1,
        moduleType: 1,
        wordsCompleted: 0,
        wordsTotal: 10,
        status: SessionStatus.ACTIVE,
        isReinforcement: false,
      };

      const orderedWords = ['apple', 'banana', 'cherry', 'date', 'elderberry']
        .map((word, i) => ({
          id: `word-${i}`,
          word,
          definitions: [{ pos: 'n.', meaning: `${word} meaning` }],
        }));

      mockSessionRepository.findOne.mockResolvedValue(session);
      mockWordsService.getWordsForBatch.mockResolvedValue(orderedWords);
      mockWordsService.getWordsByIds.mockResolvedValue(orderedWords);

      const result = await service.getNextBatch('session-1', 'user-1');

      expect(result.words.map(w => w.word)).toEqual([
        'apple', 'banana', 'cherry', 'date', 'elderberry',
      ]);
    });
  });
});
