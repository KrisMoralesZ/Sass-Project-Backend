import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
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
      throw new ForbiddenException(
        'You do not have access to this organization.',
      );
    }
  }

  protected async isMember(
    _userId: string,
    _organizationId: string,
  ): Promise<boolean> {
    // Organizations module will replace this with a real membership lookup.
    return true;
  }
}
