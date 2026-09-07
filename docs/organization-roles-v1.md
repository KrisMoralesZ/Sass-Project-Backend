# Organization roles (v1)

This document defines the **base organization roles** for task 3.2.1.

## Decision

v1 uses exactly four organization roles:

| Role | Rank | Purpose |
|---|---|---|
| `OWNER` | 400 | Full organization control |
| `ADMIN` | 300 | Manage members and settings |
| `MEMBER` | 200 | Create and collaborate on work |
| `VIEWER` | 100 | Read-only access |

Roles are stored on `OrganizationMember.role` and apply at the **organization** scope in v1. Project-scoped roles are out of scope for this phase.

## Hierarchy

```text
OWNER > ADMIN > MEMBER > VIEWER
```

Use `hasAtLeastOrganizationRole(role, minimumRole)` when a feature needs “Admin or higher” style checks. Prefer the [permission matrix](./organization-permissions-v1.md) for action-level authorization.

## Assignment rules (v1)

| Event | Role assigned |
|---|---|
| Organization created | Creator becomes `OWNER` |
| Invite accepted / member joined without explicit role | `MEMBER` (default) |
| Role updated by an authorized actor | Any of the four base roles |

All four roles are assignable in v1. Preventing removal of the last owner is handled in member-management (task 3.4).

## Code reference

| Artifact | Purpose |
|---|---|
| `src/modules/organizations/enums/organization-role.enum.ts` | Enum, ranks, definitions, helpers |
| `src/modules/organizations/entities/organization-member.entity.ts` | Join entity with `role` (task 3.2.3) |
| `src/database/seeds/` | Dev seeds creating one member per base role |
| `docs/organization-membership-v1.md` | Multi-org membership policy |
| `docs/database-seeds.md` | How to run membership/role seeds |

## Task 3.2.3 status

`OrganizationMember` is the join entity for users ↔ organizations and stores `role` as `OrganizationRole` with:

- unique `(organizationId, userId)`
- default `MEMBER`
- relations to `User` and `Organization`

Local verification: `npm run seed` creates Acme Workspace plus OWNER/ADMIN/MEMBER/VIEWER memberships.

## Out of scope for 3.2.1

- Permission matrix for projects/boards/issues/invites/settings (task 3.2.2) — see [organization-permissions-v1.md](./organization-permissions-v1.md)
- Custom/org-defined roles

Role guards and decorators: [organization-rbac-v1.md](./organization-rbac-v1.md) (task 3.2.4).

## Revision history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-07-27 | Defined OWNER, ADMIN, MEMBER, VIEWER as v1 base roles |
| 1.1 | 2026-07-27 | Linked permission matrix documentation (task 3.2.2) |
| 1.2 | 2026-07-27 | Confirmed OrganizationMember role join + DB seeds (task 3.2.3) |
| 1.3 | 2026-07-27 | Linked RBAC guards documentation (task 3.2.4) |
