import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { TrackingService } from './tracking.service';
import { ReviewBlockingService } from './review-blocking.service';
import { GuestAuthGuard } from '../../common/guards/guest-auth.guard';
import { ReviewSubmissionDto, GetDueCardsDto } from './dto';

@Controller('review')
@UseGuards(GuestAuthGuard)
export class ReviewController {
  constructor(
    private readonly reviewService: ReviewService,
    private readonly trackingService: TrackingService,
    private readonly blockingService: ReviewBlockingService,
  ) {}

  /**
   * GET /review/due
   * Get cards due for review
   */
  @Get('due')
  async getDueCards(@Request() req, @Query() query: GetDueCardsDto) {
    return this.reviewService.getDueCards(
      req.user.id,
      query.moduleType,
      query.limit,
    );
  }

  /**
   * POST /review/cards/:id
   * Submit a review for a card
   */
  @Post('cards/:id')
  async submitReview(
    @Request() req,
    @Param('id', ParseUUIDPipe) cardId: string,
    @Body() submission: ReviewSubmissionDto,
  ) {
    return this.reviewService.submitReview(cardId, req.user.id, submission);
  }

  /**
   * GET /review/cards/:id
   * Get a specific card for review
   */
  @Get('cards/:id')
  async getCard(@Request() req, @Param('id', ParseUUIDPipe) cardId: string) {
    const card = await this.reviewService.getCardForReview(cardId, req.user.id);
    return {
      cardId: card.id,
      wordId: card.wordId,
      word: card.word?.word,
      phoneticUs: card.word?.phoneticUs,
      definitions: card.word?.definitions,
      moduleType: card.moduleType,
      status: card.status,
      dueAt: card.dueAt,
      stability: Number(card.stability),
      difficulty: Number(card.difficulty),
    };
  }

  /**
   * GET /review/status
   * Get review status and blocking info
   */
  @Get('status')
  async getReviewStatus(@Request() req) {
    const overdueCount = await this.reviewService.getOverdueCount(req.user.id);
    const threshold = this.blockingService.getBlockingThreshold();
    const blockingResult = this.blockingService.shouldBlockNewLearning(overdueCount);
    const timeEstimate = this.blockingService.estimateReviewTime(overdueCount);

    return {
      overdueCount,
      threshold,
      isBlocked: blockingResult.isBlocked,
      blockingMessage: blockingResult.message,
      estimatedMinutes: timeEstimate.minutes,
    };
  }

  /**
   * GET /review/stats/daily
   * Get daily statistics
   */
  @Get('stats/daily')
  async getDailyStats(@Request() req, @Query('date') dateStr?: string) {
    const date = dateStr ? new Date(dateStr) : new Date();
    return this.trackingService.getDailyStats(req.user.id, date);
  }

  /**
   * GET /review/stats/weekly
   * Get weekly statistics
   */
  @Get('stats/weekly')
  async getWeeklyStats(@Request() req, @Query('weekStart') weekStartStr?: string) {
    const weekStart = weekStartStr ? new Date(weekStartStr) : this.getStartOfWeek();
    return this.trackingService.getWeeklyStats(req.user.id, weekStart);
  }

  /**
   * GET /review/stats/calendar
   * Get calendar heatmap data
   */
  @Get('stats/calendar')
  async getCalendarData(
    @Request() req,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
  ) {
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setMonth(defaultStart.getMonth() - 3);

    const startDate = startDateStr ? new Date(startDateStr) : defaultStart;
    const endDate = endDateStr ? new Date(endDateStr) : now;

    return this.trackingService.getCalendarData(req.user.id, startDate, endDate);
  }

  /**
   * GET /review/stats/words
   * Get word-level statistics for word cloud
   */
  @Get('stats/words')
  async getWordStats(@Request() req, @Query('limit') limitStr?: string) {
    const limit = limitStr ? parseInt(limitStr, 10) : 100;
    return this.trackingService.getWordStats(req.user.id, Math.min(limit, 500));
  }

  /**
   * GET /review/streak
   * Get current review streak
   */
  @Get('streak')
  async getStreak(@Request() req) {
    const weeklyStats = await this.trackingService.getWeeklyStats(
      req.user.id,
      this.getStartOfWeek(),
    );
    const totalReviews = await this.trackingService.getTotalReviewCount(req.user.id);

    return {
      streak: weeklyStats.streak,
      totalReviews,
    };
  }

  /**
   * Helper to get start of current week (Monday)
   */
  private getStartOfWeek(): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }
}
