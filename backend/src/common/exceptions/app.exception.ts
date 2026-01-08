import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, ErrorMessages } from '../constants/error-codes';

export class AppException extends HttpException {
  constructor(
    public readonly code: ErrorCode,
    public readonly details?: Record<string, unknown>,
    status?: HttpStatus,
  ) {
    const message = ErrorMessages[code] || code;
    super({ code, message, details }, status || HttpStatus.BAD_REQUEST);
  }
}

// Authentication Exceptions
export class InvalidCredentialsException extends AppException {
  constructor() {
    super('AUTH_INVALID_CREDENTIALS', undefined, HttpStatus.UNAUTHORIZED);
  }
}

export class TokenExpiredException extends AppException {
  constructor(expiredAt?: Date) {
    super(
      'AUTH_TOKEN_EXPIRED',
      expiredAt ? { expiredAt: expiredAt.toISOString() } : undefined,
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class TokenInvalidException extends AppException {
  constructor() {
    super('AUTH_TOKEN_INVALID', undefined, HttpStatus.UNAUTHORIZED);
  }
}

export class DeviceLimitExceededException extends AppException {
  constructor(currentDevices: number, limit = 3) {
    super('AUTH_DEVICE_LIMIT_EXCEEDED', { currentDevices, limit }, HttpStatus.FORBIDDEN);
  }
}

export class GuestNotFoundException extends AppException {
  constructor(fingerprint: string) {
    super('AUTH_GUEST_NOT_FOUND', { fingerprint }, HttpStatus.NOT_FOUND);
  }
}

// Validation Exceptions
export class ValidationException extends AppException {
  constructor(code: ErrorCode, details?: Record<string, unknown>) {
    super(code, details, HttpStatus.BAD_REQUEST);
  }
}

// User Exceptions
export class UserNotFoundException extends AppException {
  constructor() {
    super('USER_NOT_FOUND', undefined, HttpStatus.NOT_FOUND);
  }
}

export class EmailExistsException extends AppException {
  constructor() {
    super('USER_EMAIL_EXISTS', undefined, HttpStatus.CONFLICT);
  }
}

export class PhoneExistsException extends AppException {
  constructor() {
    super('USER_PHONE_EXISTS', undefined, HttpStatus.CONFLICT);
  }
}

export class TrialExpiredException extends AppException {
  constructor(expiredAt: Date, upgradeUrl: string) {
    super(
      'USER_TRIAL_EXPIRED',
      { expiredAt: expiredAt.toISOString(), upgradeUrl },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class MembershipRequiredException extends AppException {
  constructor() {
    super('USER_MEMBERSHIP_REQUIRED', { requiredType: 'paid' }, HttpStatus.FORBIDDEN);
  }
}

// Book Exceptions
export class BookNotFoundException extends AppException {
  constructor(bookId: string) {
    super('BOOK_NOT_FOUND', { bookId }, HttpStatus.NOT_FOUND);
  }
}

export class UnitNotFoundException extends AppException {
  constructor(bookId: string, unitNumber: number) {
    super('BOOK_UNIT_NOT_FOUND', { bookId, unitNumber }, HttpStatus.NOT_FOUND);
  }
}

export class UnitLockedException extends AppException {
  constructor(unitNumber: number, accessibleUnits: number[] = [1]) {
    super('BOOK_UNIT_LOCKED', { unitNumber, accessibleUnits }, HttpStatus.FORBIDDEN);
  }
}

// Learning Exceptions
export class SessionNotFoundException extends AppException {
  constructor(sessionId: string) {
    super('LEARN_SESSION_NOT_FOUND', { sessionId }, HttpStatus.NOT_FOUND);
  }
}

export class SessionExpiredException extends AppException {
  constructor(lastActiveAt: Date) {
    super('LEARN_SESSION_EXPIRED', { lastActiveAt: lastActiveAt.toISOString() }, HttpStatus.BAD_REQUEST);
  }
}

export class WordNotInSessionException extends AppException {
  constructor(wordId: string) {
    super('LEARN_WORD_NOT_IN_SESSION', { wordId }, HttpStatus.BAD_REQUEST);
  }
}

// Review Exceptions
export class ReviewBlockingException extends AppException {
  constructor(overdueCount: number, threshold = 25) {
    super('REVIEW_BLOCKING', { overdueCount, threshold }, HttpStatus.CONFLICT);
  }
}

export class CardNotFoundException extends AppException {
  constructor(cardId: string) {
    super('REVIEW_CARD_NOT_FOUND', { cardId }, HttpStatus.NOT_FOUND);
  }
}

// Test Exceptions
export class TestReviewRequiredException extends AppException {
  constructor(overdueCount: number) {
    super('TEST_REVIEW_REQUIRED', { overdueCount }, HttpStatus.CONFLICT);
  }
}

// Rate Limit Exception
export class RateLimitException extends AppException {
  constructor(retryAfter: number, limit: number, window = 'minute') {
    super('RATE_LIMIT_EXCEEDED', { retryAfter, limit, window }, HttpStatus.TOO_MANY_REQUESTS);
  }
}
