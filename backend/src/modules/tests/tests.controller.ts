import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { TestsService, StartTestDto, SubmitTestDto } from './tests.service';
import { GuestAuthGuard } from '../../common/guards/guest-auth.guard';
import { PreTestReviewGuard } from './guards/pre-test-review.guard';

@Controller('tests')
@UseGuards(GuestAuthGuard)
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  /**
   * POST /tests/start
   * Start a new test session
   */
  @Post('start')
  @UseGuards(PreTestReviewGuard)
  async startTest(@Request() req, @Body() dto: StartTestDto) {
    return this.testsService.startTest(req.user.id, dto);
  }

  /**
   * POST /tests/:id/submit
   * Submit test answers
   */
  @Post(':id/submit')
  async submitTest(
    @Request() req,
    @Param('id', ParseUUIDPipe) attemptId: string,
    @Body() dto: SubmitTestDto,
  ) {
    return this.testsService.submitTest(attemptId, req.user.id, dto);
  }

  /**
   * GET /tests/:id
   * Get test attempt details
   */
  @Get(':id')
  async getTest(@Request() req, @Param('id', ParseUUIDPipe) attemptId: string) {
    return this.testsService.getTestAttempt(attemptId, req.user.id);
  }

  /**
   * GET /tests/history
   * Get test history
   */
  @Get()
  async getTestHistory(
    @Request() req,
    @Query('bookId') bookId?: string,
    @Query('unitNumber', new ParseIntPipe({ optional: true })) unitNumber?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.testsService.getTestHistory(
      req.user.id,
      bookId,
      unitNumber,
      limit,
    );
  }

  /**
   * GET /tests/best/:bookId/:unitNumber/:moduleType/:mode
   * Get best score for a specific test
   */
  @Get('best/:bookId/:unitNumber/:moduleType/:mode')
  async getBestScore(
    @Request() req,
    @Param('bookId', ParseUUIDPipe) bookId: string,
    @Param('unitNumber', ParseIntPipe) unitNumber: number,
    @Param('moduleType', ParseIntPipe) moduleType: number,
    @Param('mode') mode: 'normal' | 'speed' | 'ultimate',
  ) {
    return this.testsService.getBestScore(
      req.user.id,
      bookId,
      unitNumber,
      moduleType,
      mode,
    );
  }

  /**
   * GET /tests/unit-summary/:bookId/:unitNumber
   * Get unit test summary with stars
   */
  @Get('unit-summary/:bookId/:unitNumber')
  async getUnitSummary(
    @Request() req,
    @Param('bookId', ParseUUIDPipe) bookId: string,
    @Param('unitNumber', ParseIntPipe) unitNumber: number,
  ) {
    return this.testsService.getUnitTestSummary(
      req.user.id,
      bookId,
      unitNumber,
    );
  }
}
