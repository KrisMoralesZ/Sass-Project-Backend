import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '../interfaces/api-response.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message: string | string[] = 'Internal server error';
    let error: string | undefined = HttpStatus[status];

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const responseBody = exceptionResponse as {
        message?: string | string[];
        error?: string;
      };
      message = responseBody.message ?? message;
      error = responseBody.error ?? error;
    }

    const body: ApiErrorResponse = {
      success: false,
      error: {
        statusCode: status,
        message,
        error,
      },
      meta: {
        timestamp: new Date().toISOString(),
        path: request.url,
        version: 'v1',
      },
    };

    response.status(status).json(body);
  }
}
