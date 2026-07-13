import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { AppException, ErrorCode } from '../errors';
import { TenantContext } from './interfaces/tenant-context.interface';
import type { RequestWithTenantContext } from './types/request-with-tenant-context.type';

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  private get requestWithTenant(): RequestWithTenantContext {
    return this.request as RequestWithTenantContext;
  }

  setOrganizationId(organizationId: string): void {
    this.requestWithTenant.tenantContext = { organizationId };
  }

  getOrganizationId(): string | undefined {
    return this.requestWithTenant.tenantContext?.organizationId;
  }

  getContext(): TenantContext | undefined {
    return this.requestWithTenant.tenantContext;
  }

  hasOrganization(): boolean {
    return Boolean(this.requestWithTenant.tenantContext?.organizationId);
  }

  requireOrganizationId(): string {
    const organizationId = this.getOrganizationId();
    if (!organizationId) {
      throw AppException.badRequest(
        ErrorCode.TENANT_ORGANIZATION_REQUIRED,
        'Organization context is not set for this request.',
      );
    }

    return organizationId;
  }
}
