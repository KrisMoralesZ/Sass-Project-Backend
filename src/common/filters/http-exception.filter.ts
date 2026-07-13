import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { parseExceptionResponse } from '../errors/parse-exception-response.util';
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

    const { code, message, error } = parseExceptionResponse(
      status,
      exceptionResponse,
    );

    const body: ApiErrorResponse = {
      success: false,
      error: {
        code,
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
