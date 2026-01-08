import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, In } from 'typeorm';
import { Card, CardStatus } from './entities/card.entity';
import { FsrsService } from './fsrs.service';
import { Rating } from 'ts-fsrs';

export interface CreateCardDto {
  userId: string;
  wordId: string;
  moduleType: number;
}

export interface UpdateCardResult {
  card: Card;
  previousStability: number;
  previousDifficulty: number;
  intervalDays: number;
}

@Injectable()
export class CardService {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    private readonly fsrsService: FsrsService,
  ) {}

  /**
   * Get or create a card for a user/word/module combination
   */
  async getOrCreateCard(dto: CreateCardDto): Promise<Card> {
    let card = await this.cardRepository.findOne({
      where: {
        userId: dto.userId,
        wordId: dto.wordId,
        moduleType: dto.moduleType,
      },
    });

    if (!card) {
      card = this.cardRepository.create({
        userId: dto.userId,
        wordId: dto.wordId,
        moduleType: dto.moduleType,
        status: CardStatus.NEW,
        stability: 0,
        difficulty: 0,
        reviewCount: 0,
        errorCount: 0,
      });
      await this.cardRepository.save(card);
    }

    return card;
  }

  /**
   * Process a rating and update the card
   */
  async processRating(
    card: Card,
    rating: Rating,
    responseTimeMs: number,
  ): Promise<UpdateCardResult> {
    const previousStability = Number(card.stability);
    const previousDifficulty = Number(card.difficulty);

    // Calculate elapsed days since last review
    const elapsedDays = card.lastReviewAt
      ? (Date.now() - card.lastReviewAt.getTime()) / (1000 * 60 * 60 * 24)
      : 0;

    // Process with FSRS
    const fsrsResult = this.fsrsService.processRating(
      {
        stability: previousStability,
        difficulty: previousDifficulty,
        due: card.dueAt || new Date(),
        state: this.cardStatusToFsrsState(card.status),
        elapsed_days: elapsedDays,
        scheduled_days: 0,
        reps: card.reviewCount,
        lapses: card.errorCount,
        last_review: card.lastReviewAt || undefined,
      },
      rating,
    );

    // Update card
    card.stability = fsrsResult.card.stability;
    card.difficulty = fsrsResult.card.difficulty;
    card.dueAt = fsrsResult.card.due;
    card.lastReviewAt = new Date();
    card.reviewCount += 1;

    // Track errors
    if (rating <= Rating.Hard) {
      card.errorCount += 1;
    }

    // Update status based on FSRS state
    card.status = this.fsrsStateToCardStatus(fsrsResult.card.state);

    // Check for graduation (correct on first try)
    if (this.shouldGraduate(card, rating)) {
      card.status = CardStatus.GRADUATED;
    }

    await this.cardRepository.save(card);

    return {
      card,
      previousStability,
      previousDifficulty,
      intervalDays: fsrsResult.card.scheduled_days,
    };
  }

  /**
   * Check if card should graduate
   * Word graduates if answered correctly on first attempt
   */
  private shouldGraduate(card: Card, rating: Rating): boolean {
    // First review and got it right (Good or Easy)
    if (card.reviewCount === 1 && rating >= Rating.Good) {
      return true;
    }

    // High stability indicates mastery
    if (Number(card.stability) >= 21 && rating >= Rating.Good) {
      return true;
    }

    return false;
  }

  /**
   * Get all cards due for review
   */
  async getDueCards(
    userId: string,
    moduleType?: number,
    limit: number = 20,
  ): Promise<Card[]> {
    const now = new Date();

    const query = this.cardRepository.createQueryBuilder('card')
      .where('card.user_id = :userId', { userId })
      .andWhere('card.due_at <= :now', { now })
      .andWhere('card.status != :graduated', { graduated: CardStatus.GRADUATED })
      .orderBy('card.due_at', 'ASC')
      .take(limit);

    if (moduleType !== undefined) {
      query.andWhere('card.module_type = :moduleType', { moduleType });
    }

    return query.getMany();
  }

  /**
   * Get overdue cards (due more than 24 hours ago)
   */
  async getOverdueCards(userId: string): Promise<Card[]> {
    const overdueThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return this.cardRepository.find({
      where: {
        userId,
        dueAt: LessThanOrEqual(overdueThreshold),
        status: In([CardStatus.LEARNING, CardStatus.REVIEW]),
      },
      order: { dueAt: 'ASC' },
    });
  }

  /**
   * Count overdue cards for review blocking check
   */
  async countOverdueCards(userId: string): Promise<number> {
    const overdueThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return this.cardRepository.count({
      where: {
        userId,
        dueAt: LessThanOrEqual(overdueThreshold),
        status: In([CardStatus.LEARNING, CardStatus.REVIEW]),
      },
    });
  }

  /**
   * Get card by ID
   */
  async getCardById(cardId: string): Promise<Card> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
    });

    if (!card) {
      throw new NotFoundException({
        code: 'CARD_NOT_FOUND',
        message: '卡片不存在',
      });
    }

    return card;
  }

  /**
   * Get cards for specific words
   */
  async getCardsForWords(
    userId: string,
    wordIds: string[],
    moduleType: number,
  ): Promise<Map<string, Card>> {
    if (wordIds.length === 0) {
      return new Map();
    }

    const cards = await this.cardRepository
      .createQueryBuilder('card')
      .where('card.user_id = :userId', { userId })
      .andWhere('card.word_id IN (:...wordIds)', { wordIds })
      .andWhere('card.module_type = :moduleType', { moduleType })
      .getMany();

    return new Map(cards.map((c) => [c.wordId, c]));
  }

  /**
   * Convert card status to FSRS state number
   */
  private cardStatusToFsrsState(status: CardStatus): number {
    switch (status) {
      case CardStatus.NEW:
        return 0;
      case CardStatus.LEARNING:
        return 1;
      case CardStatus.REVIEW:
        return 2;
      case CardStatus.GRADUATED:
        return 2;
      default:
        return 0;
    }
  }

  /**
   * Convert FSRS state number to card status
   */
  private fsrsStateToCardStatus(state: number): CardStatus {
    switch (state) {
      case 0:
        return CardStatus.NEW;
      case 1:
        return CardStatus.LEARNING;
      case 2:
      case 3:
        return CardStatus.REVIEW;
      default:
        return CardStatus.NEW;
    }
  }
}
