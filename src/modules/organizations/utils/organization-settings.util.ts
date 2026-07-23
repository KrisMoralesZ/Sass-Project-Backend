import {
  DEFAULT_ORGANIZATION_BRANDING,
  DEFAULT_ORGANIZATION_FEATURE_FLAGS,
  DEFAULT_ORGANIZATION_LOCALE,
  DEFAULT_ORGANIZATION_TIMEZONE,
  OrganizationBrandingSettings,
  OrganizationFeatureFlags,
  OrganizationSettings,
} from '../interfaces/organization-settings.interface';

export function normalizeOrganizationFeatureFlags(
  featureFlags: Partial<OrganizationFeatureFlags> | null | undefined,
): OrganizationFeatureFlags {
  return {
    ...DEFAULT_ORGANIZATION_FEATURE_FLAGS,
    ...featureFlags,
  };
}

export function normalizeOrganizationSettings(
  settings: Record<string, unknown> | OrganizationSettings | null | undefined,
): OrganizationSettings {
  const current = (settings ?? {}) as Partial<OrganizationSettings>;
  const branding = (current.branding ??
    {}) as Partial<OrganizationBrandingSettings>;

  return {
    timezone: current.timezone ?? DEFAULT_ORGANIZATION_TIMEZONE,
    locale: current.locale ?? DEFAULT_ORGANIZATION_LOCALE,
    branding: {
      logoUrl: branding.logoUrl ?? DEFAULT_ORGANIZATION_BRANDING.logoUrl,
      primaryColor:
        branding.primaryColor ?? DEFAULT_ORGANIZATION_BRANDING.primaryColor,
      accentColor:
        branding.accentColor ?? DEFAULT_ORGANIZATION_BRANDING.accentColor,
      appName: branding.appName ?? DEFAULT_ORGANIZATION_BRANDING.appName,
    },
    featureFlags: normalizeOrganizationFeatureFlags(current.featureFlags),
  };
}

export function mergeOrganizationSettings(
  currentSettings: Record<string, unknown> | OrganizationSettings,
  patch: Partial<Omit<OrganizationSettings, 'branding' | 'featureFlags'>> & {
    branding?: Partial<OrganizationBrandingSettings>;
    featureFlags?: Partial<OrganizationFeatureFlags>;
  },
): OrganizationSettings {
  const current = normalizeOrganizationSettings(currentSettings);

  return normalizeOrganizationSettings({
    ...current,
    ...patch,
    branding: {
      ...current.branding,
      ...patch.branding,
    },
    featureFlags: normalizeOrganizationFeatureFlags({
      ...current.featureFlags,
      ...patch.featureFlags,
    }),
  });
}
