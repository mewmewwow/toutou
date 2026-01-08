import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestAttempt } from './entities/test-attempt.entity';
import { Word } from '../books/entities/word.entity';
import { TestsController } from './tests.controller';
import { TestsService } from './tests.service';
import { QuestionGeneratorService } from './question-generator.service';
import { TestScoringService } from './test-scoring.service';
import { StarService } from './star.service';
import { TimingService } from './timing.service';
import { PreTestReviewGuard } from './guards/pre-test-review.guard';
import { BooksModule } from '../books/books.module';
import { FsrsModule } from '../fsrs/fsrs.module';
import { ReviewModule } from '../review/review.module';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TestAttempt, Word]),
    BooksModule,
    FsrsModule,
    ReviewModule,
    DevicesModule,
  ],
  controllers: [TestsController],
  providers: [
    TestsService,
    QuestionGeneratorService,
    TestScoringService,
    StarService,
    TimingService,
    PreTestReviewGuard,
  ],
  exports: [
    TestsService,
    TestScoringService,
    StarService,
  ],
})
export class TestsModule {}
