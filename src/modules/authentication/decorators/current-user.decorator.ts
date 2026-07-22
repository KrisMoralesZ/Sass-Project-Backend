import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../../../common/tenant/interfaces/tenant-context.interface';
import { RequestWithTenantContext } from '../../../common/tenant/types/request-with-tenant-context.type';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithTenantContext>();

    return request.user as AuthenticatedUser;
  },
);
