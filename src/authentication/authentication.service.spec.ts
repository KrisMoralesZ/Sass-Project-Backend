import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppException } from '../common/errors';
import { AuthenticationService } from './authentication.service';
import { User } from './entities/user.entity';
import { TokenService } from './token.service';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let usersRepository: jest.Mocked<
    Pick<Repository<User>, 'findOne' | 'create' | 'save'>
  >;
  let tokenService: jest.Mocked<Pick<TokenService, 'generateTokens'>>;

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
    };

    tokenService = {
      generateTokens: jest.fn().mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
      }),
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

    expect(usersRepository.findOne).toHaveBeenCalledWith({
      where: { email: 'owner@company.com' },
    });
    expect(usersRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'owner@company.com',
        displayName: 'Jane Owner',
        passwordHash: expect.any(String) as string,
      }),
    );
    expect(tokenService.generateTokens).toHaveBeenCalledWith(
      'user-1',
      'owner@company.com',
    );
    expect(result.user).toEqual(
      expect.objectContaining({
        id: 'user-1',
        email: 'owner@company.com',
        displayName: 'Jane Owner',
      }),
    );
    expect(result.tokens.accessToken).toBe('access-token');
  });

  it('throws conflict when email is already registered', async () => {
    usersRepository.findOne.mockResolvedValue({ id: 'existing-user' } as User);

    await expect(
      service.register({
        email: 'owner@company.com',
        password: 'Password1',
      }),
    ).rejects.toBeInstanceOf(AppException);

    expect(usersRepository.save).not.toHaveBeenCalled();
    expect(tokenService.generateTokens).not.toHaveBeenCalled();
  });
});
