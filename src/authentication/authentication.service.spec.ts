import { hash } from 'bcrypt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { AppException } from '../common/errors';
import { AuthenticationService } from './authentication.service';
import { User } from './entities/user.entity';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let repository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        {
          provide: getRepositoryToken(User),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
  });

  it('registers a new user and returns tokens', async () => {
    repository.findOne.mockResolvedValue(null);
    repository.create.mockImplementation((dto: Partial<User>) => ({ ...dto }));
    repository.save.mockImplementation((user: Partial<User>) =>
      Promise.resolve(user),
    );

    const result = await service.register({
      email: 'alice@example.com',
      password: 'StrongPass123!',
      displayName: 'Alice',
    });

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.user.email).toBe('alice@example.com');
    expect(repository.save).toHaveBeenCalled();
  });

  it('rejects duplicate emails', async () => {
    repository.findOne.mockResolvedValue({ id: 'existing-user' });

    await expect(
      service.register({
        email: 'alice@example.com',
        password: 'StrongPass123!',
        displayName: 'Alice',
      }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it('logs in an existing user with the correct password', async () => {
    const passwordHash = await hash('StrongPass123!', 10);

    repository.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'alice@example.com',
      passwordHash,
      displayName: 'Alice',
      isEmailVerified: false,
    });

    const result = await service.login({
      email: 'alice@example.com',
      password: 'StrongPass123!',
    });

    expect(result.accessToken).toBeDefined();
    expect(result.user.email).toBe('alice@example.com');
  });

  it('rejects invalid credentials on login', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'alice@example.com',
        password: 'WrongPass123!',
      }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it('refreshes tokens for a valid refresh token', async () => {
    repository.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'alice@example.com',
      passwordHash: 'hashed:StrongPass123!',
      displayName: 'Alice',
      isEmailVerified: false,
    });

    const result = await service.refresh({
      refreshToken: 'refresh-token-for-user-1',
    });

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });
});
