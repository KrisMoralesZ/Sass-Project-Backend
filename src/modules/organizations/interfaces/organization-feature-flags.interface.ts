export enum OrganizationFeatureFlag {
  BETA_BOARDS = 'betaBoards',
  ADVANCED_REPORTS = 'advancedReports',
  MEMBER_INVITES = 'memberInvites',
  CUSTOM_BRANDING = 'customBranding',
}

export type OrganizationFeatureFlags = Record<OrganizationFeatureFlag, boolean>;

export const DEFAULT_ORGANIZATION_FEATURE_FLAGS: OrganizationFeatureFlags = {
  [OrganizationFeatureFlag.BETA_BOARDS]: false,
  [OrganizationFeatureFlag.ADVANCED_REPORTS]: false,
  [OrganizationFeatureFlag.MEMBER_INVITES]: false,
  [OrganizationFeatureFlag.CUSTOM_BRANDING]: false,
};

export const ORGANIZATION_FEATURE_FLAG_KEYS = Object.values(
  OrganizationFeatureFlag,
);
