import { InvitationResponse } from './invitation-response.interface';
import { OrganizationMemberResponse } from './organization-member-response.interface';

/**
 * Result of `POST /invites/accept`.
 *
 * The organization comes from the invitation, never from tenant context, so the
 * client can add `membership.organizationId` to its workspace switcher and
 * optionally make it the active organization on the next request.
 */
export interface AcceptInvitationResponse {
  invitation: InvitationResponse;
  membership: OrganizationMemberResponse;
}
