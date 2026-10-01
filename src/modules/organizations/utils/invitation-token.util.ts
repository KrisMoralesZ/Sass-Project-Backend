import { createHash, randomBytes } from 'node:crypto';

/** Random bytes per invite token (v1 policy: at least 32 bytes). */
export const INVITATION_TOKEN_BYTES = 32;

/**
 * Generates an opaque, URL-safe invite token (base64url of 32 random bytes).
 *
 * The raw token exists only in the accept URL handed to the mailer; the service
 * persists its hash instead.
 *
 * @see ../../../../docs/organization-invitations-v1.md
 */
export function generateInvitationToken(): string {
  return randomBytes(INVITATION_TOKEN_BYTES).toString('base64url');
}

/**
 * SHA-256 hex digest of a raw invite token. Invitations are always looked up by
 * this digest, never by the raw token.
 */
export function hashInvitationToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}
