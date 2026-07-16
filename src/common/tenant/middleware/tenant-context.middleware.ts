import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { TenantContextResolver } from '../tenant-context.resolver';
import { RequestWithTenantContext } from '../types/request-with-tenant-context.type';

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
      request.tenantContext = { organizationId };
    }

    next();
  }
}
