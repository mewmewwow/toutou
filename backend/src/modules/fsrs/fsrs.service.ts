import { Injectable } from '@nestjs/common';
import {
  FSRS,
  Card as FsrsCard,
  Rating,
  State,
  createEmptyCard,
  fsrs,
  generatorParameters,
} from 'ts-fsrs';

export enum FsrsRating {
  Again = 1,
  Hard = 2,
  Good = 3,
  Easy = 4,
}

export interface CardState {
  stability: number;
  difficulty: number;
  dueAt: Date;
  state: State;
  reps: number;
  lapses: number;
}

export interface ReviewResult {
  newStability: number;
  newDifficulty: number;
  nextDue: Date;
  intervalDays: number;
  state: State;
}

@Injectable()
export class FsrsService {
  private readonly fsrs: FSRS;
  private readonly targetRetention = 0.9; // 90% target retention per spec

  constructor() {
    // Initialize FSRS with custom parameters for 90% target retention
    const params = generatorParameters({
      request_retention: this.targetRetention,
      maximum_interval: 365, // Max 1 year interval
      enable_fuzz: true, // Add some randomness to prevent clustering
    });

    this.fsrs = fsrs(params);
  }

  getTargetRetention(): number {
    return this.targetRetention;
  }

  createNewCard(): CardState {
    const card = createEmptyCard();
    const now = new Date();

    return {
      stability: card.stability,
      difficulty: card.difficulty,
      dueAt: now,
      state: card.state,
      reps: card.reps,
      lapses: card.lapses,
    };
  }

  reviewCard(cardState: CardState, rating: FsrsRating): ReviewResult {
    const now = new Date();

    // Convert our card state to ts-fsrs Card format
    const card: FsrsCard = {
      due: cardState.dueAt,
      stability: cardState.stability,
      difficulty: cardState.difficulty,
      elapsed_days: this.calculateElapsedDays(cardState.dueAt, now),
      scheduled_days: 0,
      reps: cardState.reps,
      lapses: cardState.lapses,
      state: cardState.state,
      last_review: cardState.dueAt,
    };

    // Convert our rating to ts-fsrs Rating
    const fsrsRating = this.convertRating(rating);

    // Get scheduling info
    const scheduling = this.fsrs.repeat(card, now);
    const result = scheduling[fsrsRating];

    return {
      newStability: result.card.stability,
      newDifficulty: result.card.difficulty,
      nextDue: result.card.due,
      intervalDays: result.card.scheduled_days,
      state: result.card.state,
    };
  }

  /**
   * Calculate the interval in days for a given stability and target retention
   * Using the FSRS formula: I = S * (-1/R + 1)^(1/decay)
   */
  calculateInterval(stability: number): number {
    // Simplified calculation - the ts-fsrs library handles this internally
    // but we expose it for preview purposes
    const decay = -0.5;
    const factor = Math.pow(this.targetRetention, 1 / decay) - 1;
    return stability * factor;
  }

  /**
   * Calculate retrievability (probability of recall) for a card
   * Using FSRS formula: R = (1 + t/S * decay)^decay
   */
  calculateRetrievability(stability: number, daysSinceReview: number): number {
    if (stability <= 0 || daysSinceReview < 0) return 0;

    const decay = -0.5;
    const factor = 19 / 81; // FSRS-4.5 factor

    const retrievability = Math.pow(1 + (factor * daysSinceReview) / stability, decay);
    return Math.max(0, Math.min(1, retrievability));
  }

  private calculateElapsedDays(lastReview: Date, now: Date): number {
    const diff = now.getTime() - lastReview.getTime();
    return Math.max(0, diff / (1000 * 60 * 60 * 24));
  }

  private convertRating(rating: FsrsRating): Rating {
    switch (rating) {
      case FsrsRating.Again:
        return Rating.Again;
      case FsrsRating.Hard:
        return Rating.Hard;
      case FsrsRating.Good:
        return Rating.Good;
      case FsrsRating.Easy:
        return Rating.Easy;
      default:
        return Rating.Good;
    }
  }

  /**
   * Process a rating and return the new card state
   * Used by learning session service
   */
  processRating(
    cardData: {
      stability: number;
      difficulty: number;
      due: Date;
      state: number;
      elapsed_days: number;
      scheduled_days: number;
      reps: number;
      lapses: number;
      last_review?: Date;
    },
    rating: Rating,
  ): { card: FsrsCard; log: any } {
    const now = new Date();

    const card: FsrsCard = {
      due: cardData.due,
      stability: cardData.stability,
      difficulty: cardData.difficulty,
      elapsed_days: cardData.elapsed_days,
      scheduled_days: cardData.scheduled_days,
      reps: cardData.reps,
      lapses: cardData.lapses,
      state: cardData.state as State,
      last_review: cardData.last_review,
    };

    const scheduling = this.fsrs.repeat(card, now);
    return scheduling[rating];
  }
}
