import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { OrganizationRole } from '@organizations/enums/organization-role.enum';
import { REQUIRED_MIN_ROLE_KEY } from '../constants/rbac-metadata.constants';
import { PermissionsGuard } from '../guards/permissions.guard';

/**
 * Requires the caller’s organization role to be at least `minimumRole`
 * (OWNER > ADMIN > MEMBER > VIEWER).
 */
export const RequireMinRole = (minimumRole: OrganizationRole) =>
  applyDecorators(
    SetMetadata(REQUIRED_MIN_ROLE_KEY, minimumRole),
    UseGuards(PermissionsGuard),
  );
