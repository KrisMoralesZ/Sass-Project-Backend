import { BadRequestException, HttpStatus } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common/interfaces';
import { AppException, ErrorCode } from '@common/errors';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  it('formats app exceptions with standard error codes', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const request = { url: '/api/v1/projects' };
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => request,
      }),
    } as unknown as ArgumentsHost;

    filter.catch(
      AppException.badRequest(
        ErrorCode.TENANT_ORGANIZATION_REQUIRED,
        'Organization context is required',
      ),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: ErrorCode.TENANT_ORGANIZATION_REQUIRED,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Organization context is required',
        }) as object,
        meta: expect.objectContaining({
          path: '/api/v1/projects',
          version: 'v1',
        }) as object,
      }),
    );
  });

  it('assigns validation code to class-validator style responses', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const request = { url: '/api/v1/projects' };
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => request,
      }),
    } as unknown as ArgumentsHost;

    filter.catch(
      new BadRequestException({
        message: ['name must be a string'],
        error: 'Bad Request',
      }),
      host,
    );

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: ErrorCode.VALIDATION_FAILED,
          message: ['name must be a string'],
        }) as object,
      }),
    );
  });
});
