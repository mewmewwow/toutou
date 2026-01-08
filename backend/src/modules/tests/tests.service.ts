import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestAttempt } from './entities/test-attempt.entity';
import { QuestionGeneratorService, TestQuestion } from './question-generator.service';
import { TestScoringService, TestModeType } from './test-scoring.service';
import { StarService } from './star.service';
import { TimingService } from './timing.service';

export interface StartTestDto {
  bookId: string;
  unitNumber: number;
  mode: TestModeType;
  moduleType: number; // 1-3 for Recognition tests (word modules)
}

export interface SubmitTestDto {
  answers: Record<string, string>; // questionId -> answer
  timeTakenMs: number;
}

export interface TestSession {
  attemptId: string;
  questions: TestQuestion[];
  mode: TestModeType;
  moduleType: number;
  startedAt: Date;
  timeLimitMs: number | null;
}

export interface TestResult {
  attemptId: string;
  score: number;
  percentage: number;
  speedBonus: number;
  finalScore: number;
  passed: boolean;
  stars: number;
  maxStars: number;
  correctCount: number;
  totalQuestions: number;
  timeTakenMs: number;
  timeLimitMs: number | null;
  isNewRecord: boolean;
}

@Injectable()
export class TestsService {
  constructor(
    @InjectRepository(TestAttempt)
    private readonly attemptRepository: Repository<TestAttempt>,
    private readonly questionGenerator: QuestionGeneratorService,
    private readonly scoringService: TestScoringService,
    private readonly starService: StarService,
    private readonly timingService: TimingService,
  ) {}

  /**
   * Start a new test session
   */
  async startTest(userId: string, dto: StartTestDto): Promise<TestSession> {
    // Generate questions
    const questions = await this.questionGenerator.generateRecognitionQuestions(
      dto.bookId,
      dto.unitNumber,
    );

    // Get timing configuration
    const timing = this.timingService.getTimingConfig(dto.mode);

    // Create test attempt record
    const attempt = this.attemptRepository.create({
      userId,
      bookId: dto.bookId,
      unitNumber: dto.unitNumber,
      moduleType: dto.moduleType,
      mode: dto.mode,
      totalQuestions: questions.length,
      startedAt: new Date(),
    });

    await this.attemptRepository.save(attempt);

    return {
      attemptId: attempt.id,
      questions,
      mode: dto.mode,
      moduleType: dto.moduleType,
      startedAt: attempt.startedAt,
      timeLimitMs: timing.timeLimitMs,
    };
  }

