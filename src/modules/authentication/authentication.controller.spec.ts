import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';

describe('AuthenticationController', () => {
  let controller: AuthenticationController;
  let authenticationService: jest.Mocked<
    Pick<
      AuthenticationService,
      'register' | 'login' | 'refresh' | 'logout' | 'getProfile'
    >
  >;

  beforeEach(async () => {
    authenticationService = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
      getProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthenticationController],
      providers: [
        {
          provide: AuthenticationService,
          useValue: authenticationService,
        },
      ],
    }).compile();

    controller = module.get(AuthenticationController);
  });

  it('delegates registration to the service', async () => {
    const payload = {
      email: 'owner@company.com',
      password: 'Password1',
    };

    authenticationService.register.mockResolvedValue({
      user: {
        id: 'user-1',
        email: payload.email,
        displayName: null,
        createdAt: new Date(),
      },
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
      },
    });

    await controller.register(payload);
    expect(authenticationService.register).toHaveBeenCalledWith(payload);
  });

  it('delegates login to the service', async () => {
    const payload = {
      email: 'owner@company.com',
      password: 'Password1',
    };

    await controller.login(payload);
    expect(authenticationService.login).toHaveBeenCalledWith(payload);
  });

  it('delegates me to the service', async () => {
    await controller.me({ id: 'user-1' });
    expect(authenticationService.getProfile).toHaveBeenCalledWith('user-1');
  });
});
