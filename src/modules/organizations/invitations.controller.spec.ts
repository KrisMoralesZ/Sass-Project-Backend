import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { ListInvitationsQueryDto } from './dto/list-invitations-query.dto';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './services/invitations.service';
import { OrganizationMembershipService } from './services/organization-membership.service';

describe('InvitationsController', () => {
  let controller: InvitationsController;
  let invitationsService: jest.Mocked<
    Pick<
      InvitationsService,
      | 'acceptInvitation'
      | 'createInvitation'
      | 'listInvitations'
      | 'revokeInvitation'
    >
  >;

  beforeEach(async () => {
    invitationsService = {
      acceptInvitation: jest.fn(),
      createInvitation: jest.fn(),
      listInvitations: jest.fn(),
      revokeInvitation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvitationsController],
      providers: [
        {
          provide: InvitationsService,
          useValue: invitationsService,
        },
        {
          provide: OrganizationMembershipService,
          useValue: {
            getActiveMembership: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(InvitationsController);
  });

  it('delegates creation to the invitations service', async () => {
    const dto = plainToInstance(CreateInvitationDto, {
      email: 'jane@example.com',
    });
    invitationsService.createInvitation.mockResolvedValue({
      id: 'invite-1',
      organizationId: 'org-1',
      email: 'jane@example.com',
      status: 'pending',
    } as never);

    await controller.create('org-1', { id: 'user-1' }, dto);

    expect(invitationsService.createInvitation).toHaveBeenCalledWith(
      'org-1',
      'user-1',
      dto,
    );
  });

  it('delegates revocation to the invitations service', async () => {
    invitationsService.revokeInvitation.mockResolvedValue({
      id: 'invite-1',
      organizationId: 'org-1',
      email: 'jane@example.com',
      status: 'revoked',
    } as never);

    await controller.revoke('org-1', 'invite-1');

    expect(invitationsService.revokeInvitation).toHaveBeenCalledWith(
      'org-1',
      'invite-1',
    );
  });

  it('delegates acceptance to the invitations service', async () => {
    const dto = plainToInstance(AcceptInvitationDto, {
      token: 'raw-token-value-for-accept',
    });
    const user = { id: 'user-2', email: 'jane@example.com' };
    invitationsService.acceptInvitation.mockResolvedValue({
      invitation: { id: 'invite-1', status: 'accepted' },
      membership: { id: 'member-1', organizationId: 'org-1' },
    } as never);

    await controller.accept(user, dto);

    expect(invitationsService.acceptInvitation).toHaveBeenCalledWith(user, dto);
  });

  it('delegates list to the invitations service', async () => {
    const query = plainToInstance(ListInvitationsQueryDto, {
      page: 1,
      limit: 20,
      status: 'pending',
    });
    invitationsService.listInvitations.mockResolvedValue({
      items: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });

    await controller.findAll('org-1', query);

    expect(invitationsService.listInvitations).toHaveBeenCalledWith(
      'org-1',
      query,
    );
  });
});
