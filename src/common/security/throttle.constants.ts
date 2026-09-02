export const AUTH_THROTTLE_NAME = 'auth';

/** Routes that should use the tight auth limiter, not the global default. */
export const AUTH_THROTTLE_PATHS = [
  '/auth/register',
  '/auth/login',
  '/auth/refresh',
  '/auth/logout',
] as const;

