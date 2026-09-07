import { OrganizationRole } from '@organizations/enums/organization-role.enum';

/**
 * Membership role context attached to the request after PermissionsGuard runs.
 */
export interface OrganizationMembershipContext {
  organizationId: string;
  userId: string;
  role: OrganizationRole;
}
