import { normalizeInvitationEmail } from './invitation-email.util';

describe('invitation-email.util', () => {
  it('trims and lowercases invitee emails', () => {
    expect(normalizeInvitationEmail('  Jane@Example.COM ')).toBe(
      'jane@example.com',
    );
  });

  it('leaves already normalized emails unchanged', () => {
    expect(normalizeInvitationEmail('jane@example.com')).toBe(
      'jane@example.com',
    );
  });
});
