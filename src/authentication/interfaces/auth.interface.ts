export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUserProfile {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: Date;
}

export interface RegisterResponse {
  user: AuthUserProfile;
  tokens: AuthTokens;
}

export interface JwtAccessPayload {
  sub: string;
  email: string;
  type: 'access';
}

export interface JwtRefreshPayload {
  sub: string;
  type: 'refresh';
}
