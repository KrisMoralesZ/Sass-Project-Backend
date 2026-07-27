import { Request } from 'express';
import {
  AuthenticatedUser,
  TenantContext,
  TenantOrganizationResolution,
} from '@common/tenant/interfaces/tenant-context.interface';

export type RequestWithTenantContext = Request & {
  /**
   * Candidate organization id resolved from header / user / JWT.
   * Not trusted until membership validation accepts it into `tenantContext`.
   */
  resolvedOrganizationId?: string;
  /**
   * Full resolution result from {@link TenantContextResolver.resolveDetailed}.
   */
  organizationResolution?: TenantOrganizationResolution;
  /** Active organization context accepted after membership validation. */
  tenantContext?: TenantContext;
  user?: AuthenticatedUser;
};
