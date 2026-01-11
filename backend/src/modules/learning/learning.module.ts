import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningSession } from './entities/learning-session.entity';
import { LearningSessionService } from './learning-session.service';
import { LearningController } from './learning.controller';
import { ReinforcementService } from './reinforcement.service';
import { TimeLimitValidator } from './validators/time-limit.validator';
import { SentenceScrambleService } from './sentence-scramble.service';
import { SentenceValidationService } from './sentence-validation.service';
import { DevicesModule } from '../devices/devices.module';
import { BooksModule } from '../books/books.module';
import { FsrsModule } from '../fsrs/fsrs.module';
import { AuthModule } from '../auth/auth.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LearningSession, User]),
    DevicesModule,
    BooksModule,
    FsrsModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [LearningController],
  providers: [
    LearningSessionService,
    ReinforcementService,
    TimeLimitValidator,
    SentenceScrambleService,
    SentenceValidationService,
  ],
  exports: [
    LearningSessionService,
    ReinforcementService,
    TimeLimitValidator,
    SentenceScrambleService,
    SentenceValidationService,
  ],
})
export class LearningModule {}
