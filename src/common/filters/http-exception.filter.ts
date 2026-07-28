import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { parseExceptionResponse } from '@common/errors/parse-exception-response.util';
import { ApiErrorResponse } from '@common/interfaces/api-response.interface';
import { getRequestLogContext } from '@common/logging/utils/request-log-context.util';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

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

    this.logger.error(
      JSON.stringify({
        ...getRequestLogContext(request),
        statusCode: status,
        code,
        message,
        error,
      }),
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
