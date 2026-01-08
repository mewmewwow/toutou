import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { LearningSessionService, NextBatchResponse, LearningResult } from './learning-session.service';
import { GuestAuthGuard } from '../../common/guards/guest-auth.guard';
import { UnitAccessGuard } from '../books/guards/unit-access.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LearningSession } from './entities/learning-session.entity';
import { CreateSessionDto, LearningSubmissionDto } from './dto';

interface RequestUser {
  id: string;
  isGuest: boolean;
}

interface SessionResponse {
  id: string;
  bookId: string;
  unitNumber: number;
  moduleType: number;
  status: string;
  wordsCompleted: number;
  wordsTotal: number;
  effectiveSeconds: number;
}

@Controller('learning')
export class LearningController {
  constructor(
    private readonly learningSessionService: LearningSessionService,
  ) {}

  /**
   * POST /learning/sessions
   * Start or resume a learning session
   */
  @Post('sessions')
  @UseGuards(GuestAuthGuard, UnitAccessGuard)
  async createSession(
    @Body() dto: CreateSessionDto,
    @CurrentUser() user: RequestUser,
  ): Promise<SessionResponse> {
    const session = await this.learningSessionService.startOrResumeSession(
      user.id,
      dto,
    );

    return this.formatSessionResponse(session);
  }

  /**
   * GET /learning/sessions/:sessionId/next
   * Get next batch of words for learning
   */
  @Get('sessions/:sessionId/next')
  @UseGuards(GuestAuthGuard)
  async getNextBatch(
    @Param('sessionId', new ParseUUIDPipe({ errorHttpStatusCode: 400 })) sessionId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<NextBatchResponse> {
    return this.learningSessionService.getNextBatch(sessionId, user.id);
  }

  /**
   * POST /learning/sessions/:sessionId/submit
   * Submit learning result for a single word
   */
  @Post('sessions/:sessionId/submit')
  @UseGuards(GuestAuthGuard)
  async submitLearning(
    @Param('sessionId', new ParseUUIDPipe({ errorHttpStatusCode: 400 })) sessionId: string,
    @Body() dto: LearningSubmissionDto,
    @CurrentUser() user: RequestUser,
  ): Promise<LearningResult> {
    return this.learningSessionService.submitLearning(sessionId, user.id, dto);
  }

  /**
   * Format session for API response
   */
  private formatSessionResponse(session: LearningSession): SessionResponse {
    return {
      id: session.id,
      bookId: session.bookId,
      unitNumber: session.unitNumber,
      moduleType: session.moduleType,
      status: session.status,
      wordsCompleted: session.wordsCompleted,
      wordsTotal: session.wordsTotal,
      effectiveSeconds: session.effectiveSeconds,
    };
  }
}
