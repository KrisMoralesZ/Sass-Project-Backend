import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception';
import { ErrorCode } from './error-code.enum';
import { parseExceptionResponse } from './parse-exception-response.util';

describe('AppException', () => {
  it('creates an exception with code, message, and status', () => {
    const exception = AppException.notFound('Project not found');

    expect(exception.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
    expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(exception.getResponse()).toEqual({
      code: ErrorCode.RESOURCE_NOT_FOUND,
      message: 'Project not found',
      error: 'NOT_FOUND',
    });
  });

  it('supports validation errors with message arrays', () => {
    const exception = AppException.validationFailed([
      'name must be a string',
      'name should not be empty',
    ]);

    expect(exception.code).toBe(ErrorCode.VALIDATION_FAILED);
    expect(exception.getResponse()).toEqual({
      code: ErrorCode.VALIDATION_FAILED,
      message: ['name must be a string', 'name should not be empty'],
      error: 'BAD_REQUEST',
    });
  });
});

describe('parseExceptionResponse', () => {
  it('preserves explicit error codes', () => {
    const exception = AppException.badRequest(
      ErrorCode.TENANT_ORGANIZATION_REQUIRED,
      'Organization context is required',
    );

    expect(
      parseExceptionResponse(exception.getStatus(), exception.getResponse()),
    ).toEqual({
      code: ErrorCode.TENANT_ORGANIZATION_REQUIRED,
      message: 'Organization context is required',
      error: 'BAD_REQUEST',
    });
  });

  it('maps validation arrays to VALIDATION_FAILED', () => {
    expect(
      parseExceptionResponse(HttpStatus.BAD_REQUEST, {
        message: ['field is required'],
        error: 'Bad Request',
      }),
    ).toEqual({
      code: ErrorCode.VALIDATION_FAILED,
      message: ['field is required'],
      error: 'Bad Request',
    });
  });

  it('falls back to status-based codes', () => {
    expect(
      parseExceptionResponse(HttpStatus.NOT_FOUND, {
        message: 'Not found',
        error: 'Not Found',
      }),
    ).toEqual({
      code: ErrorCode.RESOURCE_NOT_FOUND,
      message: 'Not found',
      error: 'Not Found',
    });
  });
});
