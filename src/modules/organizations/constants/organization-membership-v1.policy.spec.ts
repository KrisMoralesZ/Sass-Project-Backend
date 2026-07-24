import {
  ORGANIZATION_MEMBERSHIP_V1_POLICY,
  getMaxOrganizationsPerUser,
  requiresExplicitActiveOrganization,
  supportsMultipleOrganizationMemberships,
} from './organization-membership-v1.policy';

describe('organization-membership-v1.policy', () => {
  it('allows users to belong to multiple organizations in v1', () => {
    expect(ORGANIZATION_MEMBERSHIP_V1_POLICY.allowsMultipleMemberships).toBe(
      true,
    );
    expect(supportsMultipleOrganizationMemberships()).toBe(true);
  });

  it('requires an explicit active organization per request', () => {
    expect(
      ORGANIZATION_MEMBERSHIP_V1_POLICY.requiresExplicitActiveOrganization,
    ).toBe(true);
    expect(requiresExplicitActiveOrganization()).toBe(true);
  });

  it('does not enforce a membership cap in v1', () => {
    expect(
      ORGANIZATION_MEMBERSHIP_V1_POLICY.maxOrganizationsPerUser,
    ).toBeNull();
    expect(getMaxOrganizationsPerUser()).toBeNull();
  });
});
