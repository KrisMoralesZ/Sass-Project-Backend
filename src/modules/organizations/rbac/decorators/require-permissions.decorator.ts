import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { OrganizationPermission } from '@organizations/permissions/organization-permission.enum';
import { REQUIRED_PERMISSIONS_KEY } from '../constants/rbac-metadata.constants';
import { PermissionsGuard } from '../guards/permissions.guard';

/**
 * Requires the caller’s organization role to include every listed permission.
 */
export const RequirePermissions = (
  ...permissions: OrganizationPermission[]
) =>
  applyDecorators(
    SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions),
    UseGuards(PermissionsGuard),
  );
