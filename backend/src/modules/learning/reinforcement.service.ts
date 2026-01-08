import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LearningSession, ReinforcementWord } from './entities/learning-session.entity';
import { WordsService } from '../books/words.service';
import { Rating } from 'ts-fsrs';

// Number of consecutive errors before triggering vocabulary reinforcement
const REINFORCEMENT_THRESHOLD = 3;

@Injectable()
export class ReinforcementService {
  constructor(
    @InjectRepository(LearningSession)
    private readonly sessionRepository: Repository<LearningSession>,
    private readonly wordsService: WordsService,
  ) {}

  /**
   * Check if a rating is considered an error
   * Again (1) and Hard (2) are considered errors
   */
  isErrorRating(rating: number): boolean {
    return rating <= Rating.Hard;
  }

  /**
   * Track an error for a word
   * If errors reach threshold, triggers reinforcement mode
   */
  async trackError(
    session: LearningSession,
    wordId: string,
    rating: number,
  ): Promise<void> {
    if (!this.isErrorRating(rating)) {
      return;
    }

    // Initialize reinforcement words array if needed
    if (!session.reinforcementWords) {
      session.reinforcementWords = [];
    }

    // Find existing entry for this word
    const existingIndex = session.reinforcementWords.findIndex(
      (w) => w.wordId === wordId,
    );

    if (existingIndex >= 0) {
      // Increment attempts
      session.reinforcementWords[existingIndex].attempts += 1;
    } else {
      // Add new word to reinforcement list
      const word = await this.wordsService.getWordById(wordId);
      if (word) {
        session.reinforcementWords.push({
          wordId,
          word: word.word,
          definition: word.definitions[0]?.meaning || '',
          attempts: 1,
        });
      }
    }

    // Check if threshold reached for this word
    const wordEntry = session.reinforcementWords.find((w) => w.wordId === wordId);
    if (wordEntry && wordEntry.attempts >= REINFORCEMENT_THRESHOLD) {
      session.isReinforcement = true;
    }
  }

  /**
   * Handle a correct answer
   * If rating is Good or better, remove word from reinforcement list
   */
  async handleCorrectAnswer(
    session: LearningSession,
    wordId: string,
    rating: number,
  ): Promise<void> {
    // Only exit reinforcement on Good (3) or Easy (4)
    if (rating < Rating.Good) {
      return;
    }

    if (!session.reinforcementWords) {
      return;
    }

    // Remove word from reinforcement list
    session.reinforcementWords = session.reinforcementWords.filter(
      (w) => w.wordId !== wordId,
    );

    // Exit reinforcement mode if no words left
    if (session.reinforcementWords.length === 0) {
      session.isReinforcement = false;
      session.reinforcementWords = null;
    }
  }

  /**
   * Process a submission for reinforcement tracking
   */
  async processSubmission(
    session: LearningSession,
    wordId: string,
    rating: number,
  ): Promise<void> {
    if (this.isErrorRating(rating)) {
      await this.trackError(session, wordId, rating);
    } else if (session.isReinforcement) {
      await this.handleCorrectAnswer(session, wordId, rating);
    }
  }

  /**
   * Get words for reinforcement mode
   */
  getReinforcementWords(session: LearningSession): ReinforcementWord[] {
    if (!session.isReinforcement || !session.reinforcementWords) {
      return [];
    }

    return session.reinforcementWords;
  }

  /**
   * Get word IDs for reinforcement
   */
  getReinforcementWordIds(session: LearningSession): string[] {
    return this.getReinforcementWords(session).map((w) => w.wordId);
  }

  /**
   * Check if session is in reinforcement mode
   */
  isInReinforcementMode(session: LearningSession): boolean {
    return session.isReinforcement && (session.reinforcementWords?.length ?? 0) > 0;
  }

  /**
   * Force exit from reinforcement mode
   * Used when user completes all reinforcement words successfully
   */
  exitReinforcementMode(session: LearningSession): void {
    session.isReinforcement = false;
    session.reinforcementWords = null;
  }

  /**
   * Get reinforcement progress
   */
  getReinforcementProgress(session: LearningSession): {
    totalWords: number;
    wordsRemaining: number;
    averageAttempts: number;
  } {
    const words = this.getReinforcementWords(session);

    if (words.length === 0) {
      return {
        totalWords: 0,
        wordsRemaining: 0,
        averageAttempts: 0,
      };
    }

    const totalAttempts = words.reduce((sum, w) => sum + w.attempts, 0);

    return {
      totalWords: words.length,
      wordsRemaining: words.length,
      averageAttempts: totalAttempts / words.length,
    };
  }

  /**
   * Create vocabulary reinforcement display data
   * Returns data formatted for the 词义强化 UI
   */
  createReinforcementDisplayData(session: LearningSession): {
    words: Array<{
      wordId: string;
      word: string;
      definition: string;
      attempts: number;
      isHardWord: boolean;
    }>;
    message: string;
  } {
    const words = this.getReinforcementWords(session);

    return {
      words: words.map((w) => ({
        wordId: w.wordId,
        word: w.word,
        definition: w.definition,
        attempts: w.attempts,
        isHardWord: w.attempts >= REINFORCEMENT_THRESHOLD,
      })),
      message: this.getReinforcementMessage(words.length),
    };
  }

  /**
   * Get appropriate message for reinforcement mode
   */
  private getReinforcementMessage(wordCount: number): string {
    if (wordCount === 1) {
      return '这个单词需要加强记忆，让我们再练习一下！';
    } else if (wordCount <= 3) {
      return `这 ${wordCount} 个单词需要加强记忆，让我们再练习一下！`;
    } else {
      return `有 ${wordCount} 个单词需要加强记忆，不要着急，慢慢来！`;
    }
  }
}
