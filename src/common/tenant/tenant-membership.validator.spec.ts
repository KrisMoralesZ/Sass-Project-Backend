import { Test, TestingModule } from '@nestjs/testing';
import { ErrorCode } from '@common/errors/error-code.enum';
import { OrganizationMembershipService } from '@organizations/services/organization-membership.service';
import { TenantMembershipValidator } from './tenant-membership.validator';

describe('TenantMembershipValidator', () => {
  let validator: TenantMembershipValidator;
  let organizationMembershipService: jest.Mocked<
    Pick<OrganizationMembershipService, 'isActiveMember'>
  >;

  beforeEach(async () => {
    organizationMembershipService = {
      isActiveMember: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantMembershipValidator,
        {
          provide: OrganizationMembershipService,
          useValue: organizationMembershipService,
        },
      ],
    }).compile();

    validator = module.get(TenantMembershipValidator);
  });

  it('allows access when the user belongs to an active organization', async () => {
    organizationMembershipService.isActiveMember.mockResolvedValue(true);

    await expect(
      validator.assertMembership({ id: 'user-1' }, 'org-1'),
    ).resolves.toBeUndefined();
  });

  it('rejects access when the user is not a member', async () => {
    organizationMembershipService.isActiveMember.mockResolvedValue(false);

    await expect(
      validator.assertMembership({ id: 'user-1' }, 'org-1'),
    ).rejects.toMatchObject({
      code: ErrorCode.TENANT_ORGANIZATION_FORBIDDEN,
    });
  });

  it('rejects access when the organization is archived', async () => {
    organizationMembershipService.isActiveMember.mockResolvedValue(false);

    await expect(
      validator.assertMembership({ id: 'user-1' }, 'org-archived'),
    ).rejects.toMatchObject({
      code: ErrorCode.TENANT_ORGANIZATION_FORBIDDEN,
    });
  });
});
