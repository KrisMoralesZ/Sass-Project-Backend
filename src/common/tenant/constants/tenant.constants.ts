export const ORGANIZATION_ID_HEADER = 'x-organization-id';

export const JWT_ORGANIZATION_ID_CLAIMS = ['organizationId', 'orgId'] as const;

/**
 * Organization IDs are UUID primary keys. Reject non-UUID candidates early so
 * membership lookups and tenant-scoped queries never run against garbage input.
 */
export const ORGANIZATION_ID_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolution priority for the active organization on a request.
 *
 * Explicit header wins so multi-org users can switch workspaces without
 * re-issuing tokens or relying on a sticky user claim.
 */
export const ORGANIZATION_CONTEXT_RESOLUTION_ORDER = [
  'header',
  'user',
  'jwt',
] as const;

export type OrganizationContextSource =
  (typeof ORGANIZATION_CONTEXT_RESOLUTION_ORDER)[number];
