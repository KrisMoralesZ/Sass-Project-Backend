/**
 * Organization-scoped permissions for v1 RBAC.
 *
 * Resources covered by task 3.2.2: projects, boards, issues, invites, settings.
 *
 * @see ../../../../docs/organization-permissions-v1.md
 */
export enum OrganizationPermission {
  // Projects
  PROJECT_CREATE = 'project:create',
  PROJECT_READ = 'project:read',
  PROJECT_UPDATE = 'project:update',
  PROJECT_DELETE = 'project:delete',

  // Boards
  BOARD_CREATE = 'board:create',
  BOARD_READ = 'board:read',
  BOARD_UPDATE = 'board:update',
  BOARD_DELETE = 'board:delete',

  // Issues
  ISSUE_CREATE = 'issue:create',
  ISSUE_READ = 'issue:read',
  ISSUE_UPDATE = 'issue:update',
  ISSUE_DELETE = 'issue:delete',
  ISSUE_ASSIGN = 'issue:assign',
  ISSUE_MOVE = 'issue:move',

  // Invites
  INVITE_CREATE = 'invite:create',
  INVITE_READ = 'invite:read',
  INVITE_REVOKE = 'invite:revoke',

  // Settings
  SETTINGS_READ = 'settings:read',
  SETTINGS_UPDATE = 'settings:update',
}

export const ORGANIZATION_PERMISSIONS = Object.values(
  OrganizationPermission,
) as OrganizationPermission[];

export type OrganizationPermissionResource =
  'project' | 'board' | 'issue' | 'invite' | 'settings';

export function getOrganizationPermissionResource(
  permission: OrganizationPermission,
): OrganizationPermissionResource {
  return permission.split(':')[0] as OrganizationPermissionResource;
}

export function isOrganizationPermission(
  value: unknown,
): value is OrganizationPermission {
  return (
    typeof value === 'string' &&
    (ORGANIZATION_PERMISSIONS as string[]).includes(value)
  );
}
