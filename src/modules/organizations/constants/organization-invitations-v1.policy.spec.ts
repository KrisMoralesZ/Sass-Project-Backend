import { OrganizationRole } from '@organizations/enums/organization-role.enum';
import {
  INVITATION_ASSIGNABLE_ROLES,
  INVITATION_DEFAULT_ROLE,
  INVITATION_STATUSES,
  INVITATION_TTL_MS,
  ORGANIZATION_INVITATIONS_V1_POLICY,
  getInvitationExpiresAt,
  getInvitationTtlMs,
  isAssignableInviteRole,
  isInvitationStatus,
} from './organization-invitations-v1.policy';

describe('organization-invitations-v1.policy', () => {
  it('defines pending, accepted, revoked, and expired statuses', () => {
    expect(INVITATION_STATUSES).toEqual([
      'pending',
      'accepted',
      'revoked',
      'expired',
    ]);
    expect(isInvitationStatus('pending')).toBe(true);
    expect(isInvitationStatus('cancelled')).toBe(false);
  });

  it('defaults invite role to MEMBER and allows all four base roles', () => {
    expect(INVITATION_DEFAULT_ROLE).toBe(OrganizationRole.MEMBER);
    expect([...INVITATION_ASSIGNABLE_ROLES]).toEqual([
      OrganizationRole.OWNER,
      OrganizationRole.ADMIN,
      OrganizationRole.MEMBER,
      OrganizationRole.VIEWER,
    ]);
    expect(isAssignableInviteRole(OrganizationRole.OWNER)).toBe(true);
    expect(isAssignableInviteRole('GUEST')).toBe(false);
  });

  it('uses a 7-day TTL and hashes tokens at rest', () => {
    expect(INVITATION_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000);
    expect(getInvitationTtlMs()).toBe(INVITATION_TTL_MS);
    expect(ORGANIZATION_INVITATIONS_V1_POLICY.hashTokenAtRest).toBe(true);

    const from = new Date('2026-09-03T00:00:00.000Z');
    expect(getInvitationExpiresAt(from).toISOString()).toBe(
      '2026-09-10T00:00:00.000Z',
    );
  });

  it('requires an authenticated invitee whose email matches', () => {
    expect(
      ORGANIZATION_INVITATIONS_V1_POLICY.acceptRequiresAuthentication,
    ).toBe(true);
    expect(ORGANIZATION_INVITATIONS_V1_POLICY.acceptRequiresMatchingEmail).toBe(
      true,
    );
  });
});
