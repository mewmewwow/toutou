import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { CardService } from '../../fsrs/card.service';
import { ReviewBlockingService } from '../../review/review-blocking.service';

/**
 * Guard that prevents taking tests when user has too many overdue reviews
 * Uses same threshold as learning blocking (>25 overdue cards)
 */
@Injectable()
export class PreTestReviewGuard implements CanActivate {
  constructor(
    private readonly cardService: CardService,
    private readonly blockingService: ReviewBlockingService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user, let other guards handle authentication
    if (!user?.id) {
      return true;
    }

    // Count overdue cards
    const overdueCount = await this.cardService.countOverdueCards(user.id);
    const blockingResult = this.blockingService.shouldBlockNewLearning(overdueCount);

    if (blockingResult.isBlocked) {
      throw new ForbiddenException({
        code: 'TEST_BLOCKED_BY_REVIEWS',
        message: '请先完成复习再进行测试。' + blockingResult.message,
        overdueCount: blockingResult.overdueCount,
        threshold: this.blockingService.getBlockingThreshold(),
      });
    }

    return true;
  }
}
