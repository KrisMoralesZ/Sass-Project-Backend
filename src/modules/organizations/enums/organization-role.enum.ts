/**
 * Base organization roles for v1 RBAC.
 *
 * Hierarchy (highest → lowest): OWNER > ADMIN > MEMBER > VIEWER
 *
 * @see ../../../../docs/organization-roles-v1.md
 */
export enum OrganizationRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

/**
 * Canonical ordered list of base roles from highest privilege to lowest.
 */
export const ORGANIZATION_ROLES = [
  OrganizationRole.OWNER,
  OrganizationRole.ADMIN,
  OrganizationRole.MEMBER,
  OrganizationRole.VIEWER,
] as const;

export type OrganizationRoleValue = (typeof ORGANIZATION_ROLES)[number];

/**
 * Numeric rank used for "at least role" comparisons.
 * Higher values mean more privilege.
 */
export const ORGANIZATION_ROLE_RANK: Record<OrganizationRole, number> = {
  [OrganizationRole.OWNER]: 400,
  [OrganizationRole.ADMIN]: 300,
  [OrganizationRole.MEMBER]: 200,
  [OrganizationRole.VIEWER]: 100,
};

export interface OrganizationRoleDefinition {
  role: OrganizationRole;
  rank: number;
  label: string;
  description: string;
  /** Whether this role may be assigned via invite/member-management flows. */
  assignable: boolean;
}

export const ORGANIZATION_ROLE_DEFINITIONS: Record<
  OrganizationRole,
  OrganizationRoleDefinition
> = {
  [OrganizationRole.OWNER]: {
    role: OrganizationRole.OWNER,
    rank: ORGANIZATION_ROLE_RANK[OrganizationRole.OWNER],
    label: 'Owner',
    description:
      'Full control of the organization, including billing placeholders, ownership transfer, and destructive actions.',
    assignable: true,
  },
  [OrganizationRole.ADMIN]: {
    role: OrganizationRole.ADMIN,
    rank: ORGANIZATION_ROLE_RANK[OrganizationRole.ADMIN],
    label: 'Admin',
    description:
      'Manages members, settings, and workspace configuration without transferring ownership.',
    assignable: true,
  },
  [OrganizationRole.MEMBER]: {
    role: OrganizationRole.MEMBER,
    rank: ORGANIZATION_ROLE_RANK[OrganizationRole.MEMBER],
    label: 'Member',
    description:
      'Creates and collaborates on projects, boards, and issues within the organization.',
    assignable: true,
  },
  [OrganizationRole.VIEWER]: {
    role: OrganizationRole.VIEWER,
    rank: ORGANIZATION_ROLE_RANK[OrganizationRole.VIEWER],
    label: 'Viewer',
    description:
      'Read-only access to organization resources; cannot mutate workspace data.',
    assignable: true,
  },
};

export function isOrganizationRole(value: unknown): value is OrganizationRole {
  return (
    typeof value === 'string' &&
    (ORGANIZATION_ROLES as readonly string[]).includes(value)
  );
}

export function getOrganizationRoleDefinition(
  role: OrganizationRole,
): OrganizationRoleDefinition {
  return ORGANIZATION_ROLE_DEFINITIONS[role];
}

export function getOrganizationRoleRank(role: OrganizationRole): number {
  return ORGANIZATION_ROLE_RANK[role];
}

/**
 * Returns true when `role` is at least as privileged as `minimumRole`.
 */
export function hasAtLeastOrganizationRole(
  role: OrganizationRole,
  minimumRole: OrganizationRole,
): boolean {
  return getOrganizationRoleRank(role) >= getOrganizationRoleRank(minimumRole);
}

/**
 * Default role assigned to invited/joined members when unspecified.
 */
export const DEFAULT_ORGANIZATION_ROLE = OrganizationRole.MEMBER;

/**
 * Role assigned to the user who creates an organization.
 */
export const ORGANIZATION_CREATOR_ROLE = OrganizationRole.OWNER;
