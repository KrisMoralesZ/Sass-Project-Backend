import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: jest.Mocked<Pick<JwtService, 'sign'>>;

  beforeEach(async () => {
    jwtService = {
      sign: jest
        .fn()
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token'),
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
      ],
    }).compile();

    service = module.get(TokenService);
  });

  it('generates access and refresh tokens', () => {
    const tokens = service.generateTokens('user-1', 'owner@company.com');

    expect(tokens).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 900,
    });
    expect(jwtService.sign).toHaveBeenCalledTimes(2);
  });
});
