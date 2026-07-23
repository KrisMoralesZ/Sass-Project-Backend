import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ErrorCode } from '@common/errors/error-code.enum';
import { OrganizationMember } from './entities/organization-member.entity';
import { Organization } from './entities/organization.entity';
import { OrganizationPlan } from './enums/organization-plan.enum';
import { OrganizationRole } from './enums/organization-role.enum';
import { OrganizationsService } from './organizations.service';
import { OrganizationMembershipService } from './services/organization-membership.service';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let organizationsRepository: jest.Mocked<
    Pick<
      Repository<Organization>,
      'create' | 'save' | 'findOne' | 'findAndCount' | 'softRemove'
    >
  >;
  let membersRepository: jest.Mocked<
    Pick<Repository<OrganizationMember>, 'create' | 'save'>
  >;
  let organizationMembershipService: jest.Mocked<
    Pick<
      OrganizationMembershipService,
      'getOrganizationIdsForUser' | 'isMember'
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
    members: [],
  };

  beforeEach(async () => {
    organizationsRepository = {
      create: jest.fn((data) => data as Organization),
      save: jest.fn((entity) =>
        Promise.resolve({ ...organization, ...entity, id: organization.id }),
      ),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      softRemove: jest.fn().mockResolvedValue(undefined),
    };

    membersRepository = {
      create: jest.fn((data) => data as OrganizationMember),
      save: jest.fn((entity) => Promise.resolve(entity as OrganizationMember)),
    };

    organizationMembershipService = {
      getOrganizationIdsForUser: jest.fn().mockResolvedValue(['org-1']),
      isMember: jest.fn().mockResolvedValue(true),
    };

    const dataSource = {
      transaction: jest.fn(async (callback) =>
        callback({
          getRepository: (entity: unknown) => {
            if (entity === Organization) {
              return organizationsRepository;
            }

            if (entity === OrganizationMember) {
              return membersRepository;
            }

            throw new Error('Unexpected repository requested in transaction');
          },
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: getRepositoryToken(Organization),
          useValue: organizationsRepository,
        },
        {
          provide: OrganizationMembershipService,
          useValue: organizationMembershipService,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get(OrganizationsService);
  });

  it('creates an organization and owner membership for the creator', async () => {
    organizationsRepository.findOne.mockResolvedValue(null);

    const result = await service.create({ name: 'Acme Corporation' }, 'user-1');

    expect(organizationsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Acme Corporation',
        slug: 'acme-corporation',
        plan: OrganizationPlan.FREE,
      }),
    );
    expect(membersRepository.create).toHaveBeenCalledWith({
      organizationId: 'org-1',
      userId: 'user-1',
      role: OrganizationRole.OWNER,
    });
    expect(result.slug).toBe('acme-corporation');
  });

  it('creates an organization with a suffixed slug when the base slug is taken', async () => {
    organizationsRepository.findOne
      .mockResolvedValueOnce(organization)
      .mockResolvedValueOnce(null);

    const result = await service.create({ name: 'Acme Corporation' }, 'user-1');

    expect(organizationsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'acme-corporation-2',
      }),
    );
    expect(result.slug).toBe('acme-corporation-2');
  });

  it('throws conflict when an explicit slug already exists', async () => {
    organizationsRepository.findOne.mockResolvedValue(organization);

    await expect(
      service.create({ name: 'Acme Corporation', slug: 'acme-corp' }, 'user-1'),
    ).rejects.toMatchObject({
      code: ErrorCode.CONFLICT,
      message: 'Organization slug "acme-corp" is already taken',
    });
  });

  it('returns only organizations the user belongs to', async () => {
    organizationsRepository.findAndCount.mockResolvedValue([[organization], 1]);

    const result = await service.findAll({}, 'user-1');

    expect(
      organizationMembershipService.getOrganizationIdsForUser,
    ).toHaveBeenCalledWith('user-1');
    expect(result.items).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });

  it('returns an empty list when the user has no memberships', async () => {
    organizationMembershipService.getOrganizationIdsForUser.mockResolvedValue([]);

    const result = await service.findAll({}, 'user-1');

    expect(result.items).toHaveLength(0);
    expect(result.pagination.total).toBe(0);
    expect(organizationsRepository.findAndCount).not.toHaveBeenCalled();
  });

  it('updates an organization for a member', async () => {
    organizationsRepository.findOne
      .mockResolvedValueOnce(organization)
      .mockResolvedValueOnce(null);

    const result = await service.update(
      'org-1',
      { name: 'Acme Corp Updated' },
      'user-1',
    );

    expect(organizationMembershipService.isMember).toHaveBeenCalledWith(
      'user-1',
      'org-1',
    );
    expect(result.name).toBe('Acme Corp Updated');
  });

  it('allows updating an organization without changing its slug', async () => {
    organizationsRepository.findOne
      .mockResolvedValueOnce(organization)
      .mockResolvedValueOnce(organization);

    const result = await service.update(
      'org-1',
      { slug: 'acme-corp' },
      'user-1',
    );

    expect(result.slug).toBe('acme-corp');
  });

  it('throws conflict when updating to a slug owned by another organization', async () => {
    organizationsRepository.findOne
      .mockResolvedValueOnce(organization)
      .mockResolvedValueOnce({
        ...organization,
        id: 'org-2',
        slug: 'acme-global',
      });

    await expect(
      service.update('org-1', { slug: 'acme-global' }, 'user-1'),
    ).rejects.toMatchObject({
      code: ErrorCode.CONFLICT,
      message: 'Organization slug "acme-global" is already taken',
    });
  });

  it('returns not found when accessing an organization without membership', async () => {
    organizationMembershipService.isMember.mockResolvedValue(false);

    await expect(service.findOne('org-1', 'user-1')).rejects.toMatchObject({
      code: ErrorCode.RESOURCE_NOT_FOUND,
      message: 'Organization not found',
    });
  });

  it('archives an organization for a member', async () => {
    organizationsRepository.findOne.mockResolvedValue(organization);

    await service.remove('org-1', 'user-1');

    expect(organizationsRepository.softRemove).toHaveBeenCalledWith(
      organization,
    );
  });
});
