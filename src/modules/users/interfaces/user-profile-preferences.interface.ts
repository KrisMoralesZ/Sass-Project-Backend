export const DEFAULT_USER_PROFILE_THEME = 'system';
export const DEFAULT_USER_PROFILE_LOCALE = 'en';
export const DEFAULT_USER_PROFILE_TIMEZONE = 'UTC';

export type UserProfileTheme = 'system' | 'light' | 'dark';

export interface UserProfileNotificationPreferences {
  email: boolean;
  inApp: boolean;
  marketing: boolean;
}

export interface UserProfilePreferences {
  timezone: string;
  locale: string;
  theme: UserProfileTheme;
  notifications: UserProfileNotificationPreferences;
}

export const DEFAULT_USER_PROFILE_NOTIFICATIONS: UserProfileNotificationPreferences =
  {
    email: true,
    inApp: true,
    marketing: false,
  };

export const DEFAULT_USER_PROFILE_PREFERENCES: UserProfilePreferences = {
  timezone: DEFAULT_USER_PROFILE_TIMEZONE,
  locale: DEFAULT_USER_PROFILE_LOCALE,
  theme: DEFAULT_USER_PROFILE_THEME,
  notifications: { ...DEFAULT_USER_PROFILE_NOTIFICATIONS },
};
