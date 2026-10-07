import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { FindOneOptions, SelectQueryBuilder } from 'typeorm';
import { ErrorCode } from '@common/errors/error-code.enum';
import { INVITATION_TTL_MS } from '../constants/organization-invitations-v1.policy';
import { AcceptInvitationDto } from '../dto/accept-invitation.dto';
import { CreateInvitationDto } from '../dto/create-invitation.dto';
import { Invitation } from '../entities/invitation.entity';
import { Organization } from '../entities/organization.entity';
import { OrganizationMember } from '../entities/organization-member.entity';
import { OrganizationRole } from '../enums/organization-role.enum';
import { hashInvitationToken } from '../utils/invitation-token.util';
import {
  DevelopmentInvitationMailer,
  type InvitationEmailPayload,
} from './development-invitation-mailer.service';
import { InvitationsService } from './invitations.service';
import { OrganizationMembershipService } from './organization-membership.service';

function createDto(payload: Record<string, unknown>): CreateInvitationDto {
  return plainToInstance(CreateInvitationDto, payload);
}

function createAcceptDto(token: string): AcceptInvitationDto {
  return plainToInstance(AcceptInvitationDto, { token });
}

type CreatedInvitationPayload = Pick<
  Invitation,
  | 'organizationId'
  | 'email'
  | 'role'
  | 'tokenHash'
  | 'status'
  | 'invitedByUserId'
  | 'expiresAt'
>;

