import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { getRequestLogContext } from './utils/request-log-context.util';

@Injectable({ scope: Scope.REQUEST })
export class RequestContextLogger {
  private readonly logger = new Logger(RequestContextLogger.name);

  constructor(@Inject(REQUEST) private readonly request: Request) {}

  log(message: string, context?: Record<string, unknown>): void {
    this.write('log', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.write('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.write('error', message, context);
  }

  private write(
    level: 'log' | 'warn' | 'error',
    message: string,
    context?: Record<string, unknown>,
  ): void {
    const payload = {
      ...getRequestLogContext(this.request),
      message,
      ...context,
    };
    const formatted = JSON.stringify(payload);

    if (level === 'warn') {
      this.logger.warn(formatted);
      return;
    }

    if (level === 'error') {
      this.logger.error(formatted);
      return;
    }

    this.logger.log(formatted);
  }
}
