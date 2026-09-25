import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { INVITATION_DEFAULT_ROLE } from '@organizations/constants/organization-invitations-v1.policy';
import { OrganizationRole } from '@organizations/enums/organization-role.enum';
import { CreateInvitationDto } from './create-invitation.dto';

function createDto(payload: Record<string, unknown>): CreateInvitationDto {
  return plainToInstance(CreateInvitationDto, payload);
}

function validate(payload: Record<string, unknown>) {
  return validateSync(createDto(payload));
}

describe('CreateInvitationDto', () => {
  it('accepts an email alone', () => {
    expect(validate({ email: 'jane@example.com' })).toHaveLength(0);
  });

  it('defaults the role to MEMBER when omitted', () => {
    expect(createDto({ email: 'jane@example.com' }).role).toBe(
      INVITATION_DEFAULT_ROLE,
    );
    expect(INVITATION_DEFAULT_ROLE).toBe(OrganizationRole.MEMBER);
  });

  it.each([
    OrganizationRole.OWNER,
    OrganizationRole.ADMIN,
    OrganizationRole.MEMBER,
    OrganizationRole.VIEWER,
  ])('accepts the assignable role %s', (role) => {
    expect(validate({ email: 'jane@example.com', role })).toHaveLength(0);
  });

  it('rejects a role outside the assignable catalog', () => {
    const errors = validate({ email: 'jane@example.com', role: 'GUEST' });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('role');
  });

  it('rejects a missing or malformed email', () => {
    expect(validate({})).toHaveLength(1);
    expect(validate({ email: 'not-an-email' })).toHaveLength(1);
  });
});
