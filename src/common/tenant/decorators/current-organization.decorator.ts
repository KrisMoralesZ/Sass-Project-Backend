import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AppException, ErrorCode } from '@common/errors';
import { RequestWithTenantContext } from '@common/tenant/types/request-with-tenant-context.type';

/**
 * Reads the accepted organization id from `request.tenantContext`.
 *
 * Pass `{ required: true }` to throw when tenant context was not accepted
 * (should not happen on tenant-protected routes after TenantGuard).
 */
export const CurrentOrganization = createParamDecorator(
  (
    data: { required?: boolean } | undefined,
    context: ExecutionContext,
  ): string | undefined => {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithTenantContext>();

    const organizationId = request.tenantContext?.organizationId;

    if (!organizationId && data?.required) {
      throw AppException.badRequest(
        ErrorCode.TENANT_ORGANIZATION_REQUIRED,
        'Organization context is not set for this request.',
      );
    }

    return organizationId;
  },
);
