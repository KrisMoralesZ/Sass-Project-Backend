import {
  DEFAULT_ORGANIZATION_FEATURE_FLAGS,
  OrganizationFeatureFlag,
  ORGANIZATION_FEATURE_FLAG_KEYS,
} from './organization-feature-flags.interface';

describe('organization-feature-flags.interface', () => {
  it('defines placeholder feature flags with false defaults', () => {
    expect(ORGANIZATION_FEATURE_FLAG_KEYS).toEqual([
      OrganizationFeatureFlag.BETA_BOARDS,
      OrganizationFeatureFlag.ADVANCED_REPORTS,
      OrganizationFeatureFlag.MEMBER_INVITES,
      OrganizationFeatureFlag.CUSTOM_BRANDING,
    ]);
    expect(DEFAULT_ORGANIZATION_FEATURE_FLAGS).toEqual({
      betaBoards: false,
      advancedReports: false,
      memberInvites: false,
      customBranding: false,
    });
  });
});
