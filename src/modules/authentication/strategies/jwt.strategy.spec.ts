import { ConfigService } from '@nestjs/config';
import { AppException, ErrorCode } from '@common/errors';
import { JwtAccessPayload } from '@authentication/interfaces/auth.interface';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const accessPayload: JwtAccessPayload = {
    sub: 'user-1',
    email: 'owner@company.com',
    type: 'access',
  };

  it('throws when the access secret is missing', () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;

    expect(() => new JwtStrategy(configService)).toThrow(
      'JWT access secret is not configured',
    );
  });

  it('maps a valid access payload to the authenticated user', () => {
    const configService = {
      get: jest.fn().mockReturnValue('test-access-secret'),
    } as unknown as ConfigService;
    const strategy = new JwtStrategy(configService);

    expect(strategy.validate(accessPayload)).toEqual({
      id: accessPayload.sub,
      email: accessPayload.email,
    });
  });

  it('rejects tokens that are not access tokens', () => {
    const configService = {
      get: jest.fn().mockReturnValue('test-access-secret'),
    } as unknown as ConfigService;
    const strategy = new JwtStrategy(configService);

    expect(() =>
      strategy.validate({
        ...accessPayload,
        type: 'refresh',
      } as unknown as JwtAccessPayload),
    ).toThrow(AppException);

    try {
      strategy.validate({
        ...accessPayload,
        type: 'refresh',
      } as unknown as JwtAccessPayload);
    } catch (error) {
      expect(error).toBeInstanceOf(AppException);
      expect((error as AppException).code).toBe(ErrorCode.UNAUTHORIZED);
    }
  });
});
