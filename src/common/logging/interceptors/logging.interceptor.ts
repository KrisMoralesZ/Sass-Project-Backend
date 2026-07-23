import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RequestCompletionLogContext } from '@common/logging/interfaces/request-log-context.interface';
import {
  formatRequestLogContext,
  getRequestLogContext,
} from '@common/logging/utils/request-log-context.util';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();
    const startedAt = Date.now();
    const requestContext = getRequestLogContext(request);

    this.logger.log(
      `Incoming request ${formatRequestLogContext(requestContext)}`,
    );

    return next.handle().pipe(
      tap(() => {
        const completionContext: RequestCompletionLogContext = {
          ...requestContext,
          statusCode: response.statusCode,
          durationMs: Date.now() - startedAt,
        };

        this.logger.log(
          `Request completed ${JSON.stringify(completionContext)}`,
        );
      }),
    );
  }
}
