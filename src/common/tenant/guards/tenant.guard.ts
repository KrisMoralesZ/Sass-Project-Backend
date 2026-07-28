import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppException, ErrorCode } from '@common/errors';
import { OPTIONAL_ORGANIZATION_KEY } from '@common/tenant/constants/tenant-metadata.constants';
import { ORGANIZATION_ID_HEADER } from '@common/tenant/constants/tenant.constants';
import { TenantMembershipValidator } from '@common/tenant/tenant-membership.validator';
import { RequestWithTenantContext } from '@common/tenant/types/request-with-tenant-context.type';

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

    const request = context
      .switchToHttp()
      .getRequest<RequestWithTenantContext>();
    const organizationId = request.tenantContext?.organizationId;

    if (!organizationId) {
      throw AppException.badRequest(
        ErrorCode.TENANT_ORGANIZATION_REQUIRED,
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
