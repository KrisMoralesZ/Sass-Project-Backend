import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-code.enum';

export interface ErrorDefinition {
  status: HttpStatus;
  message: string;
}

export const ERROR_DEFINITIONS: Record<ErrorCode, ErrorDefinition> = {
  [ErrorCode.INTERNAL_SERVER_ERROR]: {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'Internal server error',
  },
  [ErrorCode.BAD_REQUEST]: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Bad request',
  },
  [ErrorCode.VALIDATION_FAILED]: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Validation failed',
  },
  [ErrorCode.UNAUTHORIZED]: {
    status: HttpStatus.UNAUTHORIZED,
    message: 'Unauthorized',
  },
  [ErrorCode.FORBIDDEN]: {
    status: HttpStatus.FORBIDDEN,
    message: 'Forbidden',
  },
  [ErrorCode.RESOURCE_NOT_FOUND]: {
    status: HttpStatus.NOT_FOUND,
    message: 'Resource not found',
  },
  [ErrorCode.CONFLICT]: {
    status: HttpStatus.CONFLICT,
    message: 'Conflict',
  },
  [ErrorCode.TENANT_ORGANIZATION_REQUIRED]: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Organization context is required',
  },
  [ErrorCode.TENANT_ORGANIZATION_FORBIDDEN]: {
    status: HttpStatus.FORBIDDEN,
    message: 'You do not have access to this organization',
  },
  [ErrorCode.INVALID_SORT_FIELD]: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Invalid sort field',
  },
};

export const DEFAULT_ERROR_CODE_BY_STATUS: Partial<
  Record<HttpStatus, ErrorCode>
> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.RESOURCE_NOT_FOUND,
  [HttpStatus.CONFLICT]: ErrorCode.CONFLICT,
  [HttpStatus.INTERNAL_SERVER_ERROR]: ErrorCode.INTERNAL_SERVER_ERROR,
};
