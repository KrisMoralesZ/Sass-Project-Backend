import { createHash } from 'node:crypto';
import {
  generateInvitationToken,
  hashInvitationToken,
  INVITATION_TOKEN_BYTES,
} from './invitation-token.util';

describe('invitation-token.util', () => {
  it('generates url-safe tokens with at least 32 bytes of entropy', () => {
    const token = generateInvitationToken();

    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(Buffer.from(token, 'base64url')).toHaveLength(
      INVITATION_TOKEN_BYTES,
    );
  });

  it('generates a unique token per call', () => {
    expect(generateInvitationToken()).not.toBe(generateInvitationToken());
  });

  it('hashes tokens as sha256 hex digests', () => {
    const token = generateInvitationToken();
    const expected = createHash('sha256').update(token, 'utf8').digest('hex');

    expect(hashInvitationToken(token)).toBe(expected);
    expect(hashInvitationToken(token)).toHaveLength(64);
  });

  it('produces different digests for different tokens', () => {
    expect(hashInvitationToken('token-one')).not.toBe(
      hashInvitationToken('token-two'),
    );
  });
});
