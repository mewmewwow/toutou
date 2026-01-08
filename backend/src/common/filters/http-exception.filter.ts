import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { AppException } from '../exceptions/app.exception';
import { ErrorCodes } from '../constants/error-codes';

interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status: number;
    let errorResponse: ErrorResponse;

    if (exception instanceof AppException) {
      // Custom application exception
      status = exception.getStatus();
      errorResponse = {
        code: exception.code,
        message: exception.message,
        details: exception.details,
      };
    } else if (exception instanceof HttpException) {
      // NestJS HttpException
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        errorResponse = {
          code: (resp.code as string) || this.getDefaultCode(status),
          message: (resp.message as string) || exception.message,
          details: resp.details as Record<string, unknown>,
        };
      } else {
        errorResponse = {
          code: this.getDefaultCode(status),
          message: String(exceptionResponse),
        };
      }
    } else {
      // Unknown exception
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = {
        code: ErrorCodes.SYS_INTERNAL_ERROR,
        message: '系统错误，请稍后再试',
        details: { requestId: request.id || 'unknown' },
      };

      // Log internal errors
      this.logger.error(
        `Internal server error: ${exception instanceof Error ? exception.message : 'Unknown error'}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    // Log non-500 errors at warn level
    if (status < 500) {
      this.logger.warn(`${request.method} ${request.url} - ${status} - ${errorResponse.code}`);
    }

    response.status(status).json(errorResponse);
  }

  private getDefaultCode(status: number): string {
    switch (status) {
      case 400:
        return ErrorCodes.VAL_REQUIRED_FIELD;
      case 401:
        return ErrorCodes.AUTH_TOKEN_INVALID;
      case 403:
        return ErrorCodes.BOOK_ACCESS_DENIED;
      case 404:
        return ErrorCodes.USER_NOT_FOUND;
      case 409:
        return ErrorCodes.USER_EMAIL_EXISTS;
      case 429:
        return ErrorCodes.RATE_LIMIT_EXCEEDED;
      default:
        return ErrorCodes.SYS_INTERNAL_ERROR;
    }
  }
}
