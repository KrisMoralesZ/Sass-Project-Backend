export const DEFAULT_ORGANIZATION_TIMEZONE = 'UTC';
export const DEFAULT_ORGANIZATION_LOCALE = 'en';

export interface OrganizationBrandingSettings {
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  appName: string | null;
}

export interface OrganizationSettings {
  timezone: string;
  locale: string;
  branding: OrganizationBrandingSettings;
  featureFlags: Record<string, boolean>;
}

export const DEFAULT_ORGANIZATION_BRANDING: OrganizationBrandingSettings = {
  logoUrl: null,
  primaryColor: null,
  accentColor: null,
  appName: null,
};

export const DEFAULT_ORGANIZATION_SETTINGS: OrganizationSettings = {
  timezone: DEFAULT_ORGANIZATION_TIMEZONE,
  locale: DEFAULT_ORGANIZATION_LOCALE,
  branding: { ...DEFAULT_ORGANIZATION_BRANDING },
  featureFlags: {},
};
