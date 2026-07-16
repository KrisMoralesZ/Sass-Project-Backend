import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-code.enum';
import { ERROR_DEFINITIONS } from './error-definitions';

export interface AppExceptionResponse {
  code: ErrorCode;
  message: string | string[];
  error: string;
}

export class AppException extends HttpException {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message?: string, status?: HttpStatus) {
    const definition = ERROR_DEFINITIONS[code];
    const resolvedStatus = status ?? definition.status;
    const resolvedMessage = message ?? definition.message;

    super(
      {
        code,
        message: resolvedMessage,
        error: HttpStatus[resolvedStatus],
      } satisfies AppExceptionResponse,
      resolvedStatus,
    );

    this.code = code;
  }

  static badRequest(code: ErrorCode, message?: string): AppException {
    return new AppException(code, message, HttpStatus.BAD_REQUEST);
  }

  static unauthorized(message?: string): AppException {
    return new AppException(ErrorCode.UNAUTHORIZED, message);
  }

  static forbidden(code: ErrorCode, message?: string): AppException {
    return new AppException(code, message, HttpStatus.FORBIDDEN);
  }

  static notFound(message?: string): AppException {
    return new AppException(ErrorCode.RESOURCE_NOT_FOUND, message);
  }

  static conflict(message?: string): AppException {
    return new AppException(ErrorCode.CONFLICT, message);
  }

  static validationFailed(message?: string | string[]): AppException {
    const exception = new AppException(
      ErrorCode.VALIDATION_FAILED,
      Array.isArray(message) ? 'Validation failed' : message,
    );
    const response = exception.getResponse() as AppExceptionResponse;

    if (Array.isArray(message)) {
      response.message = message;
    }

    return exception;
  }
}
