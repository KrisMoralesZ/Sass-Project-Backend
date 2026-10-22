import {
  type InvitationAssignableRole,
  type InvitationStatus,
} from '@organizations/constants/organization-invitations-v1.policy';

/**
 * Invitation resource returned by list.
 * Never exposes `token` or `tokenHash`.
 */
export interface InvitationResponse {
  id: string;
  organizationId: string;
  email: string;
  role: InvitationAssignableRole;
  status: InvitationStatus;
  invitedByUserId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
