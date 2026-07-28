import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ErrorCode } from '@common/errors/error-code.enum';
import { User } from '@authentication/entities/user.entity';
import { DEFAULT_USER_PROFILE_PREFERENCES } from './interfaces/user-profile-preferences.interface';
import { UserProfile } from './entities/user-profile.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: {
    findOne: jest.Mock;
  };
  let profilesRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let transactionUsersRepository: {
    save: jest.Mock;
  };
  let transactionProfilesRepository: {
    save: jest.Mock;
  };

  const user: User = {
    id: 'user-1',
    email: 'owner@company.com',
    passwordHash: 'hashed',
    displayName: 'Jane Owner',
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    memberships: [],
  };

  const profile: UserProfile = {
    id: 'profile-1',
    userId: 'user-1',
    displayName: 'Jane Owner',
    avatarUrl: null,
    preferences: { ...DEFAULT_USER_PROFILE_PREFERENCES },
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    user,
  };

  beforeEach(async () => {
    usersRepository = {
      findOne: jest.fn(),
    };

    profilesRepository = {
      findOne: jest.fn(),
      create: jest.fn((data) => data as UserProfile),
      save: jest.fn((entity) =>
        Promise.resolve({
          ...profile,
          ...entity,
          id: profile.id,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
          deletedAt: null,
        }),
      ),
    };

    transactionUsersRepository = {
      save: jest.fn((entity) => Promise.resolve(entity)),
    };
    transactionProfilesRepository = {
      save: jest.fn((entity) => Promise.resolve(entity)),
    };

    const dataSource = {
      transaction: jest.fn(
        async (callback: (manager: unknown) => Promise<unknown>) =>
          callback({
            getRepository: (entity: unknown) => {
              if (entity === User) {
                return transactionUsersRepository;
              }

              if (entity === UserProfile) {
                return transactionProfilesRepository;
              }

              throw new Error('Unexpected repository requested in transaction');
            },
          }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
        {
          provide: getRepositoryToken(UserProfile),
          useValue: profilesRepository,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('creates a profile with default avatar and preferences', async () => {
    profilesRepository.findOne.mockResolvedValue(null);

    const result = await service.createProfileForUser('user-1', 'Jane Owner');

    expect(profilesRepository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      displayName: 'Jane Owner',
      avatarUrl: null,
      preferences: DEFAULT_USER_PROFILE_PREFERENCES,
    });
    expect(result.displayName).toBe('Jane Owner');
  });

  it('returns the current user profile with normalized preferences', async () => {
    usersRepository.findOne.mockResolvedValue(user);
    profilesRepository.findOne.mockResolvedValue(profile);

    await expect(service.getMyProfile('user-1')).resolves.toEqual({
      id: 'profile-1',
      userId: 'user-1',
      email: 'owner@company.com',
      displayName: 'Jane Owner',
      avatarUrl: null,
      preferences: DEFAULT_USER_PROFILE_PREFERENCES,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    });
  });

  it('updates the profile and syncs displayName to the user record', async () => {
    usersRepository.findOne.mockResolvedValue(user);
    profilesRepository.findOne.mockResolvedValue({
      ...profile,
      preferences: { ...DEFAULT_USER_PROFILE_PREFERENCES },
    });

    const result = await service.updateMyProfile('user-1', {
      displayName: 'Jane Updated',
    });

    expect(transactionUsersRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ displayName: 'Jane Updated' }),
    );
    expect(transactionProfilesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ displayName: 'Jane Updated' }),
    );
    expect(result.displayName).toBe('Jane Updated');
  });

  it('updates avatar and preference fields', async () => {
    usersRepository.findOne.mockResolvedValue(user);
    profilesRepository.findOne.mockResolvedValue({
      ...profile,
      preferences: { ...DEFAULT_USER_PROFILE_PREFERENCES },
    });

    const result = await service.updateMyProfile('user-1', {
      avatarUrl: 'https://cdn.example.com/avatars/jane.png',
      preferences: {
        theme: 'dark',
        notifications: {
          email: false,
        },
      },
    });

    expect(transactionProfilesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        avatarUrl: 'https://cdn.example.com/avatars/jane.png',
        preferences: {
          timezone: 'UTC',
          locale: 'en',
          theme: 'dark',
          notifications: {
            email: false,
            inApp: true,
            marketing: false,
          },
        },
      }),
    );
    expect(result.avatarUrl).toBe('https://cdn.example.com/avatars/jane.png');
    expect(result.preferences.theme).toBe('dark');
    expect(result.preferences.notifications.email).toBe(false);
  });

  it('throws not found when the user does not exist', async () => {
    usersRepository.findOne.mockResolvedValue(null);

    await expect(service.getMyProfile('missing')).rejects.toMatchObject({
      code: ErrorCode.RESOURCE_NOT_FOUND,
    });
  });
});
