import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppException } from '../../common/errors';
import { Organization } from './entities/organization.entity';
import { OrganizationPlan } from './enums/organization-plan.enum';
import { OrganizationsService } from './organizations.service';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let organizationsRepository: jest.Mocked<
    Pick<
      Repository<Organization>,
      'create' | 'save' | 'findOne' | 'findAndCount' | 'softRemove'
    >
  >;

  const organization: Organization = {
    id: 'org-1',
    name: 'Acme Corporation',
    slug: 'acme-corp',
    plan: OrganizationPlan.FREE,
    settings: {
      timezone: 'UTC',
      locale: 'en',
    },
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
  };

  beforeEach(async () => {
    organizationsRepository = {
      create: jest.fn((data) => data as Organization),
      save: jest.fn((entity) =>
        Promise.resolve({ ...organization, ...entity }),
      ),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      softRemove: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: getRepositoryToken(Organization),
          useValue: organizationsRepository,
        },
      ],
    }).compile();

    service = module.get(OrganizationsService);
  });

  it('creates an organization with a generated slug', async () => {
    organizationsRepository.findOne.mockResolvedValue(null);

    const result = await service.create({ name: 'Acme Corporation' }, 'user-1');

    expect(organizationsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Acme Corporation',
        slug: 'acme-corporation',
        plan: OrganizationPlan.FREE,
      }),
    );
    expect(result.slug).toBe('acme-corporation');
  });

  it('throws conflict when slug already exists', async () => {
    organizationsRepository.findOne.mockResolvedValue(organization);

    await expect(
      service.create({ name: 'Acme Corporation', slug: 'acme-corp' }, 'user-1'),
    ).rejects.toBeInstanceOf(AppException);
  });

  it('returns paginated organizations', async () => {
    organizationsRepository.findAndCount.mockResolvedValue([[organization], 1]);

    const result = await service.findAll({}, 'user-1');

    expect(result.items).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });

  it('updates an organization', async () => {
    organizationsRepository.findOne
      .mockResolvedValueOnce(organization)
      .mockResolvedValueOnce(null);

    const result = await service.update(
      'org-1',
      { name: 'Acme Corp Updated' },
      'user-1',
    );

    expect(result.name).toBe('Acme Corp Updated');
  });

  it('archives an organization', async () => {
    organizationsRepository.findOne.mockResolvedValue(organization);

    await service.remove('org-1', 'user-1');

    expect(organizationsRepository.softRemove).toHaveBeenCalledWith(
      organization,
    );
  });
});
