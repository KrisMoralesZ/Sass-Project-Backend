import { Injectable } from '@nestjs/common';
import { AppException, ErrorCode } from '@common/errors';
import { OrganizationMembershipService } from '@organizations/services/organization-membership.service';
import { AuthenticatedUser } from './interfaces/tenant-context.interface';

@Injectable()
export class TenantMembershipValidator {
  constructor(
    private readonly organizationMembershipService: OrganizationMembershipService,
  ) {}

  /**
   * Ensures the authenticated user is an active member of the organization
   * before tenant context may be accepted for the request.
   */
  async assertMembership(
    user: AuthenticatedUser | undefined,
    organizationId: string,
  ): Promise<void> {
    if (!user?.id) {
      throw AppException.unauthorized(
        'Authentication is required to use organization context.',
      );
    }

    const isMember = await this.organizationMembershipService.isActiveMember(
      user.id,
      organizationId,
    );
    if (!isMember) {
      throw AppException.forbidden(
        ErrorCode.TENANT_ORGANIZATION_FORBIDDEN,
        'You do not have access to this organization.',
      );
    }
  }
}
