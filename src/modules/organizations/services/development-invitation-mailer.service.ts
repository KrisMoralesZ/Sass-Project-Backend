import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { InvitationAssignableRole } from '@organizations/constants/organization-invitations-v1.policy';

/** Default origin for the SPA when `FRONTEND_ORIGIN` is not set. */
export const DEFAULT_FRONTEND_ORIGIN = 'http://localhost:5173';

/** Frontend route that consumes the invite token. */
export const INVITATION_ACCEPT_PATH = '/invites/accept';

export const INVITATION_EMAIL_SUBJECT = 'You have been invited to a workspace';

export interface InvitationEmailPayload {
  organizationId: string;
  /** Already normalized (trimmed + lowercased) by the invitation service. */
  email: string;
  role: InvitationAssignableRole;
  invitedByUserId: string;
  /** Raw token. It exists only in this call and the logged URL. */
  token: string;
  expiresAt: Date;
}

/**
 * Development-only email delivery stub (task 3.3.4).
 *
 * v1 has no SMTP provider: instead of sending mail it logs the accept URL so
 * local QA can follow the invite link. Swapping in a real transport later means
 * replacing this provider, not the invitation service.
 *
 * @see ../../../../docs/organization-invitations-v1.md
 */
@Injectable()
export class DevelopmentInvitationMailer {
  private readonly logger = new Logger(DevelopmentInvitationMailer.name);

  constructor(private readonly configService: ConfigService) {}

  buildAcceptUrl(token: string): string {
    const origin = this.configService
      .get<string>('frontendOrigin', DEFAULT_FRONTEND_ORIGIN)
      .replace(/\/+$/, '');

    return `${origin}${INVITATION_ACCEPT_PATH}?token=${encodeURIComponent(token)}`;
  }

  sendInvitationEmail(payload: InvitationEmailPayload): void {
    const acceptUrl = this.buildAcceptUrl(payload.token);
    const context = {
      message: 'organization invitation email (development stub)',
      organizationId: payload.organizationId,
      email: payload.email,
      role: payload.role,
      invitedByUserId: payload.invitedByUserId,
      subject: INVITATION_EMAIL_SUBJECT,
      expiresAt: payload.expiresAt.toISOString(),
      acceptUrl,
    };

    if (this.isProduction()) {
      this.logger.warn(
        JSON.stringify({
          ...context,
          message:
            'organization invitation email not delivered: no SMTP provider is configured (development stub)',
        }),
      );
      return;
    }

    this.logger.log(JSON.stringify(context));
  }

  private isProduction(): boolean {
    return (
      this.configService.get<string>('nodeEnv', 'development') === 'production'
    );
  }
}
