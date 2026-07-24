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
| Context source priority | `request.user.organizationId` → `X-Organization-Id` header → JWT `organizationId` / `orgId` claim |
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

## Code reference

| Artifact | Purpose |
|---|---|
| `src/modules/organizations/constants/organization-membership-v1.policy.ts` | Machine-readable v1 policy constants |
| `src/modules/organizations/entities/organization-member.entity.ts` | Membership join model |
| `src/common/tenant/tenant-context.resolver.ts` | Active organization resolution |
| `docs/tenant-isolation.md` | Tenant boundary and request lifecycle rules |

## Revision history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-07-23 | v1 decision: multi-membership with explicit per-request active organization |
