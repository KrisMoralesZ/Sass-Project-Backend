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
    count: jest.Mock;
    delete: jest.Mock;
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
      count: jest.fn(),
      delete: jest.fn(),
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
    queryBuilder.getOne.mockResolvedValue(null);

    await expect(service.isActiveMember('user-1', 'org-1')).resolves.toBe(
      false,
    );
  });

  it('returns the active membership with role data', async () => {
    queryBuilder.getOne.mockResolvedValue(membership);

    await expect(
      service.getActiveMembership('user-1', 'org-1'),
    ).resolves.toEqual(membership);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'member.organizationId = :organizationId',
      { organizationId: 'org-1' },
    );
  });

  it('returns true when the email already belongs to the organization', async () => {
    queryBuilder.getOne.mockResolvedValue(membership);

    await expect(
      service.isActiveMemberByEmail('org-1', 'owner@company.com'),
    ).resolves.toBe(true);
    expect(queryBuilder.innerJoin).toHaveBeenCalledWith('member.user', 'user');
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('user.email = :email', {
      email: 'owner@company.com',
    });
  });

  it('returns false when no member matches the invited email', async () => {
    queryBuilder.getOne.mockResolvedValue(null);

    await expect(
      service.isActiveMemberByEmail('org-1', 'guest@company.com'),
    ).resolves.toBe(false);
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

  describe('removeMember', () => {
    it('deletes only the member in the active organization', async () => {
      membersRepository.delete.mockResolvedValue({ affected: 1 });

      await expect(
        service.removeMember('org-1', 'user-2'),
      ).resolves.toBeUndefined();

      expect(membersRepository.delete).toHaveBeenCalledWith({
        organizationId: 'org-1',
        userId: 'user-2',
      });
    });

    it('throws not found when the member is not in the active organization', async () => {
      membersRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(
        service.removeMember('org-1', 'missing'),
      ).rejects.toMatchObject({
        code: ErrorCode.RESOURCE_NOT_FOUND,
      });
    });
  });

  describe('updateMemberRole', () => {
    const ownerActor = {
      userId: 'owner-1',
      role: OrganizationRole.OWNER,
    };

    it('updates the member role and returns the member', async () => {
      const target = {
        ...membership,
        userId: 'user-2',
        role: OrganizationRole.MEMBER,
      };
      queryBuilder.getOne.mockResolvedValue(target);

      const result = await service.updateMemberRole(
        'org-1',
        'user-2',
        OrganizationRole.ADMIN,
        ownerActor,
      );

      expect(membersRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ role: OrganizationRole.ADMIN }),
      );
      expect(result).toMatchObject({
        userId: 'user-2',
        role: OrganizationRole.ADMIN,
      });
    });

    it('rejects changing your own role', async () => {
      await expect(
        service.updateMemberRole(
          'org-1',
          'owner-1',
          OrganizationRole.ADMIN,
          ownerActor,
        ),
      ).rejects.toMatchObject({ code: ErrorCode.CONFLICT });

      expect(queryBuilder.getOne).not.toHaveBeenCalled();
      expect(membersRepository.save).not.toHaveBeenCalled();
    });

    it('throws not found when the member is missing', async () => {
      queryBuilder.getOne.mockResolvedValue(null);

      await expect(
        service.updateMemberRole(
          'org-1',
          'missing',
          OrganizationRole.ADMIN,
          ownerActor,
        ),
      ).rejects.toMatchObject({ code: ErrorCode.RESOURCE_NOT_FOUND });
    });

    it('does not persist when the role is unchanged', async () => {
      const target = { ...membership, userId: 'user-2' };
      queryBuilder.getOne.mockResolvedValue(target);

      const result = await service.updateMemberRole(
        'org-1',
        'user-2',
        OrganizationRole.OWNER,
        ownerActor,
      );

      expect(result.role).toBe(OrganizationRole.OWNER);
      expect(membersRepository.save).not.toHaveBeenCalled();
    });

    it('forbids an admin from granting the OWNER role', async () => {
      const target = {
        ...membership,
        userId: 'user-2',
        role: OrganizationRole.MEMBER,
      };
      queryBuilder.getOne.mockResolvedValue(target);

      await expect(
        service.updateMemberRole('org-1', 'user-2', OrganizationRole.OWNER, {
          userId: 'admin-1',
          role: OrganizationRole.ADMIN,
        }),
      ).rejects.toMatchObject({ code: ErrorCode.FORBIDDEN });

      expect(membersRepository.save).not.toHaveBeenCalled();
    });

    it('forbids an admin from revoking the OWNER role', async () => {
      const target = { ...membership, userId: 'user-2' };
      queryBuilder.getOne.mockResolvedValue(target);

      await expect(
        service.updateMemberRole('org-1', 'user-2', OrganizationRole.ADMIN, {
          userId: 'admin-1',
          role: OrganizationRole.ADMIN,
        }),
      ).rejects.toMatchObject({ code: ErrorCode.FORBIDDEN });
    });

    it('prevents demoting the last owner', async () => {
      const target = { ...membership, userId: 'user-2' };
      queryBuilder.getOne.mockResolvedValue(target);
      membersRepository.count.mockResolvedValue(1);

      await expect(
        service.updateMemberRole(
          'org-1',
          'user-2',
          OrganizationRole.ADMIN,
          ownerActor,
        ),
      ).rejects.toMatchObject({ code: ErrorCode.MEMBER_LAST_OWNER });

      expect(membersRepository.save).not.toHaveBeenCalled();
    });

    it('allows demoting an owner when another owner remains', async () => {
      const target = { ...membership, userId: 'user-2' };
      queryBuilder.getOne.mockResolvedValue(target);
      membersRepository.count.mockResolvedValue(2);

      const result = await service.updateMemberRole(
        'org-1',
        'user-2',
        OrganizationRole.ADMIN,
        ownerActor,
      );

      expect(membersRepository.save).toHaveBeenCalled();
      expect(result.role).toBe(OrganizationRole.ADMIN);
    });
  });
});
