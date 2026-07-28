import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppException } from '@common/errors';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected throwThrottlingException(): Promise<void> {
    throw AppException.tooManyRequests(
      'Too many requests. Please try again later.',
    );
  }
}
