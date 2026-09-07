import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationRole } from './enums/organization-role.enum';
import { OrganizationMembersController } from './organization-members.controller';
import { OrganizationMembershipService } from './services/organization-membership.service';

describe('OrganizationMembersController', () => {
  let controller: OrganizationMembersController;
  let organizationMembershipService: jest.Mocked<
    Pick<OrganizationMembershipService, 'listMembers' | 'getMember'>
  >;

  beforeEach(async () => {
    organizationMembershipService = {
      listMembers: jest.fn(),
      getMember: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationMembersController],
      providers: [
        {
          provide: OrganizationMembershipService,
          useValue: organizationMembershipService,
        },
      ],
    }).compile();

    controller = module.get(OrganizationMembersController);
  });

  it('delegates list to the membership service', async () => {
    const query = { page: 1, limit: 20 };
    organizationMembershipService.listMembers.mockResolvedValue({
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

    expect(organizationMembershipService.listMembers).toHaveBeenCalledWith(
      'org-1',
      query,
    );
  });

  it('delegates detail to the membership service', async () => {
    organizationMembershipService.getMember.mockResolvedValue({
      id: 'member-1',
      organizationId: 'org-1',
      userId: 'user-1',
      role: OrganizationRole.MEMBER,
      email: 'member@company.com',
      displayName: 'Member',
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await controller.findOne('org-1', 'user-1');

    expect(organizationMembershipService.getMember).toHaveBeenCalledWith(
      'org-1',
      'user-1',
    );
  });
});
