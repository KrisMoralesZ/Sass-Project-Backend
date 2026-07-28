import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SelectQueryBuilder } from 'typeorm';
import { OrganizationMember } from '../entities/organization-member.entity';
import { OrganizationRole } from '../enums/organization-role.enum';
import { OrganizationMembershipService } from './organization-membership.service';

describe('OrganizationMembershipService', () => {
  let service: OrganizationMembershipService;
  let membersRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let queryBuilder: {
    innerJoin: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    select: jest.Mock;
    getCount: jest.Mock;
    getRawMany: jest.Mock;
  };

  beforeEach(async () => {
    queryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
      getRawMany: jest.fn(),
    };

    membersRepository = {
      create: jest.fn((data) => data as OrganizationMember),
      save: jest.fn((entity) => Promise.resolve(entity as OrganizationMember)),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(
        () => queryBuilder as unknown as SelectQueryBuilder<OrganizationMember>,
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationMembershipService,
        {
          provide: getRepositoryToken(OrganizationMember),
          useValue: membersRepository,
        },
      ],
    }).compile();

    service = module.get(OrganizationMembershipService);
  });

  it('creates a membership record', async () => {
    await service.createMembership('org-1', 'user-1', OrganizationRole.OWNER);

    expect(membersRepository.create).toHaveBeenCalledWith({
      organizationId: 'org-1',
      userId: 'user-1',
      role: OrganizationRole.OWNER,
    });
    expect(membersRepository.save).toHaveBeenCalled();
  });

  it('returns true when the user belongs to the organization', async () => {
    membersRepository.findOne.mockResolvedValue({
      id: 'member-1',
      organizationId: 'org-1',
      userId: 'user-1',
      role: OrganizationRole.MEMBER,
    });

    await expect(service.isMember('user-1', 'org-1')).resolves.toBe(true);
  });

  it('returns organization ids for a user', async () => {
    membersRepository.find.mockResolvedValue([
      { organizationId: 'org-1' },
      { organizationId: 'org-2' },
    ] as OrganizationMember[]);

    await expect(service.getOrganizationIdsForUser('user-1')).resolves.toEqual([
      'org-1',
      'org-2',
    ]);
  });

  it('returns only active organization ids for a user', async () => {
    queryBuilder.getRawMany.mockResolvedValue([{ organizationId: 'org-1' }]);

    await expect(
      service.getActiveOrganizationIdsForUser('user-1'),
    ).resolves.toEqual(['org-1']);
    expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
      'member.organization',
      'organization',
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'organization.deletedAt IS NULL',
    );
  });

  it('returns false when membership exists only for an archived organization', async () => {
    queryBuilder.getCount.mockResolvedValue(0);

    await expect(service.isActiveMember('user-1', 'org-1')).resolves.toBe(
      false,
    );
  });
});
