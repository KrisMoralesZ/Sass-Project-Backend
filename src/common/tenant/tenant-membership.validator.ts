import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrganizationMember } from '@organizations/entities/organization-member.entity';
import { AppException, ErrorCode } from '@common/errors';
import { AuthenticatedUser } from './interfaces/tenant-context.interface';
import { Repository } from 'typeorm';

@Injectable()
export class TenantMembershipValidator {
  constructor(
    @InjectRepository(OrganizationMember)
    private readonly membersRepository: Repository<OrganizationMember>,
  ) {}

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

  protected async isMember(
    userId: string,
    organizationId: string,
  ): Promise<boolean> {
    const membership = await this.membersRepository.findOne({
      where: { userId, organizationId },
    });

    return membership !== null;
  }
}
