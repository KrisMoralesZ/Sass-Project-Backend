import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-code.enum';
import { DEFAULT_ERROR_CODE_BY_STATUS } from './error-definitions';

export interface ParsedExceptionResponse {
  code: ErrorCode;
  message: string | string[];
  error?: string;
}

interface ExceptionResponseBody {
  code?: ErrorCode;
  message?: string | string[];
  error?: string;
}

export function parseExceptionResponse(
  status: HttpStatus,
  exceptionResponse: string | object | null,
): ParsedExceptionResponse {
  let message: string | string[] = 'Internal server error';
  let error: string | undefined = HttpStatus[status];
  let code: ErrorCode | undefined;

  if (typeof exceptionResponse === 'string') {
    message = exceptionResponse;
  } else if (
    exceptionResponse &&
    typeof exceptionResponse === 'object' &&
    'message' in exceptionResponse
  ) {
    const responseBody = exceptionResponse as ExceptionResponseBody;
    message = responseBody.message ?? message;
    error = responseBody.error ?? error;
    code = responseBody.code;
  }

  if (!code && Array.isArray(message)) {
    code = ErrorCode.VALIDATION_FAILED;
  }

  if (!code) {
    code =
      DEFAULT_ERROR_CODE_BY_STATUS[status] ?? ErrorCode.INTERNAL_SERVER_ERROR;
  }

  return {
    code,
    message,
    error,
  };
}
