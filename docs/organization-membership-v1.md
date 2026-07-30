# Organization membership policy (v1)

This document records the **v1 decision** for task 2.3.1: whether a user can belong to multiple organizations.

## Decision

**Yes — v1 supports multiple organization memberships per user.**

A user identity is global. A user may belong to zero, one, or many organizations through `OrganizationMember` records. There is no v1 cap on how many organizations a user can join.

## Active organization model

Although users can belong to many organizations, **each request uses exactly one active organization context**.

| Concern | v1 behavior |
|---|---|
| User identity | Global (`User` entity) |
| Membership storage | One `OrganizationMember` row per `(userId, organizationId)` |
| Active workspace | Resolved per request, not stored on the user record |
| Context source priority | `X-Organization-Id` header → `request.user.organizationId` → JWT `organizationId` / `orgId` claim |
| Organization id format | UUID required; invalid candidates rejected before membership checks |
| Accepted context | Stored on `request.tenantContext` only after membership validation |
| Tenant-scoped routes | Require a valid active organization that the user belongs to |
| Archived organizations | Hidden from active workflows; cannot be used as active context |

## Implications for clients

1. After login, list organizations with `GET /api/v1/organizations`.
2. Pick a workspace and send `X-Organization-Id: <uuid>` on tenant-scoped requests.
3. Switch workspaces by changing the header (or future JWT claim refresh) — no re-login required.
4. Creating a new organization adds another membership; it does not replace existing ones.

## Implications for backend modules

- Do **not** store a single `organizationId` on `User`.
- Use `OrganizationMembershipService` for membership checks.
- Use `TenantContextService.requireOrganizationId()` for tenant-scoped writes and reads.
- Organization listing endpoints are user-scoped (`@OptionalOrganization()`), not tenant-scoped.
- Invitations and role management (Phase 3) should assume multi-membership is normal.

## Out of scope for v1

- Persisting a "last selected organization" preference on the user profile
- Automatic organization selection when the header is omitted
- Billing or plan enforcement based on membership count
- Cross-organization data aggregation in a single request

## Membership validation before context acceptance (task 2.3.2)

Providing an organization id is not enough. Tenant context is accepted only when:

1. The caller is authenticated.
2. The resolved organization id identifies an **active** (non-archived) organization.
3. An `OrganizationMember` row links that user to the organization.

Until those checks pass, `request.tenantContext` remains unset and downstream tenant-scoped repositories must not run.

## Consistent organization resolution (task 2.3.3)

Every tenant-scoped request resolves the active organization the same way:

1. Prefer `X-Organization-Id` so workspace switching is explicit and immediate.
2. Fall back to Auth/JWT claims only when the header is omitted.
3. Reject non-UUID candidates with validation errors.
4. Re-resolve in `TenantGuard` after authentication (middleware runs before JWT validation).
5. Accept the organization into `request.tenantContext` only after active membership validation.
6. Downstream modules must consume the accepted context (`TenantContextService` / `@CurrentOrganization()`), never re-parse headers.

This keeps multi-org switching deterministic: changing the header changes the active workspace for that request without re-login.

## Code reference

| Artifact | Purpose |
|---|---|
| `src/modules/organizations/constants/organization-membership-v1.policy.ts` | Machine-readable v1 policy constants |
| `src/modules/organizations/entities/organization-member.entity.ts` | Membership join model |
| `src/modules/organizations/services/organization-membership.service.ts` | Active membership queries |
| `src/common/tenant/tenant-context.resolver.ts` | Consistent active organization resolution |
| `src/common/tenant/tenant-membership.validator.ts` | Membership gate before context acceptance |
| `src/common/tenant/guards/tenant.guard.ts` | Accepts `tenantContext` only after validation |
| `src/common/tenant/decorators/current-organization.decorator.ts` | Reads accepted organization context |
| `docs/tenant-isolation.md` | Tenant boundary and request lifecycle rules |

## Revision history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-07-23 | v1 decision: multi-membership with explicit per-request active organization |
| 1.1 | 2026-07-27 | Documented membership validation before tenant context acceptance (task 2.3.2) |
| 1.2 | 2026-07-27 | Documented consistent header-first resolution and UUID validation (task 2.3.3) |
