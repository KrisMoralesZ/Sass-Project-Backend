import {
  DEFAULT_ORGANIZATION_BRANDING,
  DEFAULT_ORGANIZATION_FEATURE_FLAGS,
  DEFAULT_ORGANIZATION_LOCALE,
  DEFAULT_ORGANIZATION_SETTINGS,
  DEFAULT_ORGANIZATION_TIMEZONE,
} from '../interfaces/organization-settings.interface';
import { OrganizationFeatureFlag } from '../interfaces/organization-feature-flags.interface';
import {
  mergeOrganizationSettings,
  normalizeOrganizationFeatureFlags,
  normalizeOrganizationSettings,
} from './organization-settings.util';

describe('organization-settings.util', () => {
  it('returns default timezone, locale, branding, and feature flag placeholders', () => {
    expect(normalizeOrganizationSettings({})).toEqual(
      DEFAULT_ORGANIZATION_SETTINGS,
    );
    expect(normalizeOrganizationSettings(null)).toEqual({
      timezone: DEFAULT_ORGANIZATION_TIMEZONE,
      locale: DEFAULT_ORGANIZATION_LOCALE,
      branding: DEFAULT_ORGANIZATION_BRANDING,
      featureFlags: DEFAULT_ORGANIZATION_FEATURE_FLAGS,
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
      featureFlags: DEFAULT_ORGANIZATION_FEATURE_FLAGS,
    });
  });

  it('normalizes partial feature flag values against placeholder defaults', () => {
    expect(
      normalizeOrganizationFeatureFlags({
        [OrganizationFeatureFlag.BETA_BOARDS]: true,
      }),
    ).toEqual({
      ...DEFAULT_ORGANIZATION_FEATURE_FLAGS,
      [OrganizationFeatureFlag.BETA_BOARDS]: true,
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
          featureFlags: {
            ...DEFAULT_ORGANIZATION_FEATURE_FLAGS,
            [OrganizationFeatureFlag.BETA_BOARDS]: true,
          },
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
      featureFlags: {
        ...DEFAULT_ORGANIZATION_FEATURE_FLAGS,
        [OrganizationFeatureFlag.BETA_BOARDS]: true,
      },
    });
  });

  it('merges feature flag updates without resetting untouched flags', () => {
    expect(
      mergeOrganizationSettings(DEFAULT_ORGANIZATION_SETTINGS, {
        featureFlags: {
          [OrganizationFeatureFlag.MEMBER_INVITES]: true,
        },
      }).featureFlags,
    ).toEqual({
      ...DEFAULT_ORGANIZATION_FEATURE_FLAGS,
      [OrganizationFeatureFlag.MEMBER_INVITES]: true,
    });
  });
});
