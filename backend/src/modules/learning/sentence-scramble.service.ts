import { Injectable } from '@nestjs/common';

export interface ScrambleResult {
  words: string[];
  originalOrder: number[];
  scrambledIndices: number[];
}

export interface ValidationResult {
  isCorrect: boolean;
  incorrectIndices: number[];
  correctCount: number;
}

export interface HintResult {
  revealedPositions: number[];
  revealedWords: string[];
}

/**
 * Service for scrambling sentences and validating word order
 * Used in sentence-based learning modules (7-10)
 */
@Injectable()
export class SentenceScrambleService {
  /**
   * Scramble a sentence into individual words
   * Preserves punctuation attached to words
   */
  scrambleSentence(sentence: string): ScrambleResult {
    if (!sentence || sentence.trim() === '') {
      return {
        words: [],
        originalOrder: [],
        scrambledIndices: [],
      };
    }

    // Split by whitespace while preserving punctuation
    const words = sentence.split(/\s+/).filter((w) => w.length > 0);
    const originalOrder = words.map((_, i) => i);

    // Create shuffled indices
    const scrambledIndices = this.shuffleArray([...originalOrder]);

    // Reorder words according to scrambled indices
    const scrambledWords = scrambledIndices.map((i) => words[i]);

    return {
      words: scrambledWords,
      originalOrder,
      scrambledIndices,
    };
  }

  /**
   * Validate user's word order against original
   */
  validateOrder(originalOrder: number[], userOrder: number[]): ValidationResult {
    if (originalOrder.length !== userOrder.length) {
      return {
        isCorrect: false,
        incorrectIndices: originalOrder.map((_, i) => i),
        correctCount: 0,
      };
    }

    const incorrectIndices: number[] = [];
    let correctCount = 0;

    for (let i = 0; i < originalOrder.length; i++) {
      if (originalOrder[i] === userOrder[i]) {
        correctCount++;
      } else {
        incorrectIndices.push(i);
      }
    }

    return {
      isCorrect: incorrectIndices.length === 0,
      incorrectIndices,
      correctCount,
    };
  }

  /**
   * Calculate score as percentage
   */
  calculateScore(correctCount: number, totalCount: number): number {
    if (totalCount === 0) return 0;
    return Math.round((correctCount / totalCount) * 100);
  }

  /**
   * Get hint by revealing positions
   * @param hintLevel - number of positions to reveal (1, 2, etc.)
   */
  getHint(
    words: string[],
    originalOrder: number[],
    hintLevel: number,
  ): HintResult {
    const positionsToReveal = Math.min(hintLevel, words.length);

    // Create mapping from scrambled to original
    const originalWords = this.reconstructOriginal(words, originalOrder);

    const revealedPositions: number[] = [];
    const revealedWords: string[] = [];

    for (let i = 0; i < positionsToReveal; i++) {
      revealedPositions.push(i);
      revealedWords.push(originalWords[i]);
    }

    return {
      revealedPositions,
      revealedWords,
    };
  }

  /**
   * Reconstruct original sentence order from scrambled words
   */
  private reconstructOriginal(
    scrambledWords: string[],
    scrambledIndices: number[],
  ): string[] {
    const original = new Array(scrambledWords.length);

    for (let i = 0; i < scrambledIndices.length; i++) {
      original[scrambledIndices[i]] = scrambledWords[i];
    }

    return original;
  }

  /**
   * Fisher-Yates shuffle algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  }

  /**
   * Compare two sentences for similarity (used in dictation)
   * Returns a score 0-100
   */
  compareSentences(original: string, userInput: string): {
    score: number;
    differences: Array<{ type: 'missing' | 'extra' | 'wrong'; word: string; position: number }>;
  } {
    const normalizedOriginal = this.normalizeSentence(original);
    const normalizedUser = this.normalizeSentence(userInput);

    const originalWords = normalizedOriginal.split(/\s+/);
    const userWords = normalizedUser.split(/\s+/);

    const differences: Array<{ type: 'missing' | 'extra' | 'wrong'; word: string; position: number }> = [];

    let correctCount = 0;
    const maxLength = Math.max(originalWords.length, userWords.length);

    for (let i = 0; i < maxLength; i++) {
      const originalWord = originalWords[i];
      const userWord = userWords[i];

      if (!originalWord && userWord) {
        differences.push({ type: 'extra', word: userWord, position: i });
      } else if (originalWord && !userWord) {
        differences.push({ type: 'missing', word: originalWord, position: i });
      } else if (originalWord !== userWord) {
        differences.push({ type: 'wrong', word: userWord || '', position: i });
      } else {
        correctCount++;
      }
    }

    const score = this.calculateScore(correctCount, originalWords.length);

    return { score, differences };
  }

  /**
   * Normalize sentence for comparison
   */
  private normalizeSentence(sentence: string): string {
    return sentence
      .toLowerCase()
      .replace(/[.,!?;:'"]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')       // Normalize whitespace
      .trim();
  }

  /**
   * Create fill-in-blank version of sentence
   * Replaces target word with blank
   */
  createFillInBlank(sentence: string, targetWord: string): {
    sentenceWithBlank: string;
    blankPosition: number;
  } {
    const regex = new RegExp(`\\b${targetWord}\\b`, 'gi');
    const match = regex.exec(sentence);

    if (!match) {
      return {
        sentenceWithBlank: sentence,
        blankPosition: -1,
      };
    }

    const sentenceWithBlank = sentence.replace(regex, '______');

    return {
      sentenceWithBlank,
      blankPosition: match.index,
    };
  }
}
