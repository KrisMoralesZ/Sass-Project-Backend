# Organization invitations (v1)

This document defines the **invitation policy** for task 3.3.1. Implementation
lands in **3.3.2–3.3.8**, with frontend invite UI (**frontend 3.4**) taken
alongside.

Invites add memberships to an existing organization. They do not create
organizations or replace the [multi-membership model](./organization-membership-v1.md).

## Decision

v1 invitations are **email + token** records owned by one organization:

| Concern | v1 behavior |
|---|---|
| Who can invite | Callers with `invite:create` (`OWNER` and `ADMIN`) |
| Who can list | Callers with `invite:read` |
| Who can revoke | Callers with `invite:revoke` |
| Who can accept | Authenticated user whose email matches the invite |
| Default role | `MEMBER` |
| Assignable roles | All four base roles (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`) |
| Token at rest | SHA-256 hash only; raw token is shown once in the invite URL |
| TTL | 7 days from creation |
| Email delivery | Development stub that logs the URL (no SMTP) |

## Statuses

An invitation is always in exactly one status:

| Status | Meaning |
|---|---|
| `pending` | Created, not accepted, not revoked, and still within TTL |
| `accepted` | Invitee completed accept; an `OrganizationMember` row exists |
| `revoked` | An authorized member cancelled the invite before accept |
| `expired` | `pending` invite whose `expiresAt` is in the past |

`expired` may be **derived** at read/accept/revoke time (`status === pending && now > expiresAt`) and persisted when convenient. Callers must treat derived and stored expiry the same.

Terminal statuses: `accepted`, `revoked`, `expired`. Only `pending` (and not past `expiresAt`) can be accepted.

## Token rules

1. Generate a cryptographically random opaque token (at least 32 bytes, URL-safe).
2. Store **`tokenHash = SHA-256(token)`** on the invitation row. Never persist the raw token.
3. Put the raw token only in the accept URL written by the email stub.
4. List/detail responses for members **must not** include `token` or `tokenHash`.
5. Look up invitations by hash. Unknown, revoked, expired, or already-accepted tokens fail accept.
6. TTL is **7 days**. `expiresAt = createdAt + 7 days`.

Suggested accept URL for the frontend (task 3.4.4):

```text
{FRONTEND_ORIGIN}/invites/accept?token=<raw-token>
```

## Assignable roles

Invite `role` uses the same catalog as [organization-roles-v1.md](./organization-roles-v1.md).

| Event | Role |
|---|---|
| Role omitted on create | `MEMBER` (`DEFAULT_ORGANIZATION_ROLE`) |
| Role provided on create | Any of `OWNER` / `ADMIN` / `MEMBER` / `VIEWER` |
| Role on accept | The role stored on the invitation; accept does not remap it |

Last-owner protections stay in member-management (backend **3.4** / frontend **3.5**). Inviting a second `OWNER` is allowed in v1.

## Email identity

- Store invite `email` normalized (`trim` + lowercase).
- One **pending** invite per `(organizationId, email)`. A second pending invite for that pair is `409 CONFLICT`.
- If that email already has an active membership in the organization, create is `409 CONFLICT`.
- After revoke or expiry, a new pending invite for the same email is allowed.

The invitee does not need an account at create time. They must **register or log in** before accept.

## Accept flow

Accept is **authenticated and not tenant-scoped**. The invitee is not a member yet, so `X-Organization-Id` for that organization cannot be required.

```text
Authenticated user
        │
        ▼
POST /api/v1/invites/accept  { token }     ← @OptionalOrganization(); no invite:* permission
        │
        ▼
Hash token → load invitation
        │
        ▼
Must be pending and not past expiresAt
        │
        ▼
User.email (normalized) must equal invitation.email
        │
        ▼
Must not already be an active member of invitation.organizationId
        │
        ▼
OrganizationMembershipService.createMembership(orgId, userId, invitation.role)
        │
        ▼
Mark invitation accepted
```

| Failure | Expected client outcome |
|---|---|
| Not signed in | `401 UNAUTHORIZED` |
| Token unknown | `404 RESOURCE_NOT_FOUND` |
| Pending but past TTL | `400 BAD_REQUEST` (expired) |
| Revoked | `400 BAD_REQUEST` |
| Already accepted | Idempotent success if the same user is already the member; otherwise `409 CONFLICT` |
| Email mismatch | `403 FORBIDDEN` |
| Already an active member (joined another way) | `409 CONFLICT` |
| Archived organization | `403 TENANT_ORGANIZATION_FORBIDDEN` / not found — cannot join an archived workspace |

On success the client should add the organization to the switcher (list will include it) and may set it as the active workspace. Accept does **not** set tenant context on the accept request itself.

## Create, list, and revoke (tenant-scoped)

These routes require an accepted active organization and the invite permissions from [organization-permissions-v1.md](./organization-permissions-v1.md):

| Action | Permission | Notes |
|---|---|---|
| Create | `invite:create` | Body: email, optional role. Organization id from tenant context, never from the client body. |
| List | `invite:read` | Paginated; default to `pending` (including derived expiry as `expired`). Never return tokens. |
| Revoke | `invite:revoke` | Idempotent if already `revoked` or `expired`. Must not revoke an `accepted` invite. |

Proposed paths (finalized in **3.3.5–3.3.7**), consistent with `GET /members`:

| Method | Path | Auth / tenant |
|---|---|---|
| `POST` | `/api/v1/invites` | JWT + tenant + `invite:create` |
| `GET` | `/api/v1/invites` | JWT + tenant + `invite:read` |
| `POST` | `/api/v1/invites/:id/revoke` | JWT + tenant + `invite:revoke` |
| `POST` | `/api/v1/invites/accept` | JWT only; organization comes from the invitation |

## Entity shape (implemented in 3.3.2)

| Field | Purpose |
|---|---|
| `organizationId` | Owning workspace |
| `email` | Normalized invitee email |
| `role` | Role granted on accept |
| `tokenHash` | SHA-256 of the raw token |
| `status` | `pending` / `accepted` / `revoked` / `expired` |
| `invitedByUserId` | Member who created the invite |
| `expiresAt` | `createdAt + TTL` |

Invitation rows belong to an organization but **accept is not a tenant-scoped call**. See [tenant-isolation.md](./tenant-isolation.md): `Invitation` is classified as global-with-org-FK so token lookup is not forced through `TenantGuard` membership.

## Email stub (implemented in 3.3.4)

v1 does not send mail. Create logs the accept URL (and email/role/org) for local QA. Production SMTP is out of scope.

## Out of scope for 3.3.1

- `Invitation` TypeORM entity and module registration (**3.3.2**)
- DTOs and HTTP handlers (**3.3.3**, **3.3.5–3.3.7**)
- SMTP / branded email templates
- Invite links that skip authentication
- Resend-invite as a separate verb (create a new pending invite after revoke/expiry)
- Role change and member removal (**3.4**)

## Code reference

| Artifact | Purpose |
|---|---|
| `src/modules/organizations/constants/organization-invitations-v1.policy.ts` | Statuses, TTL, hashing rule, assignable roles |
| `src/modules/organizations/enums/organization-role.enum.ts` | `DEFAULT_ORGANIZATION_ROLE` (`MEMBER`) |
| `src/modules/organizations/permissions/organization-permission.enum.ts` | `invite:create` / `invite:read` / `invite:revoke` |
| `src/modules/organizations/services/organization-membership.service.ts` | `createMembership()` on accept |
| `docs/organization-roles-v1.md` | Base roles and default invite role |
| `docs/organization-permissions-v1.md` | Invite permission matrix |
| `docs/organization-rbac-v1.md` | `@RequirePermissions` on create/list/revoke |
| `docs/organization-membership-v1.md` | Multi-org membership after accept |

## Revision history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-09-03 | v1 invitation policy: statuses, hashed tokens, 7-day TTL, assignable roles, accept flow (task 3.3.1) |
