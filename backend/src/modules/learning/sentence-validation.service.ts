import { Injectable } from '@nestjs/common';
import { SentenceScrambleService } from './sentence-scramble.service';

export interface SentenceValidationResult {
  isCorrect: boolean;
  score: number;
  feedback: SentenceFeedback;
}

export interface SentenceFeedback {
  type: 'perfect' | 'good' | 'partial' | 'incorrect';
  message: string;
  corrections?: Array<{
    position: number;
    expected: string;
    actual: string;
  }>;
}

export interface WordOrderValidationResult {
  isCorrect: boolean;
  score: number;
  incorrectPositions: number[];
  feedback: SentenceFeedback;
}

/**
 * Service for validating sentence-based exercise submissions
 * Handles modules 7-10
 */
@Injectable()
export class SentenceValidationService {
  constructor(
    private readonly scrambleService: SentenceScrambleService,
  ) {}

  /**
   * Validate word order submission (modules 7, 8)
   */
  validateWordOrder(
    originalSentence: string,
    userOrderedWords: string[],
  ): WordOrderValidationResult {
    const originalWords = originalSentence.split(/\s+/).filter((w) => w.length > 0);

    if (userOrderedWords.length !== originalWords.length) {
      return {
        isCorrect: false,
        score: 0,
        incorrectPositions: Array.from({ length: originalWords.length }, (_, i) => i),
        feedback: {
          type: 'incorrect',
          message: '单词数量不匹配',
        },
      };
    }

    const incorrectPositions: number[] = [];
    let correctCount = 0;

    for (let i = 0; i < originalWords.length; i++) {
      if (this.normalizeWord(originalWords[i]) === this.normalizeWord(userOrderedWords[i])) {
        correctCount++;
      } else {
        incorrectPositions.push(i);
      }
    }

    const score = Math.round((correctCount / originalWords.length) * 100);
    const isCorrect = incorrectPositions.length === 0;

    return {
      isCorrect,
      score,
      incorrectPositions,
      feedback: this.generateOrderFeedback(score, incorrectPositions, originalWords),
    };
  }

  /**
   * Validate typed sentence submission (module 9 - dictation)
   */
  validateTypedSentence(
    originalSentence: string,
    userInput: string,
  ): SentenceValidationResult {
    const result = this.scrambleService.compareSentences(originalSentence, userInput);

    const feedback = this.generateTypingFeedback(result.score, result.differences);

    return {
      isCorrect: result.score === 100,
      score: result.score,
      feedback,
    };
  }

  /**
   * Validate fill-in-blank submission (module 10)
   */
  validateFillInBlank(
    targetWord: string,
    userInput: string,
  ): SentenceValidationResult {
    const normalizedTarget = this.normalizeWord(targetWord);
    const normalizedUser = this.normalizeWord(userInput);

    const isCorrect = normalizedTarget === normalizedUser;

    if (isCorrect) {
      return {
        isCorrect: true,
        score: 100,
        feedback: {
          type: 'perfect',
          message: '完全正确！',
        },
      };
    }

    // Check for partial match (typos)
    const similarity = this.calculateStringSimilarity(normalizedTarget, normalizedUser);

    if (similarity >= 0.8) {
      return {
        isCorrect: false,
        score: Math.round(similarity * 100),
        feedback: {
          type: 'partial',
          message: '接近正确，注意拼写',
          corrections: [{
            position: 0,
            expected: targetWord,
            actual: userInput,
          }],
        },
      };
    }

    return {
      isCorrect: false,
      score: 0,
      feedback: {
        type: 'incorrect',
        message: '答案不正确',
        corrections: [{
          position: 0,
          expected: targetWord,
          actual: userInput,
        }],
      },
    };
  }

  /**
   * Calculate rating based on score and response time
   * Returns FSRS rating 1-4
   */
  calculateRating(
    score: number,
    responseTimeMs: number,
    expectedTimeMs: number,
  ): number {
    // Perfect score within expected time = Easy (4)
    if (score === 100 && responseTimeMs <= expectedTimeMs) {
      return 4;
    }

    // Good score (>= 80%) = Good (3)
    if (score >= 80) {
      return 3;
    }

    // Partial score (>= 50%) = Hard (2)
    if (score >= 50) {
      return 2;
    }

    // Low score = Again (1)
    return 1;
  }

  /**
   * Calculate expected time for sentence based on character count
   * 2 seconds per character
   */
  calculateExpectedTime(sentence: string): number {
    const charCount = sentence.replace(/\s/g, '').length;
    return charCount * 2 * 1000; // milliseconds
  }

  /**
   * Normalize word for comparison
   */
  private normalizeWord(word: string): string {
    return word
      .toLowerCase()
      .replace(/[.,!?;:'"]/g, '')
      .trim();
  }

  /**
   * Generate feedback for word order validation
   */
  private generateOrderFeedback(
    score: number,
    incorrectPositions: number[],
    originalWords: string[],
  ): SentenceFeedback {
    if (score === 100) {
      return {
        type: 'perfect',
        message: '完美！句子顺序完全正确！',
      };
    }

    if (score >= 80) {
      return {
        type: 'good',
        message: '很好！只有少量错误。',
        corrections: incorrectPositions.map((pos) => ({
          position: pos,
          expected: originalWords[pos],
          actual: '', // Will be filled by frontend
        })),
      };
    }

    if (score >= 50) {
      return {
        type: 'partial',
        message: '还需要努力，注意单词顺序。',
        corrections: incorrectPositions.map((pos) => ({
          position: pos,
          expected: originalWords[pos],
          actual: '',
        })),
      };
    }

    return {
      type: 'incorrect',
      message: '句子顺序不正确，请再试一次。',
      corrections: incorrectPositions.map((pos) => ({
        position: pos,
        expected: originalWords[pos],
        actual: '',
      })),
    };
  }

  /**
   * Generate feedback for typed sentence validation
   */
  private generateTypingFeedback(
    score: number,
    differences: Array<{ type: string; word: string; position: number }>,
  ): SentenceFeedback {
    if (score === 100) {
      return {
        type: 'perfect',
        message: '完美！句子完全正确！',
      };
    }

    if (score >= 80) {
      return {
        type: 'good',
        message: '很好！只有小错误。',
        corrections: differences.map((d) => ({
          position: d.position,
          expected: d.type === 'missing' ? d.word : '',
          actual: d.type === 'extra' || d.type === 'wrong' ? d.word : '',
        })),
      };
    }

    if (score >= 50) {
      return {
        type: 'partial',
        message: '部分正确，继续努力！',
        corrections: differences.map((d) => ({
          position: d.position,
          expected: d.type === 'missing' ? d.word : '',
          actual: d.type === 'extra' || d.type === 'wrong' ? d.word : '',
        })),
      };
    }

    return {
      type: 'incorrect',
      message: '句子不正确，请仔细听后再试。',
    };
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost,
        );
      }
    }

    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);

    return 1 - distance / maxLen;
  }
}
