import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Response } from 'express';
import { REQUEST_ID_HEADER } from '../constants/logging.constants';
import { RequestWithLogging } from '../types/request-with-logging.type';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(
    request: RequestWithLogging,
    response: Response,
    next: NextFunction,
  ): void {
    const incomingRequestId = request.headers[REQUEST_ID_HEADER];
    const requestId = Array.isArray(incomingRequestId)
      ? incomingRequestId[0]
      : incomingRequestId;

    request.requestId =
      typeof requestId === 'string' && requestId.trim().length > 0
        ? requestId.trim()
        : randomUUID();

    response.setHeader(REQUEST_ID_HEADER, request.requestId);
    next();
  }
}