  /**
   * Submit test answers and calculate results
   */
  async submitTest(
    attemptId: string,
    userId: string,
    dto: SubmitTestDto,
  ): Promise<TestResult> {
    // Get test attempt
    const attempt = await this.attemptRepository.findOne({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException({
        code: 'TEST_NOT_FOUND',
        message: '测试不存在',
      });
    }

    // Verify ownership
    if (attempt.userId !== userId) {
      throw new ForbiddenException({
        code: 'TEST_ACCESS_DENIED',
        message: '您没有权限访问此测试',
      });
    }

    // Check if already submitted
    if (attempt.submittedAt) {
      throw new ForbiddenException({
        code: 'TEST_ALREADY_SUBMITTED',
        message: '测试已提交',
      });
    }

    // Validate timing
    const timeLimitMs = this.timingService.getTimeLimit(attempt.mode);
    if (timeLimitMs && !this.timingService.isWithinTimeLimit(dto.timeTakenMs, attempt.mode)) {
      throw new ForbiddenException({
        code: 'TIME_LIMIT_EXCEEDED',
        message: '超出时间限制',
      });
    }

    // Regenerate questions (same seed based on attempt ID for consistency)
    const questions = await this.questionGenerator.generateRecognitionQuestions(
      attempt.bookId,
      attempt.unitNumber,
    );

    // Calculate correct answers
    let correctCount = 0;
    for (const question of questions) {
      const userAnswer = dto.answers[question.questionId];
      if (this.questionGenerator.validateAnswer(question, userAnswer)) {
        correctCount++;
      }
    }

    // Calculate scores
    const scoreResult = this.scoringService.calculateFinalScore({
      correctCount,
      totalQuestions: questions.length,
      timeTakenMs: dto.timeTakenMs,
      timeLimitMs: timeLimitMs || 0,
      mode: attempt.mode,
    });

    // Calculate stars
    const stars = this.starService.calculateStars({
      percentage: scoreResult.percentage,
      mode: attempt.mode,
      passed: scoreResult.passed,
    });

    // Check for previous best
    const previousBest = await this.getPreviousBest(
      userId,
      attempt.bookId,
      attempt.unitNumber,
      attempt.moduleType,
      attempt.mode,
    );

    const isNewRecord = this.starService.isNewRecord(stars, previousBest?.stars || null);

    // Update attempt record
    attempt.correctCount = correctCount;
    attempt.score = scoreResult.finalScore;
    attempt.percentage = scoreResult.percentage;
    attempt.speedBonus = scoreResult.speedBonus;
    attempt.passed = scoreResult.passed;
    attempt.stars = stars;
    attempt.timeTakenMs = dto.timeTakenMs;
    attempt.submittedAt = new Date();

    await this.attemptRepository.save(attempt);

    return {
      attemptId: attempt.id,
      score: scoreResult.baseScore,
      percentage: scoreResult.percentage,
      speedBonus: scoreResult.speedBonus,
      finalScore: scoreResult.finalScore,
      passed: scoreResult.passed,
      stars,
      maxStars: this.starService.getMaxStars(attempt.mode),
      correctCount,
      totalQuestions: questions.length,
      timeTakenMs: dto.timeTakenMs,
      timeLimitMs,
      isNewRecord,
    };
  }

  /**
   * Get test attempt by ID
   */
  async getTestAttempt(attemptId: string, userId: string): Promise<TestAttempt> {
    const attempt = await this.attemptRepository.findOne({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException({
        code: 'TEST_NOT_FOUND',
        message: '测试不存在',
      });
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException({
        code: 'TEST_ACCESS_DENIED',
        message: '您没有权限访问此测试',
      });
    }

    return attempt;
  }

  /**
   * Get test history for a user
   */
  async getTestHistory(
    userId: string,
    bookId?: string,
    unitNumber?: number,
    limit: number = 20,
  ): Promise<TestAttempt[]> {
    const query = this.attemptRepository
      .createQueryBuilder('attempt')
      .where('attempt.user_id = :userId', { userId })
      .andWhere('attempt.submitted_at IS NOT NULL')
      .orderBy('attempt.submitted_at', 'DESC')
      .take(limit);

    if (bookId) {
      query.andWhere('attempt.book_id = :bookId', { bookId });
    }

    if (unitNumber !== undefined) {
      query.andWhere('attempt.unit_number = :unitNumber', { unitNumber });
    }

    return query.getMany();
  }

  /**
   * Get best score for a specific test
   */
  async getBestScore(
    userId: string,
    bookId: string,
    unitNumber: number,
    moduleType: number,
    mode: TestModeType,
  ): Promise<TestAttempt | null> {
    return this.attemptRepository
      .createQueryBuilder('attempt')
      .where('attempt.user_id = :userId', { userId })
      .andWhere('attempt.book_id = :bookId', { bookId })
      .andWhere('attempt.unit_number = :unitNumber', { unitNumber })
      .andWhere('attempt.module_type = :moduleType', { moduleType })
      .andWhere('attempt.mode = :mode', { mode })
      .andWhere('attempt.submitted_at IS NOT NULL')
      .orderBy('attempt.stars', 'DESC')
      .addOrderBy('attempt.score', 'DESC')
      .getOne();
  }

  /**
   * Get previous best for comparison
   */
  private async getPreviousBest(
    userId: string,
    bookId: string,
    unitNumber: number,
    moduleType: number,
    mode: TestModeType,
  ): Promise<TestAttempt | null> {
    return this.getBestScore(userId, bookId, unitNumber, moduleType, mode);
  }

  /**
   * Get unit test summary (stars across all modules)
   */
  async getUnitTestSummary(
    userId: string,
    bookId: string,
    unitNumber: number,
  ): Promise<{
    moduleStars: Array<{ moduleType: number; stars: number; maxStars: number }>;
    totalStars: number;
    maxTotalStars: number;
  }> {
    const attempts = await this.attemptRepository
      .createQueryBuilder('attempt')
      .select('attempt.module_type', 'moduleType')
      .addSelect('MAX(attempt.stars)', 'stars')
      .where('attempt.user_id = :userId', { userId })
      .andWhere('attempt.book_id = :bookId', { bookId })
      .andWhere('attempt.unit_number = :unitNumber', { unitNumber })
      .andWhere('attempt.submitted_at IS NOT NULL')
      .groupBy('attempt.module_type')
      .getRawMany();

    const moduleStars = attempts.map((a) => ({
      moduleType: parseInt(a.moduleType),
      stars: parseInt(a.stars),
      maxStars: 3, // Normal mode max stars
    }));

    const totalStars = moduleStars.reduce((sum, m) => sum + m.stars, 0);
    const maxTotalStars = moduleStars.length * 3;

    return {
      moduleStars,
      totalStars,
      maxTotalStars,
    };
  }
}
