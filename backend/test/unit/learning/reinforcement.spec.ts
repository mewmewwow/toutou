import { Test, TestingModule } from '@nestjs/testing';
import { ReinforcementService } from '../../../src/modules/learning/reinforcement.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LearningSession } from '../../../src/modules/learning/entities/learning-session.entity';
import { WordsService } from '../../../src/modules/books/words.service';

describe('ReinforcementService - Vocabulary Reinforcement', () => {
  let service: ReinforcementService;

  const mockSessionRepository = {
    save: jest.fn(),
  };

  const mockWordsService = {
    getWordById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReinforcementService,
        {
          provide: getRepositoryToken(LearningSession),
          useValue: mockSessionRepository,
        },
        {
          provide: WordsService,
          useValue: mockWordsService,
        },
      ],
    }).compile();

    service = module.get<ReinforcementService>(ReinforcementService);

    jest.clearAllMocks();
  });

  describe('Reinforcement Trigger Logic', () => {
    const REINFORCEMENT_THRESHOLD = 3;

    it('should not trigger reinforcement on first error', async () => {
      const session = createMockSession();

      mockWordsService.getWordById.mockResolvedValue({
        id: 'word-1',
        word: 'abandon',
        definitions: [{ pos: 'v.', meaning: '放弃' }],
      });

      await service.trackError(session, 'word-1', 1); // Rating 1 = Again

      expect(session.isReinforcement).toBe(false);
      expect(session.reinforcementWords).toHaveLength(1);
      expect(session.reinforcementWords[0].attempts).toBe(1);
    });

    it('should not trigger reinforcement on second error', async () => {
      const session = createMockSession();
      session.reinforcementWords = [{
        wordId: 'word-1',
        word: 'abandon',
        definition: '放弃',
        attempts: 1,
      }];

      await service.trackError(session, 'word-1', 1);

      expect(session.isReinforcement).toBe(false);
      expect(session.reinforcementWords[0].attempts).toBe(2);
    });

    it('should trigger reinforcement on third consecutive error', async () => {
      const session = createMockSession();
      session.reinforcementWords = [{
        wordId: 'word-1',
        word: 'abandon',
        definition: '放弃',
        attempts: 2,
      }];

      await service.trackError(session, 'word-1', 1);

      expect(session.isReinforcement).toBe(true);
      expect(session.reinforcementWords[0].attempts).toBe(REINFORCEMENT_THRESHOLD);
    });

    it('should track multiple words independently', async () => {
      const session = createMockSession();

      mockWordsService.getWordById.mockImplementation((wordId) => ({
        id: wordId,
        word: wordId === 'word-1' ? 'abandon' : 'ability',
        definitions: [{ pos: 'n.', meaning: wordId === 'word-1' ? '放弃' : '能力' }],
      }));

      // Error on word-1
      await service.trackError(session, 'word-1', 1);
      await service.trackError(session, 'word-1', 1);

      // Error on word-2
      await service.trackError(session, 'word-2', 1);

      expect(session.reinforcementWords).toHaveLength(2);
      expect(session.reinforcementWords.find(w => w.wordId === 'word-1')?.attempts).toBe(2);
      expect(session.reinforcementWords.find(w => w.wordId === 'word-2')?.attempts).toBe(1);
      expect(session.isReinforcement).toBe(false);

      // Third error on word-1 triggers reinforcement
      await service.trackError(session, 'word-1', 1);
      expect(session.isReinforcement).toBe(true);
    });
  });

  describe('Reinforcement Exit Logic', () => {
    it('should exit reinforcement when word answered correctly', async () => {
      const session = createMockSession();
      session.isReinforcement = true;
      session.reinforcementWords = [{
        wordId: 'word-1',
        word: 'abandon',
        definition: '放弃',
        attempts: 3,
      }];

      await service.handleCorrectAnswer(session, 'word-1', 3); // Rating 3 = Good

      expect(session.reinforcementWords).toHaveLength(0);
      expect(session.isReinforcement).toBe(false);
    });

    it('should stay in reinforcement if other words remain', async () => {
      const session = createMockSession();
      session.isReinforcement = true;
      session.reinforcementWords = [
        { wordId: 'word-1', word: 'abandon', definition: '放弃', attempts: 3 },
        { wordId: 'word-2', word: 'ability', definition: '能力', attempts: 3 },
      ];

      await service.handleCorrectAnswer(session, 'word-1', 3);

      expect(session.reinforcementWords).toHaveLength(1);
      expect(session.reinforcementWords[0].wordId).toBe('word-2');
      expect(session.isReinforcement).toBe(true);
    });

    it('should not exit reinforcement on Hard rating', async () => {
      const session = createMockSession();
      session.isReinforcement = true;
      session.reinforcementWords = [{
        wordId: 'word-1',
        word: 'abandon',
        definition: '放弃',
        attempts: 3,
      }];

      await service.handleCorrectAnswer(session, 'word-1', 2); // Rating 2 = Hard

      expect(session.reinforcementWords).toHaveLength(1);
      expect(session.isReinforcement).toBe(true);
    });
  });

  describe('Reinforcement Word Data', () => {
    it('should store word data in reinforcement list', async () => {
      const session = createMockSession();

      mockWordsService.getWordById.mockResolvedValue({
        id: 'word-1',
        word: 'abandon',
        definitions: [
          { pos: 'v.', meaning: '放弃；抛弃' },
          { pos: 'n.', meaning: '放任' },
        ],
      });

      await service.trackError(session, 'word-1', 1);

      expect(session.reinforcementWords[0]).toMatchObject({
        wordId: 'word-1',
        word: 'abandon',
        definition: '放弃；抛弃', // First definition meaning
        attempts: 1,
      });
    });

    it('should handle word without definitions gracefully', async () => {
      const session = createMockSession();

      mockWordsService.getWordById.mockResolvedValue({
        id: 'word-1',
        word: 'abandon',
        definitions: [],
      });

      await service.trackError(session, 'word-1', 1);

      expect(session.reinforcementWords[0]).toMatchObject({
        wordId: 'word-1',
        word: 'abandon',
        definition: '',
        attempts: 1,
      });
    });
  });

  describe('Reinforcement Mode Behavior', () => {
    it('should return reinforcement words when in reinforcement mode', () => {
      const session = createMockSession();
      session.isReinforcement = true;
      session.reinforcementWords = [
        { wordId: 'word-1', word: 'abandon', definition: '放弃', attempts: 3 },
        { wordId: 'word-2', word: 'ability', definition: '能力', attempts: 3 },
      ];

      const words = service.getReinforcementWords(session);

      expect(words).toHaveLength(2);
      expect(words.map(w => w.wordId)).toEqual(['word-1', 'word-2']);
    });

    it('should return empty array when not in reinforcement mode', () => {
      const session = createMockSession();
      session.isReinforcement = false;

      const words = service.getReinforcementWords(session);

      expect(words).toHaveLength(0);
    });
  });

  describe('Rating Thresholds', () => {
    it('should treat Again (1) as error', async () => {
      const session = createMockSession();

      mockWordsService.getWordById.mockResolvedValue({
        id: 'word-1',
        word: 'test',
        definitions: [{ pos: 'n.', meaning: 'test' }],
      });

      const isError = service.isErrorRating(1);
      expect(isError).toBe(true);
    });

    it('should treat Hard (2) as error', async () => {
      const isError = service.isErrorRating(2);
      expect(isError).toBe(true);
    });

    it('should not treat Good (3) as error', async () => {
      const isError = service.isErrorRating(3);
      expect(isError).toBe(false);
    });

    it('should not treat Easy (4) as error', async () => {
      const isError = service.isErrorRating(4);
      expect(isError).toBe(false);
    });
  });
});

function createMockSession(): LearningSession {
  return {
    id: 'session-1',
    userId: 'user-1',
    bookId: 'book-1',
    unitNumber: 1,
    moduleType: 1,
    wordsCompleted: 5,
    wordsTotal: 20,
    status: 'active',
    isReinforcement: false,
    reinforcementWords: [],
    effectiveSeconds: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;
}
