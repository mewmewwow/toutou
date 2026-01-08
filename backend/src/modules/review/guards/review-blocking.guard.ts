import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CardService } from '../../fsrs/card.service';
import { ReviewBlockingService } from '../review-blocking.service';

export const SKIP_BLOCKING_CHECK = 'skipBlockingCheck';

/**
 * Guard that blocks access to learning endpoints when user has too many overdue reviews
 * Threshold: 25 overdue cards
 */
@Injectable()
export class ReviewBlockingGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cardService: CardService,
    private readonly blockingService: ReviewBlockingService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if this endpoint should skip blocking check
    const skipCheck = this.reflector.get<boolean>(
      SKIP_BLOCKING_CHECK,
      context.getHandler(),
    );

    if (skipCheck) {
      return true;
    }

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
        code: 'LEARNING_BLOCKED',
        message: blockingResult.message,
        overdueCount: blockingResult.overdueCount,
        threshold: this.blockingService.getBlockingThreshold(),
      });
    }

    // Attach blocking info to request for use in controllers
    request.reviewBlocking = {
      overdueCount,
      isBlocked: false,
    };

    return true;
  }
}
