import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { OrganizationPlan } from './enums/organization-plan.enum';

describe('OrganizationsController', () => {
  let controller: OrganizationsController;
  let organizationsService: jest.Mocked<
    Pick<
      OrganizationsService,
      'create' | 'findAll' | 'findOne' | 'update' | 'remove'
    >
  >;

  beforeEach(async () => {
    organizationsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [
        {
          provide: OrganizationsService,
          useValue: organizationsService,
        },
      ],
    }).compile();

    controller = module.get(OrganizationsController);
  });

  it('delegates create to the service', async () => {
    const dto = { name: 'Acme Corporation' };
    const response = {
      id: 'org-1',
      name: dto.name,
      slug: 'acme-corp',
      plan: OrganizationPlan.FREE,
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    organizationsService.create.mockResolvedValue(response);

    await expect(controller.create(dto, { id: 'user-1' })).resolves.toEqual(
      response,
    );
    expect(organizationsService.create).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('delegates findOne to the service', async () => {
    await controller.findOne('org-1', { id: 'user-1' });
    expect(organizationsService.findOne).toHaveBeenCalledWith(
      'org-1',
      'user-1',
    );
  });
});
