import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { TenantContextResolver } from '@common/tenant/tenant-context.resolver';
import { RequestWithTenantContext } from '@common/tenant/types/request-with-tenant-context.type';

/**
 * Resolves a candidate organization id for the request.
 * Tenant context is only accepted later by {@link TenantGuard} after membership validation.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly tenantContextResolver: TenantContextResolver) {}

  use(
    request: RequestWithTenantContext,
    _response: Response,
    next: NextFunction,
  ): void {
    const organizationId = this.tenantContextResolver.resolve(request);

    if (organizationId) {
      request.resolvedOrganizationId = organizationId;
    }

    next();
  }
}
