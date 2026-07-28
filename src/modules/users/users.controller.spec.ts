import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<
    Pick<UsersService, 'getMyProfile' | 'updateMyProfile'>
  >;

  beforeEach(async () => {
    usersService = {
      getMyProfile: jest.fn(),
      updateMyProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    controller = module.get(UsersController);
  });

  it('delegates getMe to the service', async () => {
    const response = {
      id: 'profile-1',
      userId: 'user-1',
      email: 'owner@company.com',
      displayName: 'Jane Owner',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    usersService.getMyProfile.mockResolvedValue(response);

    await expect(controller.getMe({ id: 'user-1' })).resolves.toEqual(response);
    expect(usersService.getMyProfile).toHaveBeenCalledWith('user-1');
  });

  it('delegates updateMe to the service', async () => {
    const dto = { displayName: 'Jane Updated' };
    usersService.updateMyProfile.mockResolvedValue({
      id: 'profile-1',
      userId: 'user-1',
      email: 'owner@company.com',
      displayName: dto.displayName,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await controller.updateMe({ id: 'user-1' }, dto);

    expect(usersService.updateMyProfile).toHaveBeenCalledWith('user-1', dto);
  });
});
