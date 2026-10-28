/**
 * Invitation emails are stored and compared normalized so duplicate detection
 * and accept-time matching match how `User.email` is persisted on registration.
 *
 * @see ../../../../docs/organization-invitations-v1.md
 */
export function normalizeInvitationEmail(email: string): string {
  return email.trim().toLowerCase();
}
