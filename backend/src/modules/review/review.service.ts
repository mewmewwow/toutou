import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, In } from 'typeorm';
import { Card, CardStatus } from '../fsrs/entities/card.entity';
import { Revlog, ReviewType } from '../fsrs/entities/revlog.entity';
import { Word } from '../books/entities/word.entity';
import { FsrsService } from '../fsrs/fsrs.service';
import { CardService } from '../fsrs/card.service';
import { ReviewBlockingService } from './review-blocking.service';
import { Rating } from 'ts-fsrs';

export interface DueCard {
  cardId: string;
  wordId: string;
  word: string;
  phoneticUs: string;
  definitions: Array<{ pos: string; meaning: string }>;
  moduleType: number;
  dueAt: Date;
  retrievability: number;
  status: CardStatus;
}

export interface DueCardsResponse {
  cards: DueCard[];
  totalDue: number;
  isBlocked: boolean;
  blockingMessage?: string;
}

export interface ReviewSubmissionDto {
  rating: number;
  responseTimeMs: number;
}

export interface ReviewResult {
  cardId: string;
  newStatus: string;
  stability: number;
  difficulty: number;
  nextDue: Date;
  retrievability: number;
}

@Injectable()
export class ReviewService {
  private readonly moduleOrder = [1, 2, 3, 7, 8, 9, 10];

  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    @InjectRepository(Revlog)
    private readonly revlogRepository: Repository<Revlog>,
    @InjectRepository(Word)
    private readonly wordRepository: Repository<Word>,
    private readonly fsrsService: FsrsService,
    private readonly cardService: CardService,
    private readonly blockingService: ReviewBlockingService,
  ) {}

  /**
   * Get due cards for review
   */
  async getDueCards(
    userId: string,
    moduleType?: number,
    limit: number = 20,
  ): Promise<DueCardsResponse> {
    const now = new Date();

    // Build query for due cards
    const query = this.cardRepository
      .createQueryBuilder('card')
      .leftJoinAndSelect('card.word', 'word')
      .where('card.user_id = :userId', { userId })
      .andWhere('card.due_at <= :now', { now })
      .andWhere('card.status != :graduated', { graduated: CardStatus.GRADUATED })
      .orderBy('card.due_at', 'ASC');

    if (moduleType !== undefined) {
      query.andWhere('card.module_type = :moduleType', { moduleType });
    }

    // Get total count
    const totalDue = await query.getCount();

    // Get limited cards
    const cards = await query.take(limit).getMany();

    // Check blocking status
    const overdueCount = await this.cardService.countOverdueCards(userId);
    const blockingResult = this.blockingService.shouldBlockNewLearning(overdueCount);

    // Sort by module order, then by due date
    const sortedCards = this.sortByModuleOrder(cards);

    // Map to response format
    const dueCards: DueCard[] = sortedCards.map((card) => {
      const retrievability = this.calculateRetrievability(card);
      return {
        cardId: card.id,
        wordId: card.wordId,
        word: card.word?.word || '',
        phoneticUs: card.word?.phoneticUs || '',
        definitions: card.word?.definitions || [],
        moduleType: card.moduleType,
        dueAt: card.dueAt!,
        retrievability,
        status: card.status,
      };
    });

    return {
      cards: dueCards,
      totalDue,
      isBlocked: blockingResult.isBlocked,
      blockingMessage: blockingResult.message,
    };
  }

  /**
   * Submit a review for a card
   */
  async submitReview(
    cardId: string,
    userId: string,
    submission: ReviewSubmissionDto,
  ): Promise<ReviewResult> {
    // Get card
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
    });

    if (!card) {
      throw new NotFoundException({
        code: 'CARD_NOT_FOUND',
        message: '卡片不存在',
      });
    }

    // Check ownership
    if (card.userId !== userId) {
      throw new ForbiddenException({
        code: 'CARD_ACCESS_DENIED',
        message: '您没有权限访问此卡片',
      });
    }

    // Store previous values for revlog
    const previousStability = Number(card.stability);
    const previousDifficulty = Number(card.difficulty);
    const previousInterval = this.calculateIntervalDays(card);

    // Convert rating 1-4 to FSRS Rating enum
    const fsrsRating = this.convertRating(submission.rating);

    // Process with CardService
    const updateResult = await this.cardService.processRating(
      card,
      fsrsRating,
      submission.responseTimeMs,
    );

    // Create revlog entry
    await this.createRevlog({
      cardId,
      userId,
      rating: submission.rating,
      responseTimeMs: submission.responseTimeMs,
      stabilityBefore: previousStability,
      stabilityAfter: Number(updateResult.card.stability),
      difficultyBefore: previousDifficulty,
      difficultyAfter: Number(updateResult.card.difficulty),
      intervalBefore: previousInterval,
      intervalAfter: updateResult.intervalDays,
      reviewType: this.determineReviewType(card.status),
    });

    // Calculate new retrievability
    const retrievability = this.calculateRetrievability(updateResult.card);

    return {
      cardId: updateResult.card.id,
      newStatus: updateResult.card.status,
      stability: Number(updateResult.card.stability),
      difficulty: Number(updateResult.card.difficulty),
      nextDue: updateResult.card.dueAt!,
      retrievability,
    };
  }

  /**
   * Get card by ID with ownership check
   */
  async getCardForReview(cardId: string, userId: string): Promise<Card> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['word'],
    });

    if (!card) {
      throw new NotFoundException({
        code: 'CARD_NOT_FOUND',
        message: '卡片不存在',
      });
    }

    if (card.userId !== userId) {
      throw new ForbiddenException({
        code: 'CARD_ACCESS_DENIED',
        message: '您没有权限访问此卡片',
      });
    }

    return card;
  }

  /**
   * Get overdue cards count
   */
  async getOverdueCount(userId: string): Promise<number> {
    return this.cardService.countOverdueCards(userId);
  }

  /**
   * Sort cards by module order
   */
  private sortByModuleOrder(cards: Card[]): Card[] {
    return [...cards].sort((a, b) => {
      const orderA = this.moduleOrder.indexOf(a.moduleType);
      const orderB = this.moduleOrder.indexOf(b.moduleType);

      // If same module, sort by due date
      if (orderA === orderB) {
        const dateA = a.dueAt?.getTime() || 0;
        const dateB = b.dueAt?.getTime() || 0;
        return dateA - dateB;
      }

      // Unknown modules go to the end
      const effectiveOrderA = orderA === -1 ? 999 : orderA;
      const effectiveOrderB = orderB === -1 ? 999 : orderB;

      return effectiveOrderA - effectiveOrderB;
    });
  }

  /**
   * Calculate retrievability for a card
   */
  private calculateRetrievability(card: Card): number {
    const stability = Number(card.stability);
    if (stability <= 0) return 1.0;

    const now = new Date();
    const lastReview = card.lastReviewAt || card.createdAt;
    const daysSinceReview =
      (now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceReview <= 0) return 1.0;

    return this.fsrsService.calculateRetrievability(stability, daysSinceReview);
  }

  /**
   * Calculate interval in days from card state
   */
  private calculateIntervalDays(card: Card): number {
    if (!card.dueAt || !card.lastReviewAt) return 0;
    const diff = card.dueAt.getTime() - card.lastReviewAt.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Convert rating 1-4 to FSRS Rating enum
   */
  private convertRating(rating: number): Rating {
    switch (rating) {
      case 1:
        return Rating.Again;
      case 2:
        return Rating.Hard;
      case 3:
        return Rating.Good;
      case 4:
        return Rating.Easy;
      default:
        return Rating.Good;
    }
  }

  /**
   * Determine review type for revlog
   */
  private determineReviewType(status: CardStatus): ReviewType {
    switch (status) {
      case CardStatus.NEW:
      case CardStatus.LEARNING:
        return ReviewType.LEARNING;
      case CardStatus.REVIEW:
        return ReviewType.REVIEW;
      default:
        return ReviewType.REVIEW;
    }
  }

  /**
   * Create a revlog entry
   */
  private async createRevlog(data: {
    cardId: string;
    userId: string;
    rating: number;
    responseTimeMs: number;
    stabilityBefore: number;
    stabilityAfter: number;
    difficultyBefore: number;
    difficultyAfter: number;
    intervalBefore: number;
    intervalAfter: number;
    reviewType: ReviewType;
  }): Promise<Revlog> {
    const revlog = this.revlogRepository.create(data);
    return this.revlogRepository.save(revlog);
  }
}
