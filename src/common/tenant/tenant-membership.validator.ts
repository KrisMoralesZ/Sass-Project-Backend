import { Injectable } from '@nestjs/common';
import { AppException, ErrorCode } from '@common/errors';
import { AuthenticatedUser } from './interfaces/tenant-context.interface';

@Injectable()
export class TenantMembershipValidator {
  async assertMembership(
    user: AuthenticatedUser | undefined,
    organizationId: string,
  ): Promise<void> {
    if (!user?.id) {
      return;
    }

    const isMember = await this.isMember(user.id, organizationId);
    if (!isMember) {
      throw AppException.forbidden(
        ErrorCode.TENANT_ORGANIZATION_FORBIDDEN,
        'You do not have access to this organization.',
      );
    }
  }

  protected isMember(userId: string, organizationId: string): Promise<boolean> {
    void userId;
    void organizationId;
    // Organizations module will replace this with a real membership lookup.
    return Promise.resolve(true);
  }
}
