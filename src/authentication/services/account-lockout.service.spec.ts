import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppException, ErrorCode } from '@common/errors';
import { User } from '@authentication/entities/user.entity';
import { AccountLockoutService } from './account-lockout.service';

describe('AccountLockoutService', () => {
  let service: AccountLockoutService;
  let usersRepository: jest.Mocked<Pick<Repository<User>, 'update'>>;

  beforeEach(async () => {
    usersRepository = {
      update: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountLockoutService,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: unknown) => {
              const values: Record<string, unknown> = {
                'auth.maxFailedLoginAttempts': 5,
                'auth.lockoutMinutes': 15,
              };

              return values[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(AccountLockoutService);
  });

  it('detects locked accounts', () => {
    const lockedUser = {
      failedLoginAttempts: 5,
      lockedUntil: new Date(Date.now() + 60_000),
    } as User;

    expect(service.isLocked(lockedUser)).toBe(true);
  });

  it('throws when account is locked', () => {
    const lockedUser = {
      failedLoginAttempts: 5,
      lockedUntil: new Date(Date.now() + 60_000),
    } as User;

    expect(() => service.assertNotLocked(lockedUser)).toThrow(AppException);

    try {
      service.assertNotLocked(lockedUser);
    } catch (error) {
      expect((error as AppException).code).toBe(ErrorCode.ACCOUNT_LOCKED);
    }
  });

  it('records failed attempts and locks after the threshold', async () => {
    const user = {
      id: 'user-1',
      failedLoginAttempts: 4,
      lockedUntil: null,
    } as User;

    await service.recordFailedAttempt(user);

    expect(usersRepository.update).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        failedLoginAttempts: 5,
        lockedUntil: expect.any(Date) as Date,
      }),
    );
  });

  it('resets failed attempts after successful login', async () => {
    await service.resetAttempts('user-1');

    expect(usersRepository.update).toHaveBeenCalledWith('user-1', {
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
  });
});
