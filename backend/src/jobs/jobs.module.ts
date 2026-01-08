import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../modules/users/entities/user.entity';
import { Card } from '../modules/fsrs/entities/card.entity';
import { LearningSession } from '../modules/learning/entities/learning-session.entity';
import { TestAttempt } from '../modules/tests/entities/test-attempt.entity';
import { CoinTransaction } from '../modules/rewards/entities/coin-transaction.entity';
import { GuestCleanupJob } from './guest-cleanup.job';
import { TrialExpirationJob } from './trial-expiration.job';
import { JobsController } from './jobs.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Card,
      LearningSession,
      TestAttempt,
      CoinTransaction,
    ]),
  ],
  controllers: [JobsController],
  providers: [GuestCleanupJob, TrialExpirationJob],
  exports: [GuestCleanupJob, TrialExpirationJob],
})
export class JobsModule {}
