export interface OrganizationBrandingSettings {
  logoUrl?: string | null;
  primaryColor?: string | null;
}

export interface OrganizationSettings {
  timezone?: string;
  locale?: string;
  branding?: OrganizationBrandingSettings;
  featureFlags?: Record<string, boolean>;
}

export const DEFAULT_ORGANIZATION_SETTINGS: OrganizationSettings = {
  timezone: 'UTC',
  locale: 'en',
  branding: {
    logoUrl: null,
    primaryColor: null,
  },
  featureFlags: {},
};
