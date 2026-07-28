import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationMember } from '../entities/organization-member.entity';
import { OrganizationRole } from '../enums/organization-role.enum';
import { OrganizationMembershipService } from './organization-membership.service';

describe('OrganizationMembershipService', () => {
  let service: OrganizationMembershipService;
  let membersRepository: jest.Mocked<
    Pick<Repository<OrganizationMember>, 'create' | 'save' | 'findOne' | 'find'>
  >;

  beforeEach(async () => {
    membersRepository = {
      create: jest.fn((data) => data as OrganizationMember),
      save: jest.fn((entity) => Promise.resolve(entity as OrganizationMember)),
      findOne: jest.fn(),
      find: jest.fn(),
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
    } as OrganizationMember);

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
});
