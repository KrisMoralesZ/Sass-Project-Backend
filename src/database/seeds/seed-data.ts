import { OrganizationRole } from '../../modules/organizations/enums/organization-role.enum';
import { OrganizationPlan } from '../../modules/organizations/enums/organization-plan.enum';

/**
 * Shared password for all development seed users.
 * Meets the app strong-password rules (upper, lower, digit, min 8).
 */
export const SEED_USER_PASSWORD = 'Password1';

export interface SeedUserDefinition {
  email: string;
  displayName: string;
  role: OrganizationRole;
}

export interface SeedOrganizationDefinition {
  name: string;
  slug: string;
  plan: OrganizationPlan;
}

/**
 * Demo organization used by membership seeds (task 3.2.3).
 */
export const SEED_ORGANIZATION: SeedOrganizationDefinition = {
  name: 'Acme Workspace',
  slug: 'acme-workspace',
  plan: OrganizationPlan.FREE,
};

/**
 * One user per base organization role so RBAC can be exercised locally.
 */
export const SEED_USERS: SeedUserDefinition[] = [
  {
    email: 'owner@acme.local',
    displayName: 'Ada Owner',
    role: OrganizationRole.OWNER,
  },
  {
    email: 'admin@acme.local',
    displayName: 'Bailey Admin',
    role: OrganizationRole.ADMIN,
  },
  {
    email: 'member@acme.local',
    displayName: 'Casey Member',
    role: OrganizationRole.MEMBER,
  },
  {
    email: 'viewer@acme.local',
    displayName: 'Dana Viewer',
    role: OrganizationRole.VIEWER,
  },
];
