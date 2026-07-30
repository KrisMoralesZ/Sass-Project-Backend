/**
 * v1 organization membership policy.
 *
 * @see ../../../../docs/organization-membership-v1.md
 */
export const ORGANIZATION_MEMBERSHIP_V1_POLICY = {
  /** Users may belong to more than one organization in v1. */
  allowsMultipleMemberships: true,

  /** Each request operates in exactly one active organization context. */
  requiresExplicitActiveOrganization: true,

  /** No hard cap on memberships per user in v1. */
  maxOrganizationsPerUser: null,
} as const;

export type OrganizationMembershipV1Policy =
  typeof ORGANIZATION_MEMBERSHIP_V1_POLICY;

/**
 * Returns whether v1 allows a user to hold memberships in multiple organizations.
 */
export function supportsMultipleOrganizationMemberships(): boolean {
  return ORGANIZATION_MEMBERSHIP_V1_POLICY.allowsMultipleMemberships;
}

/**
 * Returns whether v1 requires clients to send an explicit active organization
 * per request for tenant-scoped routes.
 */
export function requiresExplicitActiveOrganization(): boolean {
  return ORGANIZATION_MEMBERSHIP_V1_POLICY.requiresExplicitActiveOrganization;
}

/**
 * Returns the configured membership cap for v1, or null when unlimited.
 */
export function getMaxOrganizationsPerUser(): number | null {
  return ORGANIZATION_MEMBERSHIP_V1_POLICY.maxOrganizationsPerUser;
}
