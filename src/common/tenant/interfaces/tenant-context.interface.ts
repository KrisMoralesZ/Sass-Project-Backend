import type { OrganizationContextSource } from '../constants/tenant.constants';

export type { OrganizationContextSource };

export interface TenantContext {
  organizationId: string;
  /**
   * Where the accepted organization id was resolved from.
   * Present after TenantGuard accepts the context.
   */
  source?: OrganizationContextSource;
}

export interface AuthenticatedUser {
  id: string;
  email?: string;
  organizationId?: string;
}

export interface JwtTenantPayload {
  sub: string;
  organizationId?: string;
  orgId?: string;
}

export interface TenantOrganizationResolution {
  organizationId?: string;
  source?: OrganizationContextSource;
  /**
   * Set when a candidate value was present but failed UUID validation.
   */
  invalidCandidate?: {
    source: OrganizationContextSource;
    value: string;
  };
}
