import { Request } from 'express';
import {
  AuthenticatedUser,
  TenantContext,
} from '@common/tenant/interfaces/tenant-context.interface';

export type RequestWithTenantContext = Request & {
  tenantContext?: TenantContext;
  user?: AuthenticatedUser;
};
