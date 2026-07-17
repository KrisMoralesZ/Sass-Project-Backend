import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppException } from '../common/errors';
import { AuthenticationService } from './authentication.service';
import { User } from './entities/user.entity';
import { TokenService } from './token.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import { compare } from 'bcrypt';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let usersRepository: jest.Mocked<
    Pick<Repository<User>, 'findOne' | 'create' | 'save' | 'createQueryBuilder'>
  >;
  let tokenService: jest.Mocked<
    Pick<
      TokenService,
      | 'generateTokens'
      | 'validateRefreshToken'
      | 'revokeTokenById'
      | 'revokeRefreshToken'
    >
  >;

  const savedUser: User = {
    id: 'user-1',
    email: 'owner@company.com',
    passwordHash: 'hashed-password',
    displayName: 'Jane Owner',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
  };

  beforeEach(async () => {
    usersRepository = {
      findOne: jest.fn(),
      create: jest.fn((data) => data as User),
      save: jest.fn((user) =>
        Promise.resolve({
          ...user,
          id: 'user-1',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          deletedAt: null,
        }),
      ),
      createQueryBuilder: jest.fn(),
    };

    tokenService = {
      generateTokens: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
      }),
      validateRefreshToken: jest.fn().mockResolvedValue({
        userId: 'user-1',
        tokenId: 'token-1',
      }),
      revokeTokenById: jest.fn().mockResolvedValue(undefined),
      revokeRefreshToken: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: unknown) => {
              if (key === 'auth.bcryptRounds') {
                return 4;
              }

              return defaultValue;
            }),
          },
        },
        {
          provide: TokenService,
          useValue: tokenService,
        },
      ],
    }).compile();

    service = module.get(AuthenticationService);
  });

  it('registers a user and returns tokens', async () => {
    usersRepository.findOne.mockResolvedValue(null);

    const result = await service.register({
      email: 'Owner@Company.com',
      password: 'Password1',
      displayName: 'Jane Owner',
    });

    expect(tokenService.generateTokens).toHaveBeenCalledWith(
      'user-1',
      'owner@company.com',
    );
    expect(result.tokens.accessToken).toBe('access-token');
  });

  it('throws conflict when email is already registered', async () => {
    usersRepository.findOne.mockResolvedValue(savedUser);

    await expect(
      service.register({
        email: 'owner@company.com',
        password: 'Password1',
      }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it('logs in with valid credentials', async () => {
    jest.mocked(compare).mockResolvedValue(true as never);
    usersRepository.createQueryBuilder.mockReturnValue({
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(savedUser),
    } as never);

    const result = await service.login({
      email: 'owner@company.com',
      password: 'Password1',
    });

    expect(result.user.email).toBe('owner@company.com');
    expect(tokenService.generateTokens).toHaveBeenCalledWith(
      'user-1',
      'owner@company.com',
    );
  });

  it('rejects invalid login credentials', async () => {
    usersRepository.createQueryBuilder.mockReturnValue({
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    } as never);

    await expect(
      service.login({
        email: 'owner@company.com',
        password: 'Password1',
      }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it('refreshes tokens and revokes the previous refresh token', async () => {
    usersRepository.findOne.mockResolvedValue(savedUser);

    const result = await service.refresh({ refreshToken: 'refresh-token' });

    expect(tokenService.validateRefreshToken).toHaveBeenCalledWith(
      'refresh-token',
    );
    expect(tokenService.revokeTokenById).toHaveBeenCalledWith('token-1');
    expect(result.tokens.accessToken).toBe('access-token');
  });

  it('logs out by revoking the refresh token', async () => {
    const result = await service.logout({ refreshToken: 'refresh-token' });

    expect(tokenService.revokeRefreshToken).toHaveBeenCalledWith(
      'refresh-token',
    );
    expect(result.message).toBe('Logged out successfully');
  });

  it('returns the authenticated user profile', async () => {
    usersRepository.findOne.mockResolvedValue(savedUser);

    const result = await service.getProfile('user-1');

    expect(result).toEqual({
      id: 'user-1',
      email: 'owner@company.com',
      displayName: 'Jane Owner',
      createdAt: savedUser.createdAt,
    });
  });
});
