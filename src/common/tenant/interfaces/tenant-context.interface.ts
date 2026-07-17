export interface TenantContext {
  organizationId: string;
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
