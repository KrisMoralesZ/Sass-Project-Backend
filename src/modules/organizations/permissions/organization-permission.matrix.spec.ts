import {
  ORGANIZATION_ROLES,
  OrganizationRole,
} from '../enums/organization-role.enum';
import {
  ORGANIZATION_PERMISSIONS,
  OrganizationPermission,
  getOrganizationPermissionResource,
  isOrganizationPermission,
} from './organization-permission.enum';
import {
  ORGANIZATION_PERMISSION_MATRIX,
  getPermissionsForRole,
  listPermissionsForRole,
  roleHasEveryPermission,
  roleHasPermission,
  roleHasSomePermission,
} from './organization-permission.matrix';

describe('OrganizationPermission', () => {
  it('covers projects, boards, issues, invites, and settings', () => {
    const resources = new Set(
      ORGANIZATION_PERMISSIONS.map(getOrganizationPermissionResource),
    );

    expect([...resources].sort()).toEqual([
      'board',
      'invite',
      'issue',
      'project',
      'settings',
    ]);
  });

  it('validates permission values', () => {
    expect(isOrganizationPermission('project:create')).toBe(true);
    expect(isOrganizationPermission('project:unknown')).toBe(false);
  });
});

describe('ORGANIZATION_PERMISSION_MATRIX', () => {
  it('defines permissions for every base role', () => {
    for (const role of ORGANIZATION_ROLES) {
      expect(ORGANIZATION_PERMISSION_MATRIX[role].size).toBeGreaterThan(0);
    }
  });

  it('gives OWNER every permission', () => {
    expect(listPermissionsForRole(OrganizationRole.OWNER)).toEqual(
      [...ORGANIZATION_PERMISSIONS].sort(),
    );
  });

  it('keeps VIEWER read-only for work items and settings', () => {
    expect(
      roleHasEveryPermission(OrganizationRole.VIEWER, [
        OrganizationPermission.PROJECT_READ,
        OrganizationPermission.BOARD_READ,
        OrganizationPermission.ISSUE_READ,
        OrganizationPermission.SETTINGS_READ,
      ]),
    ).toBe(true);

    expect(
      roleHasSomePermission(OrganizationRole.VIEWER, [
        OrganizationPermission.PROJECT_CREATE,
        OrganizationPermission.ISSUE_UPDATE,
        OrganizationPermission.INVITE_CREATE,
        OrganizationPermission.SETTINGS_UPDATE,
      ]),
    ).toBe(false);
  });

  it('allows MEMBER to collaborate without managing invites or settings', () => {
    expect(
      roleHasEveryPermission(OrganizationRole.MEMBER, [
        OrganizationPermission.PROJECT_CREATE,
        OrganizationPermission.BOARD_UPDATE,
        OrganizationPermission.ISSUE_ASSIGN,
        OrganizationPermission.ISSUE_MOVE,
      ]),
    ).toBe(true);

    expect(
      roleHasPermission(
        OrganizationRole.MEMBER,
        OrganizationPermission.INVITE_CREATE,
      ),
    ).toBe(false);
    expect(
      roleHasPermission(
        OrganizationRole.MEMBER,
        OrganizationPermission.SETTINGS_UPDATE,
      ),
    ).toBe(false);
    expect(
      roleHasPermission(
        OrganizationRole.MEMBER,
        OrganizationPermission.PROJECT_DELETE,
      ),
    ).toBe(false);
  });

  it('allows ADMIN to manage invites, settings, and destructive project/board actions', () => {
    expect(
      roleHasEveryPermission(OrganizationRole.ADMIN, [
        OrganizationPermission.PROJECT_DELETE,
        OrganizationPermission.BOARD_DELETE,
        OrganizationPermission.INVITE_CREATE,
        OrganizationPermission.INVITE_REVOKE,
        OrganizationPermission.SETTINGS_UPDATE,
      ]),
    ).toBe(true);
  });

  it('returns the permission set for a role', () => {
    expect(
      getPermissionsForRole(OrganizationRole.VIEWER).has(
        OrganizationPermission.PROJECT_READ,
      ),
    ).toBe(true);
  });
});
