import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';

describe('AuthenticationController', () => {
  let controller: AuthenticationController;
  let service: { register: jest.Mock };

  beforeEach(async () => {
    service = { register: jest.fn() };

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
});
