import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SelectQueryBuilder } from 'typeorm';
import { ErrorCode } from '@common/errors/error-code.enum';
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
    innerJoinAndSelect: jest.Mock;
    leftJoinAndSelect: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    select: jest.Mock;
    addOrderBy: jest.Mock;
    skip: jest.Mock;
    take: jest.Mock;
    getCount: jest.Mock;
    getRawMany: jest.Mock;
    getManyAndCount: jest.Mock;
    getOne: jest.Mock;
  };

  const membership = {
    id: 'member-1',
    organizationId: 'org-1',
    userId: 'user-1',
    role: OrganizationRole.OWNER,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    user: {
      id: 'user-1',
      email: 'owner@company.com',
      displayName: 'Jane Owner',
      profile: {
        displayName: 'Jane Owner',
        avatarUrl: 'https://cdn.example.com/jane.png',
      },
    },
  } as OrganizationMember;

  beforeEach(async () => {
    queryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
      getRawMany: jest.fn(),
      getManyAndCount: jest.fn(),
      getOne: jest.fn(),
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

  it('lists organization members with profile fields', async () => {
    queryBuilder.getManyAndCount.mockResolvedValue([[membership], 1]);

    const result = await service.listMembers('org-1', {});

    expect(queryBuilder.innerJoinAndSelect).toHaveBeenCalledWith(
      'member.user',
      'user',
    );
    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'user.profile',
      'profile',
    );
    expect(result.items).toEqual([
      {
        id: 'member-1',
        organizationId: 'org-1',
        userId: 'user-1',
        role: OrganizationRole.OWNER,
        email: 'owner@company.com',
        displayName: 'Jane Owner',
        avatarUrl: 'https://cdn.example.com/jane.png',
        createdAt: membership.createdAt,
        updatedAt: membership.updatedAt,
      },
    ]);
    expect(result.pagination.total).toBe(1);
  });

  it('returns a single organization member', async () => {
    queryBuilder.getOne.mockResolvedValue(membership);

    await expect(service.getMember('org-1', 'user-1')).resolves.toMatchObject({
      userId: 'user-1',
      email: 'owner@company.com',
      role: OrganizationRole.OWNER,
    });
  });

  it('throws not found when the member does not exist in the organization', async () => {
    queryBuilder.getOne.mockResolvedValue(null);

    await expect(service.getMember('org-1', 'missing')).rejects.toMatchObject({
      code: ErrorCode.RESOURCE_NOT_FOUND,
    });
  });
});
