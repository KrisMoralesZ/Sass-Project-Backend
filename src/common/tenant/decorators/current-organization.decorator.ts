import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithTenantContext } from '@common/tenant/types/request-with-tenant-context.type';

export const CurrentOrganization = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | undefined => {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithTenantContext>();

    return request.tenantContext?.organizationId;
  },
);
