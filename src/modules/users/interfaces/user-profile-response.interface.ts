import type { UserProfilePreferences } from './user-profile-preferences.interface';

export interface UserProfileResponse {
  id: string;
  userId: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  preferences: UserProfilePreferences;
  createdAt: Date;
  updatedAt: Date;
}
