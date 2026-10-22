import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { AcceptInvitationDto } from './accept-invitation.dto';

function validate(payload: Record<string, unknown>) {
  return validateSync(plainToInstance(AcceptInvitationDto, payload));
}

describe('AcceptInvitationDto', () => {
  it('accepts an opaque token', () => {
    const token = 'kZ3vQ1sJ8xN0bW5yT7pR2mH4cA6dE9fG1iL3oP5sU7w';

    expect(validate({ token })).toHaveLength(0);
  });

  it('rejects a missing token', () => {
    const errors = validate({});

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('token');
  });

  it.each([
    ['non-string', 1234567890],
    ['too short', 'abc123'],
    ['too long', 'a'.repeat(256)],
  ])('rejects a token that is %s', (_case, token) => {
    expect(validate({ token })).toHaveLength(1);
  });

  it('carries no organization reference', () => {
    const dto = plainToInstance(AcceptInvitationDto, { token: 'a'.repeat(43) });

    expect(Object.keys(dto)).toEqual(['token']);
  });
});
