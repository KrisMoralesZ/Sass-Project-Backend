import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppException } from '../common/errors';
import { RefreshToken } from './entities/refresh-token.entity';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: jest.Mocked<Pick<JwtService, 'sign' | 'verify'>>;
  let refreshTokensRepository: jest.Mocked<
    Pick<Repository<RefreshToken>, 'save' | 'create' | 'findOne' | 'update'>
  >;

  beforeEach(async () => {
    jwtService = {
      sign: jest
        .fn()
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token'),
      verify: jest.fn().mockReturnValue({
        sub: 'user-1',
        type: 'refresh',
        jti: 'token-1',
      }),
    };

    refreshTokensRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      create: jest.fn((data) => data as RefreshToken),
      findOne: jest.fn().mockResolvedValue({
        tokenId: 'token-1',
        userId: 'user-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      }),
      update: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const values: Record<string, string> = {
                'auth.jwtAccessSecret': 'access-secret',
                'auth.jwtRefreshSecret': 'refresh-secret',
                'auth.jwtAccessExpiresIn': '15m',
                'auth.jwtRefreshExpiresIn': '7d',
              };

              return values[key];
            }),
          },
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: refreshTokensRepository,
        },
      ],
    }).compile();

    service = module.get(TokenService);
  });

  it('generates access and refresh tokens and stores refresh metadata', async () => {
    const tokens = await service.generateTokens('user-1', 'owner@company.com');

    expect(tokens).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 900,
    });
    expect(refreshTokensRepository.save).toHaveBeenCalled();
  });

  it('validates a refresh token', async () => {
    const result = await service.validateRefreshToken('refresh-token');

    expect(result).toEqual({
      userId: 'user-1',
      tokenId: 'token-1',
    });
  });

  it('rejects invalid refresh tokens', async () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    await expect(
      service.validateRefreshToken('bad-token'),
    ).rejects.toBeInstanceOf(AppException);
  });
});
