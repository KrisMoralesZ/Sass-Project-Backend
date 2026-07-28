import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorCode } from '@common/errors/error-code.enum';
import { OrganizationMember } from '@organizations/entities/organization-member.entity';
import { TenantMembershipValidator } from './tenant-membership.validator';

describe('TenantMembershipValidator', () => {
  let validator: TenantMembershipValidator;
  let membersRepository: jest.Mocked<
    Pick<Repository<OrganizationMember>, 'findOne'>
  >;

  beforeEach(async () => {
    membersRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantMembershipValidator,
        {
          provide: getRepositoryToken(OrganizationMember),
          useValue: membersRepository,
        },
      ],
    }).compile();

    validator = module.get(TenantMembershipValidator);
  });

  it('allows access when the user belongs to the organization', async () => {
    membersRepository.findOne.mockResolvedValue({
      id: 'member-1',
    } as OrganizationMember);

    await expect(
      validator.assertMembership({ id: 'user-1' }, 'org-1'),
    ).resolves.toBeUndefined();
  });

  it('rejects access when the user is not a member', async () => {
    membersRepository.findOne.mockResolvedValue(null);

    await expect(
      validator.assertMembership({ id: 'user-1' }, 'org-1'),
    ).rejects.toMatchObject({
      code: ErrorCode.TENANT_ORGANIZATION_FORBIDDEN,
    });
  });
});