describe('InvitationsService', () => {
  let service: InvitationsService;
  let invitationsRepository: {
    create: jest.Mock<Invitation, [CreatedInvitationPayload]>;
    save: jest.Mock<Promise<Invitation>, [Invitation]>;
    findOne: jest.Mock<
      Promise<Invitation | null>,
      [FindOneOptions<Invitation>]
    >;
    findAndCount: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let queryBuilder: {
    where: jest.Mock<unknown, [string, unknown?]>;
    andWhere: jest.Mock<unknown, [string, Record<string, unknown>?]>;
    getOne: jest.Mock;
  };
  let organizationsRepository: {
    findOne: jest.Mock<
      Promise<Organization | null>,
      [FindOneOptions<Organization>]
    >;
  };
  let membershipService: {
    isActiveMemberByEmail: jest.Mock;
    isActiveMember: jest.Mock;
    createMembership: jest.Mock<
      Promise<OrganizationMember>,
      [string, string, OrganizationRole]
    >;
    getMember: jest.Mock;
  };
  let invitationMailer: {
    sendInvitationEmail: jest.Mock<void, [InvitationEmailPayload]>;
  };

  const createInvitation = (overrides: Partial<Invitation> = {}): Invitation =>
    ({
      id: 'invite-1',
      organizationId: 'org-1',
      email: 'jane@example.com',
      role: OrganizationRole.MEMBER,
      tokenHash: 'a'.repeat(64),
      status: 'pending',
      invitedByUserId: 'user-1',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date('2026-01-15T00:00:00.000Z'),
      updatedAt: new Date('2026-01-15T00:00:00.000Z'),
      ...overrides,
    }) as Invitation;

  beforeEach(async () => {
    queryBuilder = {
      where: jest.fn<unknown, [string, unknown?]>().mockReturnThis(),
      andWhere: jest
        .fn<unknown, [string, Record<string, unknown>?]>()
        .mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };

    invitationsRepository = {
      create: jest.fn(
        (data: CreatedInvitationPayload) => data as unknown as Invitation,
      ),
      save: jest.fn((entity: Invitation) =>
        Promise.resolve(
          createInvitation({
            ...entity,
            id: 'invite-new',
            createdAt: new Date('2026-01-15T00:00:00.000Z'),
            updatedAt: new Date('2026-01-15T00:00:00.000Z'),
          }),
        ),
      ),
      findOne: jest.fn<
        Promise<Invitation | null>,
        [FindOneOptions<Invitation>]
      >(() => Promise.resolve(null)),
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn(
        () => queryBuilder as unknown as SelectQueryBuilder<Invitation>,
      ),
    };

    organizationsRepository = {
      findOne: jest.fn<
        Promise<Organization | null>,
        [FindOneOptions<Organization>]
      >(() =>
        Promise.resolve({ id: 'org-1', deletedAt: null } as Organization),
      ),
    };

    membershipService = {
      isActiveMemberByEmail: jest.fn().mockResolvedValue(false),
      isActiveMember: jest.fn().mockResolvedValue(false),
      createMembership: jest.fn<
        Promise<OrganizationMember>,
        [string, string, OrganizationRole]
      >(() =>
        Promise.resolve({ id: 'member-1' } as unknown as OrganizationMember),
      ),
      getMember: jest.fn().mockResolvedValue({
        id: 'member-1',
        organizationId: 'org-1',
        userId: 'user-2',
        role: OrganizationRole.MEMBER,
        email: 'jane@example.com',
        displayName: 'Jane',
        avatarUrl: null,
        createdAt: new Date('2026-01-15T00:00:00.000Z'),
        updatedAt: new Date('2026-01-15T00:00:00.000Z'),
      }),
    };

    invitationMailer = {
      sendInvitationEmail: jest.fn<void, [InvitationEmailPayload]>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        {
          provide: getRepositoryToken(Invitation),
          useValue: invitationsRepository,
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: organizationsRepository,
        },
        {
          provide: OrganizationMembershipService,
          useValue: membershipService,
        },
        {
          provide: DevelopmentInvitationMailer,
          useValue: invitationMailer,
        },
      ],
    }).compile();

    service = module.get(InvitationsService);
  });

  it('creates a pending invitation with a hashed token and a default role', async () => {
    const result = await service.createInvitation(
      'org-1',
      'user-1',
      createDto({ email: '  Jane@Example.COM ' }),
    );

    expect(membershipService.isActiveMemberByEmail).toHaveBeenCalledWith(
      'org-1',
      'jane@example.com',
    );

    const created = invitationsRepository.create.mock.calls[0][0];
    expect(created).toMatchObject({
      organizationId: 'org-1',
      email: 'jane@example.com',
      role: OrganizationRole.MEMBER,
      status: 'pending',
      invitedByUserId: 'user-1',
    });
    expect(created.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(created.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(created.expiresAt.getTime()).toBeLessThanOrEqual(
      Date.now() + INVITATION_TTL_MS,
    );

    expect(invitationMailer.sendInvitationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        email: 'jane@example.com',
        role: OrganizationRole.MEMBER,
        invitedByUserId: 'user-1',
      }),
    );

    expect(result).toMatchObject({
      organizationId: 'org-1',
      email: 'jane@example.com',
      role: OrganizationRole.MEMBER,
      status: 'pending',
      invitedByUserId: 'user-1',
    });
    expect(result).not.toHaveProperty('token');
    expect(result).not.toHaveProperty('tokenHash');
  });

  it('honors an explicitly requested assignable role', async () => {
    await service.createInvitation(
      'org-1',
      'user-1',
      createDto({ email: 'jane@example.com', role: OrganizationRole.ADMIN }),
    );

    expect(invitationsRepository.create.mock.calls[0][0].role).toBe(
      OrganizationRole.ADMIN,
    );
  });

  it('sends the raw token to the mailer but never stores it', async () => {
    await service.createInvitation(
      'org-1',
      'user-1',
      createDto({ email: 'jane@example.com' }),
    );

    const rawToken =
      invitationMailer.sendInvitationEmail.mock.calls[0][0].token;

    expect(rawToken).toEqual(expect.any(String));
    expect(invitationsRepository.create.mock.calls[0][0].tokenHash).not.toBe(
      rawToken,
    );
  });

  it('rejects inviting an email that is already an active member', async () => {
    membershipService.isActiveMemberByEmail.mockResolvedValue(true);

    await expect(
      service.createInvitation(
        'org-1',
        'user-1',
        createDto({ email: 'jane@example.com' }),
      ),
    ).rejects.toMatchObject({ code: ErrorCode.CONFLICT });

    expect(invitationsRepository.save).not.toHaveBeenCalled();
    expect(invitationMailer.sendInvitationEmail).not.toHaveBeenCalled();
  });

  it('rejects a second pending invitation for the same email', async () => {
    queryBuilder.getOne.mockResolvedValue(createInvitation());

    await expect(
      service.createInvitation(
        'org-1',
        'user-1',
        createDto({ email: 'jane@example.com' }),
      ),
    ).rejects.toMatchObject({ code: ErrorCode.CONFLICT });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'invitation.status = :status',
      { status: 'pending' },
    );
    expect(invitationsRepository.save).not.toHaveBeenCalled();
  });

  it('creates the membership and marks the invitation accepted', async () => {
    const token = 'raw-token-value-for-accept';
    invitationsRepository.findOne.mockResolvedValue(
      createInvitation({ tokenHash: hashInvitationToken(token) }),
    );

    const result = await service.acceptInvitation(
      { id: 'user-2', email: 'Jane@Example.com' },
      createAcceptDto(token),
    );

    expect(invitationsRepository.findOne).toHaveBeenCalledWith({
      where: { tokenHash: hashInvitationToken(token) },
    });
    expect(membershipService.createMembership).toHaveBeenCalledWith(
      'org-1',
      'user-2',
      OrganizationRole.MEMBER,
    );
    expect(invitationsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'invite-1', status: 'accepted' }),
    );
    expect(result.invitation.status).toBe('accepted');
    expect(result.membership).toMatchObject({
      organizationId: 'org-1',
      userId: 'user-2',
      role: OrganizationRole.MEMBER,
    });
  });

  it('grants the role stored on the invitation without remapping it', async () => {
    const token = 'raw-token-value-for-accept';
    invitationsRepository.findOne.mockResolvedValue(
      createInvitation({
        tokenHash: hashInvitationToken(token),
        role: OrganizationRole.ADMIN,
      }),
    );

    await service.acceptInvitation(
      { id: 'user-2', email: 'jane@example.com' },
      createAcceptDto(token),
    );

    expect(membershipService.createMembership).toHaveBeenCalledWith(
      'org-1',
      'user-2',
      OrganizationRole.ADMIN,
    );
  });

  it('throws not found for an unknown token', async () => {
    invitationsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.acceptInvitation(
        { id: 'user-2', email: 'jane@example.com' },
        createAcceptDto('unknown-token'),
      ),
    ).rejects.toMatchObject({ code: ErrorCode.RESOURCE_NOT_FOUND });

    expect(membershipService.createMembership).not.toHaveBeenCalled();
  });

  it('rejects a pending invitation that is past its TTL', async () => {
    invitationsRepository.findOne.mockResolvedValue(
      createInvitation({ expiresAt: new Date(Date.now() - 1000) }),
    );

    await expect(
      service.acceptInvitation(
        { id: 'user-2', email: 'jane@example.com' },
        createAcceptDto('raw-token-value-for-accept'),
      ),
    ).rejects.toMatchObject({ code: ErrorCode.BAD_REQUEST });

    expect(membershipService.createMembership).not.toHaveBeenCalled();
  });

  it('rejects a revoked invitation', async () => {
    invitationsRepository.findOne.mockResolvedValue(
      createInvitation({ status: 'revoked' }),
    );

    await expect(
      service.acceptInvitation(
        { id: 'user-2', email: 'jane@example.com' },
        createAcceptDto('raw-token-value-for-accept'),
      ),
    ).rejects.toMatchObject({ code: ErrorCode.BAD_REQUEST });

    expect(membershipService.createMembership).not.toHaveBeenCalled();
  });

  it('rejects an invitee whose email does not match', async () => {
    invitationsRepository.findOne.mockResolvedValue(createInvitation());

    await expect(
      service.acceptInvitation(
        { id: 'user-2', email: 'mallory@example.com' },
        createAcceptDto('raw-token-value-for-accept'),
      ),
    ).rejects.toMatchObject({ code: ErrorCode.FORBIDDEN });

    expect(membershipService.createMembership).not.toHaveBeenCalled();
  });

  it('rejects accepting without an authenticated email', async () => {
    await expect(
      service.acceptInvitation(
        { id: 'user-2' },
        createAcceptDto('raw-token-value-for-accept'),
      ),
    ).rejects.toMatchObject({ code: ErrorCode.UNAUTHORIZED });

    expect(invitationsRepository.findOne).not.toHaveBeenCalled();
  });

  it('rejects when the user already joined the organization another way', async () => {
    invitationsRepository.findOne.mockResolvedValue(createInvitation());
    membershipService.isActiveMember.mockResolvedValue(true);

    await expect(
      service.acceptInvitation(
        { id: 'user-2', email: 'jane@example.com' },
        createAcceptDto('raw-token-value-for-accept'),
      ),
    ).rejects.toMatchObject({ code: ErrorCode.CONFLICT });

    expect(membershipService.createMembership).not.toHaveBeenCalled();
  });

  it('is idempotent when the same user already accepted the invitation', async () => {
    invitationsRepository.findOne.mockResolvedValue(
      createInvitation({ status: 'accepted' }),
    );
    membershipService.isActiveMember.mockResolvedValue(true);

    const result = await service.acceptInvitation(
      { id: 'user-2', email: 'jane@example.com' },
      createAcceptDto('raw-token-value-for-accept'),
    );

    expect(membershipService.createMembership).not.toHaveBeenCalled();
    expect(invitationsRepository.save).not.toHaveBeenCalled();
    expect(result.invitation.status).toBe('accepted');
    expect(result.membership.userId).toBe('user-2');
  });

  it('conflicts when the invitation was accepted but the membership is gone', async () => {
    invitationsRepository.findOne.mockResolvedValue(
      createInvitation({ status: 'accepted' }),
    );
    membershipService.isActiveMember.mockResolvedValue(false);

    await expect(
      service.acceptInvitation(
        { id: 'user-2', email: 'jane@example.com' },
        createAcceptDto('raw-token-value-for-accept'),
      ),
    ).rejects.toMatchObject({ code: ErrorCode.CONFLICT });
  });

  it('refuses to join an archived organization', async () => {
    invitationsRepository.findOne.mockResolvedValue(createInvitation());
    organizationsRepository.findOne.mockResolvedValue({
      id: 'org-1',
      deletedAt: new Date('2026-02-01T00:00:00.000Z'),
    } as Organization);

    await expect(
      service.acceptInvitation(
        { id: 'user-2', email: 'jane@example.com' },
        createAcceptDto('raw-token-value-for-accept'),
      ),
    ).rejects.toMatchObject({ code: ErrorCode.TENANT_ORGANIZATION_FORBIDDEN });

    expect(membershipService.createMembership).not.toHaveBeenCalled();
  });

  it('revokes a pending invitation', async () => {
    invitationsRepository.findOne.mockResolvedValue(createInvitation());

    const result = await service.revokeInvitation('org-1', 'invite-1');

    expect(invitationsRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'invite-1', organizationId: 'org-1' },
    });
    expect(invitationsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'invite-1', status: 'revoked' }),
    );
    expect(result.status).toBe('revoked');
  });

  it('is idempotent for an already revoked invitation', async () => {
    invitationsRepository.findOne.mockResolvedValue(
      createInvitation({ status: 'revoked' }),
    );

    const result = await service.revokeInvitation('org-1', 'invite-1');

    expect(result.status).toBe('revoked');
    expect(invitationsRepository.save).not.toHaveBeenCalled();
  });

  it('is idempotent for an expired pending invitation', async () => {
    invitationsRepository.findOne.mockResolvedValue(
      createInvitation({ expiresAt: new Date(Date.now() - 1000) }),
    );

    const result = await service.revokeInvitation('org-1', 'invite-1');

    expect(result.status).toBe('expired');
    expect(invitationsRepository.save).not.toHaveBeenCalled();
  });

  it('refuses to revoke an accepted invitation', async () => {
    invitationsRepository.findOne.mockResolvedValue(
      createInvitation({ status: 'accepted' }),
    );

    await expect(
      service.revokeInvitation('org-1', 'invite-1'),
    ).rejects.toMatchObject({ code: ErrorCode.CONFLICT });

    expect(invitationsRepository.save).not.toHaveBeenCalled();
  });

  it('throws not found for an invitation outside the active organization', async () => {
    invitationsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.revokeInvitation('org-1', 'missing'),
    ).rejects.toMatchObject({ code: ErrorCode.RESOURCE_NOT_FOUND });
  });

  it('ignores derived-expired invites when checking for duplicates', async () => {
    await service.createInvitation(
      'org-1',
      'user-1',
      createDto({ email: 'jane@example.com' }),
    );

    const expiryGuard = queryBuilder.andWhere.mock.calls.find(
      ([clause]) => clause === 'invitation.expiresAt > :now',
    );

    expect(expiryGuard).toBeDefined();
    expect(expiryGuard?.[1].now).toBeInstanceOf(Date);
    expect(invitationsRepository.save).toHaveBeenCalled();
  });

  it('lists pending invitations by default', async () => {
    invitationsRepository.findAndCount.mockResolvedValue([
      [createInvitation()],
      1,
    ]);

    const result = await service.listInvitations('org-1', {});

    expect(invitationsRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org-1', status: 'pending' },
      }),
    );
    expect(result.items[0]).toMatchObject({
      email: 'jane@example.com',
      role: OrganizationRole.MEMBER,
      status: 'pending',
    });
    expect(result.pagination.total).toBe(1);
  });

  it('derives expired status for an overdue pending invite', async () => {
    const expiredInvitation = createInvitation({
      expiresAt: new Date(Date.now() - 1000),
    });
    invitationsRepository.findAndCount.mockResolvedValue([
      [expiredInvitation],
      1,
    ]);

    const result = await service.listInvitations('org-1', {});

    expect(result.items[0].status).toBe('expired');
  });

  it('filters by an explicit status', async () => {
    invitationsRepository.findAndCount.mockResolvedValue([
      [createInvitation()],
      1,
    ]);

    await service.listInvitations('org-1', { status: 'accepted' });

    expect(invitationsRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org-1', status: 'accepted' },
      }),
    );
  });
});
