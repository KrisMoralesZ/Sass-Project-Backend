import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { OrganizationRole } from '@organizations/enums/organization-role.enum';
import { UpdateOrganizationMemberRoleDto } from './update-organization-member-role.dto';

function validate(payload: Record<string, unknown>) {
  return validateSync(
    plainToInstance(UpdateOrganizationMemberRoleDto, payload),
  );
}

describe('UpdateOrganizationMemberRoleDto', () => {
  it.each([
    OrganizationRole.OWNER,
    OrganizationRole.ADMIN,
    OrganizationRole.MEMBER,
    OrganizationRole.VIEWER,
  ])('accepts the role %s', (role) => {
    expect(validate({ role })).toHaveLength(0);
  });

  it('rejects a missing role', () => {
    const errors = validate({});

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('role');
  });

  it('rejects a role outside the base catalog', () => {
    const errors = validate({ role: 'GUEST' });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('role');
  });
});
