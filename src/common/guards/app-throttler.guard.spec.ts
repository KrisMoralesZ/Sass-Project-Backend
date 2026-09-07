import { AppException, ErrorCode } from '@common/errors';
import { AppThrottlerGuard } from './app-throttler.guard';

describe('AppThrottlerGuard', () => {
  it('throws a too-many-requests AppException', () => {
    const guard = Object.create(
      AppThrottlerGuard.prototype,
    ) as AppThrottlerGuard;

    expect(() => {
      void guard['throwThrottlingException']();
    }).toThrow(AppException);

    try {
      void guard['throwThrottlingException']();
    } catch (error) {
      expect(error).toBeInstanceOf(AppException);
      expect((error as AppException).code).toBe(ErrorCode.TOO_MANY_REQUESTS);
    }
  });
});
