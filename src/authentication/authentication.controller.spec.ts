import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';

describe('AuthenticationController', () => {
  let controller: AuthenticationController;
  let service: {
    register: jest.Mock;
    login: jest.Mock;
    refresh: jest.Mock;
    logout: jest.Mock;
    me: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
      me: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthenticationController],
      providers: [{ provide: AuthenticationService, useValue: service }],
    }).compile();

    controller = module.get<AuthenticationController>(AuthenticationController);
  });

  it('delegates registration to the service', async () => {
    service.register.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });

    await controller.register({
      email: 'alice@example.com',
      password: 'StrongPass123!',
      displayName: 'Alice',
    });

    expect(service.register).toHaveBeenCalled();
  });

  it('delegates login to the service', async () => {
    service.login.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });

    await controller.login({
      email: 'alice@example.com',
      password: 'StrongPass123!',
    });

    expect(service.login).toHaveBeenCalled();
  });

  it('delegates refresh to the service', async () => {
    service.refresh.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });

    await controller.refresh({ refreshToken: 'refresh-token-for-user-1' });

    expect(service.refresh).toHaveBeenCalled();
  });

  it('delegates logout to the service', () => {
    service.logout.mockResolvedValue(undefined);

    controller.logout({
      headers: { authorization: 'Bearer token' },
    } as never);

    expect(service.logout).toHaveBeenCalled();
  });

  it('delegates me to the service', async () => {
    service.me.mockResolvedValue({ id: '1', email: 'alice@example.com' });

    await controller.me({
      headers: { authorization: 'Bearer token' },
    } as never);

    expect(service.me).toHaveBeenCalled();
  });
});
