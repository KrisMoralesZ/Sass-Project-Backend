import { Request } from 'express';
import {
  AuthenticatedUser,
  TenantContext,
} from '@common/tenant/interfaces/tenant-context.interface';

export type RequestWithTenantContext = Request & {
  /**
   * Candidate organization id resolved from user / header / JWT.
   * Not trusted until membership validation accepts it into `tenantContext`.
   */
  resolvedOrganizationId?: string;
  /** Active organization context accepted after membership validation. */
  tenantContext?: TenantContext;
  user?: AuthenticatedUser;
};
