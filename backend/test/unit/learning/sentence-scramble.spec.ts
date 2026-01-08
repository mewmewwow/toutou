import { SentenceScrambleService } from '../../../src/modules/learning/sentence-scramble.service';

describe('SentenceScrambleService', () => {
  let service: SentenceScrambleService;

  beforeEach(() => {
    service = new SentenceScrambleService();
  });

  describe('scrambleSentence', () => {
    it('should split sentence into words', () => {
      const sentence = 'The quick brown fox jumps';
      const result = service.scrambleSentence(sentence);

      expect(result.words).toHaveLength(5);
      expect(result.originalOrder).toEqual([0, 1, 2, 3, 4]);
    });

    it('should shuffle words randomly', () => {
      const sentence = 'The quick brown fox jumps over the lazy dog';

      // Run multiple times to verify shuffling occurs
      const results = new Set<string>();
      for (let i = 0; i < 10; i++) {
        const result = service.scrambleSentence(sentence);
        results.add(result.words.join(' '));
      }

      // Should have different orderings (statistically very likely with 9 words)
      expect(results.size).toBeGreaterThan(1);
    });

    it('should preserve word content', () => {
      const sentence = 'Hello world example';
      const result = service.scrambleSentence(sentence);

      const sortedOriginal = sentence.split(' ').sort();
      const sortedScrambled = [...result.words].sort();

      expect(sortedScrambled).toEqual(sortedOriginal);
    });

    it('should handle punctuation correctly', () => {
      const sentence = 'Hello, how are you?';
      const result = service.scrambleSentence(sentence);

      // Punctuation should stay attached to words
      expect(result.words.some(w => w.includes(','))).toBe(true);
      expect(result.words.some(w => w.includes('?'))).toBe(true);
    });

    it('should handle contractions as single words', () => {
      const sentence = "I don't know what's happening";
      const result = service.scrambleSentence(sentence);

      expect(result.words).toContain("don't");
      expect(result.words).toContain("what's");
    });

    it('should return scrambled indices', () => {
      const sentence = 'One two three';
      const result = service.scrambleSentence(sentence);

      // scrambledIndices should be a permutation of original indices
      const sorted = [...result.scrambledIndices].sort((a, b) => a - b);
      expect(sorted).toEqual([0, 1, 2]);
    });

    it('should handle single word sentence', () => {
      const sentence = 'Hello';
      const result = service.scrambleSentence(sentence);

      expect(result.words).toEqual(['Hello']);
      expect(result.originalOrder).toEqual([0]);
    });

    it('should handle empty sentence', () => {
      const sentence = '';
      const result = service.scrambleSentence(sentence);

      expect(result.words).toEqual([]);
      expect(result.originalOrder).toEqual([]);
    });
  });

  describe('validateOrder', () => {
    it('should return true for correct order', () => {
      const originalOrder = [0, 1, 2, 3, 4];
      const userOrder = [0, 1, 2, 3, 4];

      const result = service.validateOrder(originalOrder, userOrder);
      expect(result.isCorrect).toBe(true);
      expect(result.incorrectIndices).toEqual([]);
    });

    it('should return false for incorrect order', () => {
      const originalOrder = [0, 1, 2, 3, 4];
      const userOrder = [0, 2, 1, 3, 4];

      const result = service.validateOrder(originalOrder, userOrder);
      expect(result.isCorrect).toBe(false);
      expect(result.incorrectIndices).toContain(1);
      expect(result.incorrectIndices).toContain(2);
    });

    it('should identify all incorrect positions', () => {
      const originalOrder = [0, 1, 2, 3];
      const userOrder = [3, 2, 1, 0];

      const result = service.validateOrder(originalOrder, userOrder);
      expect(result.isCorrect).toBe(false);
      expect(result.incorrectIndices).toHaveLength(4);
    });

    it('should handle partial correctness', () => {
      const originalOrder = [0, 1, 2, 3, 4];
      const userOrder = [0, 1, 3, 2, 4];

      const result = service.validateOrder(originalOrder, userOrder);
      expect(result.isCorrect).toBe(false);
      expect(result.correctCount).toBe(3);
    });
  });

  describe('calculateScore', () => {
    it('should return 100 for perfect answer', () => {
      const score = service.calculateScore(5, 5);
      expect(score).toBe(100);
    });

    it('should return 0 for all incorrect', () => {
      const score = service.calculateScore(0, 5);
      expect(score).toBe(0);
    });

    it('should calculate percentage correctly', () => {
      const score = service.calculateScore(3, 5);
      expect(score).toBe(60);
    });
  });

  describe('getHint', () => {
    it('should reveal first word as hint', () => {
      const words = ['The', 'quick', 'brown', 'fox'];
      const originalOrder = [0, 1, 2, 3];

      const hint = service.getHint(words, originalOrder, 1);
      expect(hint.revealedPositions).toEqual([0]);
      expect(hint.revealedWords).toEqual(['The']);
    });

    it('should reveal multiple words for higher hint level', () => {
      const words = ['The', 'quick', 'brown', 'fox'];
      const originalOrder = [0, 1, 2, 3];

      const hint = service.getHint(words, originalOrder, 2);
      expect(hint.revealedPositions).toHaveLength(2);
    });

    it('should not exceed word count', () => {
      const words = ['Hello', 'world'];
      const originalOrder = [0, 1];

      const hint = service.getHint(words, originalOrder, 5);
      expect(hint.revealedPositions).toHaveLength(2);
    });
  });
});
