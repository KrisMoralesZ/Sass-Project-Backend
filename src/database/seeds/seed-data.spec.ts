import {
  ORGANIZATION_ROLES,
  OrganizationRole,
} from '../../modules/organizations/enums/organization-role.enum';
import { SEED_ORGANIZATION, SEED_USERS, SEED_USER_PASSWORD } from './seed-data';

describe('seed-data', () => {
  it('seeds one membership per base organization role', () => {
    const roles = SEED_USERS.map((user) => user.role);

    expect(roles).toEqual(expect.arrayContaining([...ORGANIZATION_ROLES]));
    expect(new Set(roles).size).toBe(ORGANIZATION_ROLES.length);
  });

  it('defines a stable demo organization slug', () => {
    expect(SEED_ORGANIZATION.slug).toBe('acme-workspace');
  });

  it('uses a password that satisfies strong-password rules', () => {
    expect(SEED_USER_PASSWORD).toMatch(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/,
    );
  });

  it('assigns OWNER to the owner seed user', () => {
    expect(SEED_USERS[0]?.role).toBe(OrganizationRole.OWNER);
  });
});
