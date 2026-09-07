import {
  DEFAULT_USER_PROFILE_LOCALE,
  DEFAULT_USER_PROFILE_NOTIFICATIONS,
  DEFAULT_USER_PROFILE_PREFERENCES,
  DEFAULT_USER_PROFILE_THEME,
  DEFAULT_USER_PROFILE_TIMEZONE,
  UserProfileNotificationPreferences,
  UserProfilePreferences,
  UserProfileTheme,
} from '../interfaces/user-profile-preferences.interface';

const VALID_THEMES: UserProfileTheme[] = ['system', 'light', 'dark'];

export function normalizeUserProfilePreferences(
  preferences:
    Record<string, unknown> | UserProfilePreferences | null | undefined,
): UserProfilePreferences {
  const current = (preferences ?? {}) as Partial<UserProfilePreferences>;
  const notifications = (current.notifications ??
    {}) as Partial<UserProfileNotificationPreferences>;
  const theme = VALID_THEMES.includes(current.theme as UserProfileTheme)
    ? (current.theme as UserProfileTheme)
    : DEFAULT_USER_PROFILE_THEME;

  return {
    timezone: current.timezone ?? DEFAULT_USER_PROFILE_TIMEZONE,
    locale: current.locale ?? DEFAULT_USER_PROFILE_LOCALE,
    theme,
    notifications: {
      email: notifications.email ?? DEFAULT_USER_PROFILE_NOTIFICATIONS.email,
      inApp: notifications.inApp ?? DEFAULT_USER_PROFILE_NOTIFICATIONS.inApp,
      marketing:
        notifications.marketing ?? DEFAULT_USER_PROFILE_NOTIFICATIONS.marketing,
    },
  };
}

export function mergeUserProfilePreferences(
  currentPreferences: Record<string, unknown> | UserProfilePreferences,
  patch: Partial<Omit<UserProfilePreferences, 'notifications'>> & {
    notifications?: Partial<UserProfileNotificationPreferences>;
  },
): UserProfilePreferences {
  const current = normalizeUserProfilePreferences(currentPreferences);

  return normalizeUserProfilePreferences({
    ...current,
    ...patch,
    notifications: {
      ...current.notifications,
      ...patch.notifications,
    },
  });
}

export function createDefaultUserProfilePreferences(): UserProfilePreferences {
  return {
    ...DEFAULT_USER_PROFILE_PREFERENCES,
    notifications: { ...DEFAULT_USER_PROFILE_NOTIFICATIONS },
  };
}
