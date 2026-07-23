import {
  DEFAULT_ORGANIZATION_BRANDING,
  DEFAULT_ORGANIZATION_LOCALE,
  DEFAULT_ORGANIZATION_SETTINGS,
  DEFAULT_ORGANIZATION_TIMEZONE,
  OrganizationBrandingSettings,
  OrganizationSettings,
} from '../interfaces/organization-settings.interface';

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
    featureFlags: {
      ...DEFAULT_ORGANIZATION_SETTINGS.featureFlags,
      ...current.featureFlags,
    },
  };
}

export function mergeOrganizationSettings(
  currentSettings: Record<string, unknown> | OrganizationSettings,
  patch: Partial<Omit<OrganizationSettings, 'branding'>> & {
    branding?: Partial<OrganizationBrandingSettings>;
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
    featureFlags: {
      ...current.featureFlags,
      ...patch.featureFlags,
    },
  });
}
