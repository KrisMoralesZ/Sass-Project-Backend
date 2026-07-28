export interface UserProfileResponse {
  id: string;
  userId: string;
  email: string;
  displayName: string | null;
  createdAt: Date;
  updatedAt: Date;
}
