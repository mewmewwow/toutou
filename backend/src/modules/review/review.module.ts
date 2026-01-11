import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from '../fsrs/entities/card.entity';
import { Revlog } from '../fsrs/entities/revlog.entity';
import { Word } from '../books/entities/word.entity';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { ReviewBlockingService } from './review-blocking.service';
import { TrackingService } from './tracking.service';
import { ReviewBlockingGuard } from './guards/review-blocking.guard';
import { FsrsModule } from '../fsrs/fsrs.module';
import { DevicesModule } from '../devices/devices.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Card, Revlog, Word]),
    FsrsModule,
    DevicesModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [ReviewController],
  providers: [
    ReviewService,
    ReviewBlockingService,
    TrackingService,
    ReviewBlockingGuard,
  ],
  exports: [
    ReviewService,
    ReviewBlockingService,
    TrackingService,
    ReviewBlockingGuard,
  ],
})
export class ReviewModule {}
