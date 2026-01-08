import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { BooksService } from '../books.service';
import { MemberType } from '../../users/entities/user.entity';

/**
 * Guard that checks if user has access to the requested unit
 * - Guests can only access Unit 1
 * - Free members can access all units of free books
 * - Trial/Paid members can access all units
 */
@Injectable()
export class UnitAccessGuard implements CanActivate {
  constructor(private readonly booksService: BooksService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Get unit number from params or body
    const unitNumber = parseInt(
      request.params.unitNumber || request.body?.unitNumber,
      10,
    );

    if (isNaN(unitNumber)) {
      return true; // Let validation handle this
    }

    // Get book ID from params or body
    const bookId = request.params.bookId || request.body?.bookId;

    if (!bookId) {
      return true; // Let validation handle this
    }

    // Get book to check if it's free
    const book = await this.booksService.findById(bookId);
    if (!book) {
      return true; // Let controller handle 404
    }

    // Determine member type
    const memberType = user?.memberType || MemberType.GUEST;

    // Check access
    const hasAccess = this.booksService.isUnitAccessible(
      unitNumber,
      memberType,
      book.isFree,
    );

    if (!hasAccess) {
      const isGuest = memberType === MemberType.GUEST;
      throw new ForbiddenException({
        code: 'UNIT_ACCESS_DENIED',
        message: isGuest
          ? '访客只能学习第一单元，请注册解锁更多内容'
          : '请升级会员以解锁更多内容',
        details: {
          unitNumber,
          memberType,
          requiredMembership: book.isFree ? 'free' : 'paid',
        },
      });
    }

    return true;
  }
}
