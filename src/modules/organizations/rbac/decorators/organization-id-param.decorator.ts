import { SetMetadata } from '@nestjs/common';
import { ORGANIZATION_ID_PARAM_KEY } from '../constants/rbac-metadata.constants';

/**
 * Tells {@link PermissionsGuard} to resolve the organization id from a route
 * param (e.g. `id` on `PATCH /organizations/:id`) when tenant context is
 * absent, or to assert it matches tenant context when both are present.
 */
export const OrganizationIdParam = (paramName = 'id') =>
  SetMetadata(ORGANIZATION_ID_PARAM_KEY, paramName);
