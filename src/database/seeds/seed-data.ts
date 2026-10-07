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

export interface SeedInvitationDefinition {
  email: string;
  role: OrganizationRole;
  /**
   * Fixed raw token so local QA can open the accept URL without email.
   * Development only: it is hashed before storage, exactly like the API does.
   */
  token: string;
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

/**
 * Pending invitation for local QA of the invite + accept flow (task 3.3.8).
 *
 * The invitee is deliberately not a seed user: register (or sign up) with this
 * email and open the printed accept URL to join Acme Workspace.
 */
export const SEED_INVITATION: SeedInvitationDefinition = {
  email: 'invitee@acme.local',
  role: OrganizationRole.MEMBER,
  token: 'seed-invite-token-for-local-qa-0001',
};
