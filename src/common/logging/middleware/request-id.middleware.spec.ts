import { NextFunction, Response } from 'express';
import { REQUEST_ID_HEADER } from '@common/logging/constants/logging.constants';
import { RequestIdMiddleware } from '@common/logging/middleware/request-id.middleware';
import { RequestWithLogging } from '@common/logging/types/request-with-logging.type';

describe('RequestIdMiddleware', () => {
  let middleware: RequestIdMiddleware;

  beforeEach(() => {
    middleware = new RequestIdMiddleware();
  });

  it('reuses incoming request id header', () => {
    const request = {
      headers: { [REQUEST_ID_HEADER]: 'req-existing' },
    } as RequestWithLogging;
    const response = { setHeader: jest.fn() };
    const next = jest.fn();

    middleware.use(
      request,
      response as unknown as Response,
      next as NextFunction,
    );

    expect(request.requestId).toBe('req-existing');
    expect(response.setHeader).toHaveBeenCalledWith(
      REQUEST_ID_HEADER,
      'req-existing',
    );
    expect(next).toHaveBeenCalled();
  });

  it('generates a request id when header is missing', () => {
    const request = {
      headers: {},
    } as RequestWithLogging;
    const response = { setHeader: jest.fn() };
    const next = jest.fn();

    middleware.use(
      request,
      response as unknown as Response,
      next as NextFunction,
    );

    expect(request.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      REQUEST_ID_HEADER,
      request.requestId,
    );
  });
});
