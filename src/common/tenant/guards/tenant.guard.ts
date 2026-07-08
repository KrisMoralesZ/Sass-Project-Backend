import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OPTIONAL_ORGANIZATION_KEY } from '../constants/tenant-metadata.constants';
import { ORGANIZATION_ID_HEADER } from '../constants/tenant.constants';
import { TenantMembershipValidator } from '../tenant-membership.validator';
import { RequestWithTenantContext } from '../types/request-with-tenant-context.type';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantMembershipValidator: TenantMembershipValidator,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isOptional = this.reflector.getAllAndOverride<boolean>(
      OPTIONAL_ORGANIZATION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isOptional) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithTenantContext>();
    const organizationId = request.tenantContext?.organizationId;

    if (!organizationId) {
      throw new BadRequestException(
        `Organization context is required. Provide the ${ORGANIZATION_ID_HEADER} header or a JWT with an organizationId claim.`,
      );
    }

    await this.tenantMembershipValidator.assertMembership(
      request.user,
      organizationId,
    );

    return true;
  }
}
