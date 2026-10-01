import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { SelectQueryBuilder } from 'typeorm';
import { ErrorCode } from '@common/errors/error-code.enum';
import { INVITATION_TTL_MS } from '../constants/organization-invitations-v1.policy';
import { CreateInvitationDto } from '../dto/create-invitation.dto';
import { Invitation } from '../entities/invitation.entity';
import { OrganizationRole } from '../enums/organization-role.enum';
import {
  DevelopmentInvitationMailer,
  type InvitationEmailPayload,
} from './development-invitation-mailer.service';
import { InvitationsService } from './invitations.service';
import { OrganizationMembershipService } from './organization-membership.service';

function createDto(payload: Record<string, unknown>): CreateInvitationDto {
  return plainToInstance(CreateInvitationDto, payload);
}

describe('InvitationsService', () => {
  let service: InvitationsService;
  let invitationsRepository: {
    create: jest.Mock<Invitation, [Partial<Invitation>]>;
    save: jest.Mock<Promise<Invitation>, [Invitation]>;
    findOne: jest.Mock<Invitation | null, [unknown]>;
    findAndCount: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let queryBuilder: {
    where: jest.Mock;
    andWhere: jest.Mock;
    getOne: jest.Mock;
  };
  let membershipService: {
    isActiveMemberByEmail: jest.Mock;
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
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };

    invitationsRepository = {
      create: jest.fn((data: Partial<Invitation>) => data as Invitation),
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
      findOne: jest.fn<Promise<Invitation | null>, [unknown]>(() =>
        Promise.resolve(null),
      ),
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn(
        () => queryBuilder as unknown as SelectQueryBuilder<Invitation>,
      ),
    };

    membershipService = {
      isActiveMemberByEmail: jest.fn().mockResolvedValue(false),
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
