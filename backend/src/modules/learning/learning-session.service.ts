import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LearningSession, SessionStatus } from './entities/learning-session.entity';
import { Card, CardStatus } from '../fsrs/entities/card.entity';
import { WordsService, WordWithSentences } from '../books/words.service';
import { CardService } from '../fsrs/card.service';
import { RevlogService } from '../fsrs/revlog.service';
import { ReinforcementService } from './reinforcement.service';
import { CreateSessionDto, LearningSubmissionDto } from './dto';
import { Rating } from 'ts-fsrs';

export interface LearningWord extends WordWithSentences {
  cardStatus: CardStatus;
}

export interface SessionProgress {
  completed: number;
  total: number;
  batchNumber: number;
}

export interface NextBatchResponse {
  words: LearningWord[];
  isReinforcement: boolean;
  progress: SessionProgress;
}

export interface LearningResult {
  cardId: string;
  newStatus: CardStatus;
  stability: number;
  difficulty: number;
  nextDue: Date;
  coinsEarned: number;
}

const BATCH_SIZE = 10;

@Injectable()
export class LearningSessionService {
  constructor(
    @InjectRepository(LearningSession)
    private readonly sessionRepository: Repository<LearningSession>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    private readonly wordsService: WordsService,
    private readonly cardService: CardService,
    private readonly revlogService: RevlogService,
    private readonly reinforcementService: ReinforcementService,
  ) {}

  /**
   * Start or resume a learning session
   * If an active session exists for the same book/unit/module, return it
   */
  async startOrResumeSession(
    userId: string,
    dto: CreateSessionDto,
  ): Promise<LearningSession> {
    // Check for existing active session
    const existingSession = await this.sessionRepository.findOne({
      where: {
        userId,
        bookId: dto.bookId,
        unitNumber: dto.unitNumber,
        moduleType: dto.moduleType,
        status: SessionStatus.ACTIVE,
      },
    });

    if (existingSession) {
      return existingSession;
    }

    // Get word count for the unit
    const wordsTotal = await this.wordsService.getUnitWordCount(
      dto.bookId,
      dto.unitNumber,
    );

    if (wordsTotal === 0) {
      throw new NotFoundException({
        code: 'UNIT_NOT_FOUND',
        message: '该单元没有单词',
      });
    }

    // Create new session
    const session = this.sessionRepository.create({
      userId,
      bookId: dto.bookId,
      unitNumber: dto.unitNumber,
      moduleType: dto.moduleType,
      wordsCompleted: 0,
      wordsTotal,
      status: SessionStatus.ACTIVE,
      effectiveSeconds: 0,
      isReinforcement: false,
    });

    return this.sessionRepository.save(session);
  }

  /**
   * Get next batch of words for learning
   */
  async getNextBatch(
    sessionId: string,
    userId: string,
  ): Promise<NextBatchResponse> {
    const session = await this.getSessionWithAccessCheck(sessionId, userId);

    // Check if in reinforcement mode
    if (session.isReinforcement && session.reinforcementWords?.length) {
      const words = await this.wordsService.getWordsByIds(
        session.reinforcementWords.map((w) => w.wordId),
      );

      return {
        words: await this.addCardStatus(words, userId, session.moduleType),
        isReinforcement: true,
        progress: {
          completed: session.wordsCompleted,
          total: session.wordsTotal,
          batchNumber: Math.floor(session.wordsCompleted / BATCH_SIZE) + 1,
        },
      };
    }

    // Get next batch of words
    const offset = session.wordsCompleted;
    const limit = Math.min(BATCH_SIZE, session.wordsTotal - offset);

    if (limit <= 0) {
      // Session complete
      return {
        words: [],
        isReinforcement: false,
        progress: {
          completed: session.wordsCompleted,
          total: session.wordsTotal,
          batchNumber: Math.floor(session.wordsCompleted / BATCH_SIZE) + 1,
        },
      };
    }

    const words = await this.wordsService.getWordsForBatch(
      session.bookId,
      session.unitNumber,
      offset,
      limit,
    );

    const wordsWithSentences = await this.wordsService.getWordsByIds(
      words.map((w) => w.id),
    );

    return {
      words: await this.addCardStatus(wordsWithSentences, userId, session.moduleType),
      isReinforcement: false,
      progress: {
        completed: session.wordsCompleted,
        total: session.wordsTotal,
        batchNumber: Math.floor(offset / BATCH_SIZE) + 1,
      },
    };
  }

  /**
   * Submit learning result for a word
   */
  async submitLearning(
    sessionId: string,
    userId: string,
    dto: LearningSubmissionDto,
  ): Promise<LearningResult> {
    const session = await this.getSessionWithAccessCheck(sessionId, userId);

    // Get or create card using CardService
    const card = await this.cardService.getOrCreateCard({
      userId,
      wordId: dto.wordId,
      moduleType: session.moduleType,
    });

    const isNewCard = card.reviewCount === 0;
    const previousStatus = card.status;
    const rating = dto.rating as Rating;

    // Process rating with CardService (which uses FSRS internally)
    const result = await this.cardService.processRating(
      card,
      rating,
      dto.responseTimeMs,
    );

    // Log the review
    await this.revlogService.logCardReview(
      result.card,
      rating,
      dto.responseTimeMs,
      result.previousStability,
      result.previousDifficulty,
      result.intervalDays,
      previousStatus,
    );

    // Update session progress (only for new words, not reinforcement reruns)
    if (isNewCard && !session.isReinforcement) {
      session.wordsCompleted += 1;
    }

    // Process reinforcement using ReinforcementService
    await this.reinforcementService.processSubmission(session, dto.wordId, rating);

    // Check if session is complete
    if (session.wordsCompleted >= session.wordsTotal && !session.isReinforcement) {
      session.status = SessionStatus.COMPLETED;
    }

    await this.sessionRepository.save(session);

    // Calculate coins (simplified - 1 coin per minute of learning)
    const coinsEarned = 0; // Coin calculation will be in rewards module

    return {
      cardId: result.card.id,
      newStatus: result.card.status,
      stability: Number(result.card.stability),
      difficulty: Number(result.card.difficulty),
      nextDue: result.card.dueAt!,
      coinsEarned,
    };
  }

  /**
   * Get session with access check
   */
  private async getSessionWithAccessCheck(
    sessionId: string,
    userId: string,
  ): Promise<LearningSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException({
        code: 'SESSION_NOT_FOUND',
        message: '学习会话不存在',
      });
    }

    if (session.userId !== userId) {
      throw new ForbiddenException({
        code: 'SESSION_ACCESS_DENIED',
        message: '无权访问此学习会话',
      });
    }

    return session;
  }

  /**
   * Add card status to words
   */
  private async addCardStatus(
    words: WordWithSentences[],
    userId: string,
    moduleType: number,
  ): Promise<LearningWord[]> {
    const wordIds = words.map((w) => w.id);

    const cards = await this.cardRepository
      .createQueryBuilder('card')
      .where('card.user_id = :userId', { userId })
      .andWhere('card.word_id IN (:...wordIds)', { wordIds })
      .andWhere('card.module_type = :moduleType', { moduleType })
      .getMany();

    const cardsByWord = new Map(cards.map((c) => [c.wordId, c]));

    return words.map((word) => ({
      ...word,
      cardStatus: cardsByWord.get(word.id)?.status || CardStatus.NEW,
    }));
  }

}
