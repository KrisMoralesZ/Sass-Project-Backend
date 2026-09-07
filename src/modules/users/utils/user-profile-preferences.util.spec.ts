import {
  DEFAULT_USER_PROFILE_PREFERENCES,
  DEFAULT_USER_PROFILE_THEME,
} from '../interfaces/user-profile-preferences.interface';
import {
  mergeUserProfilePreferences,
  normalizeUserProfilePreferences,
} from './user-profile-preferences.util';

describe('user-profile-preferences.util', () => {
  it('returns default preferences when input is empty', () => {
    expect(normalizeUserProfilePreferences({})).toEqual(
      DEFAULT_USER_PROFILE_PREFERENCES,
    );
    expect(normalizeUserProfilePreferences(null)).toEqual(
      DEFAULT_USER_PROFILE_PREFERENCES,
    );
  });

  it('fills missing preference placeholders', () => {
    expect(
      normalizeUserProfilePreferences({
        locale: 'es',
        notifications: {
          marketing: true,
        },
      }),
    ).toEqual({
      timezone: 'UTC',
      locale: 'es',
      theme: DEFAULT_USER_PROFILE_THEME,
      notifications: {
        email: true,
        inApp: true,
        marketing: true,
      },
    });
  });

  it('merges partial preference updates without dropping existing values', () => {
    expect(
      mergeUserProfilePreferences(DEFAULT_USER_PROFILE_PREFERENCES, {
        theme: 'dark',
        notifications: {
          email: false,
        },
      }),
    ).toEqual({
      timezone: 'UTC',
      locale: 'en',
      theme: 'dark',
      notifications: {
        email: false,
        inApp: true,
        marketing: false,
      },
    });
  });
});
