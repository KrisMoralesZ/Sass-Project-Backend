import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { OrganizationRole } from '@organizations/enums/organization-role.enum';
import { RequestWithTenantContext } from '@common/tenant/types/request-with-tenant-context.type';

/**
 * Reads the organization role attached by {@link PermissionsGuard}.
 */
export const CurrentOrganizationRole = createParamDecorator(
  (_data: unknown, context: ExecutionContext): OrganizationRole | undefined => {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithTenantContext>();

    return request.organizationMembership?.role;
  },
);
