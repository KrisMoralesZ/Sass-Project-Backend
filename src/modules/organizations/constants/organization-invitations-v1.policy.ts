import { OrganizationRole } from '@organizations/enums/organization-role.enum';

/**
 * v1 organization invitation policy.
 *
 * @see ../../../../docs/organization-invitations-v1.md
 */
export const INVITATION_STATUSES = [
  'pending',
  'accepted',
  'revoked',
  'expired',
] as const;

export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const INVITATION_DEFAULT_ROLE = OrganizationRole.MEMBER;

export const INVITATION_ASSIGNABLE_ROLES = [
  OrganizationRole.OWNER,
  OrganizationRole.ADMIN,
  OrganizationRole.MEMBER,
  OrganizationRole.VIEWER,
] as const;

export type InvitationAssignableRole =
  (typeof INVITATION_ASSIGNABLE_ROLES)[number];

/** 7 days in milliseconds. */
export const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const ORGANIZATION_INVITATIONS_V1_POLICY = {
  statuses: INVITATION_STATUSES,
  defaultRole: INVITATION_DEFAULT_ROLE,
  assignableRoles: INVITATION_ASSIGNABLE_ROLES,
  ttlMs: INVITATION_TTL_MS,
  /** Raw tokens are never stored; persist SHA-256(token) only. */
  hashTokenAtRest: true,
  /** Accept requires a signed-in user; it does not use tenant context. */
  acceptRequiresAuthentication: true,
  acceptRequiresMatchingEmail: true,
} as const;

export type OrganizationInvitationsV1Policy =
  typeof ORGANIZATION_INVITATIONS_V1_POLICY;

export function isInvitationStatus(value: unknown): value is InvitationStatus {
  return (
    typeof value === 'string' &&
    (INVITATION_STATUSES as readonly string[]).includes(value)
  );
}

export function isAssignableInviteRole(
  value: unknown,
): value is InvitationAssignableRole {
  return (
    typeof value === 'string' &&
    (INVITATION_ASSIGNABLE_ROLES as readonly string[]).includes(value)
  );
}

export function getInvitationTtlMs(): number {
  return ORGANIZATION_INVITATIONS_V1_POLICY.ttlMs;
}

export function getInvitationExpiresAt(from = new Date()): Date {
  return new Date(from.getTime() + getInvitationTtlMs());
}
