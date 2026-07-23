import {
  DEFAULT_ORGANIZATION_BRANDING,
  DEFAULT_ORGANIZATION_LOCALE,
  DEFAULT_ORGANIZATION_SETTINGS,
  DEFAULT_ORGANIZATION_TIMEZONE,
} from '../interfaces/organization-settings.interface';
import {
  mergeOrganizationSettings,
  normalizeOrganizationSettings,
} from './organization-settings.util';

describe('organization-settings.util', () => {
  it('returns default timezone, locale, and branding placeholders', () => {
    expect(normalizeOrganizationSettings({})).toEqual(
      DEFAULT_ORGANIZATION_SETTINGS,
    );
    expect(normalizeOrganizationSettings(null)).toEqual({
      timezone: DEFAULT_ORGANIZATION_TIMEZONE,
      locale: DEFAULT_ORGANIZATION_LOCALE,
      branding: DEFAULT_ORGANIZATION_BRANDING,
      featureFlags: {},
    });
  });

  it('preserves provided settings while filling missing branding placeholders', () => {
    expect(
      normalizeOrganizationSettings({
        timezone: 'Europe/Madrid',
        locale: 'es',
        branding: {
          logoUrl: 'https://cdn.example.com/logo.png',
        },
      }),
    ).toEqual({
      timezone: 'Europe/Madrid',
      locale: 'es',
      branding: {
        logoUrl: 'https://cdn.example.com/logo.png',
        primaryColor: null,
        accentColor: null,
        appName: null,
      },
      featureFlags: {},
    });
  });

  it('merges partial settings updates without dropping existing values', () => {
    expect(
      mergeOrganizationSettings(
        {
          timezone: 'UTC',
          locale: 'en',
          branding: {
            logoUrl: 'https://cdn.example.com/logo.png',
            primaryColor: '#111111',
            accentColor: null,
            appName: 'Acme',
          },
          featureFlags: { betaBoards: true },
        },
        {
          locale: 'en-US',
          branding: {
            primaryColor: '#2563eb',
          },
        },
      ),
    ).toEqual({
      timezone: 'UTC',
      locale: 'en-US',
      branding: {
        logoUrl: 'https://cdn.example.com/logo.png',
        primaryColor: '#2563eb',
        accentColor: null,
        appName: 'Acme',
      },
      featureFlags: { betaBoards: true },
    });
  });
});
