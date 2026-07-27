import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppException, ErrorCode } from '@common/errors';
import { OPTIONAL_ORGANIZATION_KEY } from '@common/tenant/constants/tenant-metadata.constants';
import { ORGANIZATION_ID_HEADER } from '@common/tenant/constants/tenant.constants';
import { TenantContextResolver } from '@common/tenant/tenant-context.resolver';
import { TenantMembershipValidator } from '@common/tenant/tenant-membership.validator';
import { RequestWithTenantContext } from '@common/tenant/types/request-with-tenant-context.type';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantContextResolver: TenantContextResolver,
    private readonly tenantMembershipValidator: TenantMembershipValidator,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isOptional = this.reflector.getAllAndOverride<boolean>(
      OPTIONAL_ORGANIZATION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isOptional) {
      // Optional routes never accept tenant context; they are user-scoped or public.
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<RequestWithTenantContext>();

    // Re-resolve after auth so request.user.organizationId is considered.
    const organizationId =
      this.tenantContextResolver.resolve(request) ??
      request.resolvedOrganizationId;

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

    this.acceptTenantContext(request, organizationId);

    return true;
  }

  private acceptTenantContext(
    request: RequestWithTenantContext,
    organizationId: string,
  ): void {
    request.resolvedOrganizationId = organizationId;
    request.tenantContext = { organizationId };
  }
}
