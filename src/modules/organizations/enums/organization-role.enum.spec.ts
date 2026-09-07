import {
  DEFAULT_ORGANIZATION_ROLE,
  ORGANIZATION_CREATOR_ROLE,
  ORGANIZATION_ROLES,
  ORGANIZATION_ROLE_DEFINITIONS,
  ORGANIZATION_ROLE_RANK,
  OrganizationRole,
  getOrganizationRoleDefinition,
  getOrganizationRoleRank,
  hasAtLeastOrganizationRole,
  isOrganizationRole,
} from './organization-role.enum';

describe('OrganizationRole', () => {
  it('defines the four base v1 roles', () => {
    expect(ORGANIZATION_ROLES).toEqual([
      OrganizationRole.OWNER,
      OrganizationRole.ADMIN,
      OrganizationRole.MEMBER,
      OrganizationRole.VIEWER,
    ]);
  });

  it('orders role ranks from owner down to viewer', () => {
    expect(ORGANIZATION_ROLE_RANK[OrganizationRole.OWNER]).toBeGreaterThan(
      ORGANIZATION_ROLE_RANK[OrganizationRole.ADMIN],
    );
    expect(ORGANIZATION_ROLE_RANK[OrganizationRole.ADMIN]).toBeGreaterThan(
      ORGANIZATION_ROLE_RANK[OrganizationRole.MEMBER],
    );
    expect(ORGANIZATION_ROLE_RANK[OrganizationRole.MEMBER]).toBeGreaterThan(
      ORGANIZATION_ROLE_RANK[OrganizationRole.VIEWER],
    );
  });

  it('provides definitions for every base role', () => {
    for (const role of ORGANIZATION_ROLES) {
      const definition = getOrganizationRoleDefinition(role);
      expect(definition.role).toBe(role);
      expect(definition.label.length).toBeGreaterThan(0);
      expect(definition.description.length).toBeGreaterThan(0);
      expect(definition.assignable).toBe(true);
      expect(definition.rank).toBe(getOrganizationRoleRank(role));
    }

    expect(Object.keys(ORGANIZATION_ROLE_DEFINITIONS)).toHaveLength(4);
  });

  it('validates organization role values', () => {
    expect(isOrganizationRole('OWNER')).toBe(true);
    expect(isOrganizationRole('GUEST')).toBe(false);
    expect(isOrganizationRole(null)).toBe(false);
  });

  it('compares roles with hasAtLeastOrganizationRole', () => {
    expect(
      hasAtLeastOrganizationRole(
        OrganizationRole.ADMIN,
        OrganizationRole.MEMBER,
      ),
    ).toBe(true);
    expect(
      hasAtLeastOrganizationRole(
        OrganizationRole.VIEWER,
        OrganizationRole.MEMBER,
      ),
    ).toBe(false);
    expect(
      hasAtLeastOrganizationRole(
        OrganizationRole.OWNER,
        OrganizationRole.OWNER,
      ),
    ).toBe(true);
  });

  it('defines creator and default membership roles', () => {
    expect(ORGANIZATION_CREATOR_ROLE).toBe(OrganizationRole.OWNER);
    expect(DEFAULT_ORGANIZATION_ROLE).toBe(OrganizationRole.MEMBER);
  });
});
