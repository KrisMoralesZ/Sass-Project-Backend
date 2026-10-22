import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Invitation } from '../entities/invitation.entity';
import { OrganizationRole } from '../enums/organization-role.enum';
import { InvitationsService } from './invitations.service';

describe('InvitationsService', () => {
  let service: InvitationsService;
  let invitationsRepository: {
    findAndCount: jest.Mock;
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
    invitationsRepository = {
      findAndCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        {
          provide: getRepositoryToken(Invitation),
          useValue: invitationsRepository,
        },
      ],
    }).compile();

    service = module.get(InvitationsService);
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
