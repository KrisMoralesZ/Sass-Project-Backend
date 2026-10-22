import { Test, TestingModule } from '@nestjs/testing';
import { InvitationsController } from './invitations.controller';
import { OrganizationMembershipService } from './services/organization-membership.service';
import { InvitationsService } from './services/invitations.service';

describe('InvitationsController', () => {
  let controller: InvitationsController;
  let invitationsService: jest.Mocked<
    Pick<InvitationsService, 'listInvitations'>
  >;

  beforeEach(async () => {
    invitationsService = {
      listInvitations: jest.fn(),
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

  it('delegates list to the invitations service', async () => {
    const query = { page: 1, limit: 20, status: 'pending' };
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
