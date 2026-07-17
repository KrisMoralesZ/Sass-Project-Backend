import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';

describe('AuthenticationController', () => {
  let controller: AuthenticationController;
  let authenticationService: jest.Mocked<
    Pick<AuthenticationService, 'register'>
  >;

  beforeEach(async () => {
    authenticationService = {
      register: jest.fn(),
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
    const response = {
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
    };

    authenticationService.register.mockResolvedValue(response);

    await expect(controller.register(payload)).resolves.toEqual(response);
    expect(authenticationService.register).toHaveBeenCalledWith(payload);
  });
});
