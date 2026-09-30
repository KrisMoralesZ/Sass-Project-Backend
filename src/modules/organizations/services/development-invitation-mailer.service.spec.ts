import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrganizationRole } from '../enums/organization-role.enum';
import {
  DEFAULT_FRONTEND_ORIGIN,
  DevelopmentInvitationMailer,
  INVITATION_ACCEPT_PATH,
  INVITATION_EMAIL_SUBJECT,
  type InvitationEmailPayload,
} from './development-invitation-mailer.service';

describe('DevelopmentInvitationMailer', () => {
  const payload: InvitationEmailPayload = {
    organizationId: 'org-1',
    email: 'jane@example.com',
    role: OrganizationRole.MEMBER,
    invitedByUserId: 'user-1',
    token: 'kZ3vQ1sJ8xN0bW5yT7pR2mH4cA6dE9fG1iL3oP5sU7w',
    expiresAt: new Date('2026-01-22T00:00:00.000Z'),
  };

  let configValues: Record<string, string>;
  let mailer: DevelopmentInvitationMailer;
  let logs: string[];
  let warnings: string[];

  beforeEach(() => {
    configValues = {};
    logs = [];
    warnings = [];

    const configService = {
      get: jest.fn(
        (key: string, fallback?: string) => configValues[key] ?? fallback,
      ),
    } as unknown as ConfigService;

    mailer = new DevelopmentInvitationMailer(configService);

    jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(
        (message: unknown) => void logs.push(String(message)),
      );
    jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(
        (message: unknown) => void warnings.push(String(message)),
      );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('buildAcceptUrl', () => {
    it('builds the frontend accept URL from the configured origin', () => {
      configValues.frontendOrigin = 'https://app.example.com';

      expect(mailer.buildAcceptUrl('abc123')).toBe(
        `https://app.example.com${INVITATION_ACCEPT_PATH}?token=abc123`,
      );
    });

    it('falls back to the local SPA origin', () => {
      expect(mailer.buildAcceptUrl('abc123')).toBe(
        `${DEFAULT_FRONTEND_ORIGIN}${INVITATION_ACCEPT_PATH}?token=abc123`,
      );
    });

    it('trims a trailing slash from the configured origin', () => {
      configValues.frontendOrigin = 'https://app.example.com/';

      expect(mailer.buildAcceptUrl('abc123')).toBe(
        `https://app.example.com${INVITATION_ACCEPT_PATH}?token=abc123`,
      );
    });

    it('url-encodes the token', () => {
      expect(mailer.buildAcceptUrl('a b&c=d')).toBe(
        `${DEFAULT_FRONTEND_ORIGIN}${INVITATION_ACCEPT_PATH}?token=a%20b%26c%3Dd`,
      );
    });
  });

  describe('sendInvitationEmail', () => {
    it('logs the accept URL with the invite context', () => {
      configValues.frontendOrigin = 'https://app.example.com';

      mailer.sendInvitationEmail(payload);

      expect(logs).toHaveLength(1);
      expect(JSON.parse(logs[0])).toEqual({
        message: 'organization invitation email (development stub)',
        organizationId: 'org-1',
        email: 'jane@example.com',
        role: OrganizationRole.MEMBER,
        invitedByUserId: 'user-1',
        subject: INVITATION_EMAIL_SUBJECT,
        expiresAt: '2026-01-22T00:00:00.000Z',
        acceptUrl: `https://app.example.com${INVITATION_ACCEPT_PATH}?token=${payload.token}`,
      });
    });

    it('never logs the token hash', () => {
      mailer.sendInvitationEmail(payload);

      expect(logs.join('\n')).not.toContain('tokenHash');
    });

    it('warns instead of logging at info level in production', () => {
      configValues.nodeEnv = 'production';

      mailer.sendInvitationEmail(payload);

      expect(logs).toHaveLength(0);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('no SMTP provider is configured');
    });
  });
});
