# Organization permissions (v1)

This document defines the **permission matrix** for task 3.2.2.

Permissions are organization-scoped and derived from the member’s
[`OrganizationRole`](./organization-roles-v1.md). Guards (task 3.2.4) will enforce
these checks at the route/service boundary.

## Permission catalog

| Resource | Permissions |
|---|---|
| Projects | `project:create`, `project:read`, `project:update`, `project:delete` |
| Boards | `board:create`, `board:read`, `board:update`, `board:delete` |
| Issues | `issue:create`, `issue:read`, `issue:update`, `issue:delete`, `issue:assign`, `issue:move` |
| Invites | `invite:create`, `invite:read`, `invite:revoke` |
| Settings | `settings:read`, `settings:update` |

## Matrix

| Permission | OWNER | ADMIN | MEMBER | VIEWER |
|---|---|---|---|---|
| `project:create` | ✓ | ✓ | ✓ | |
| `project:read` | ✓ | ✓ | ✓ | ✓ |
| `project:update` | ✓ | ✓ | ✓ | |
| `project:delete` | ✓ | ✓ | | |
| `board:create` | ✓ | ✓ | ✓ | |
| `board:read` | ✓ | ✓ | ✓ | ✓ |
| `board:update` | ✓ | ✓ | ✓ | |
| `board:delete` | ✓ | ✓ | | |
| `issue:create` | ✓ | ✓ | ✓ | |
| `issue:read` | ✓ | ✓ | ✓ | ✓ |
| `issue:update` | ✓ | ✓ | ✓ | |
| `issue:delete` | ✓ | ✓ | ✓ | |
| `issue:assign` | ✓ | ✓ | ✓ | |
| `issue:move` | ✓ | ✓ | ✓ | |
| `invite:create` | ✓ | ✓ | | |
| `invite:read` | ✓ | ✓ | | |
| `invite:revoke` | ✓ | ✓ | | |
| `settings:read` | ✓ | ✓ | ✓ | ✓ |
| `settings:update` | ✓ | ✓ | | |

## Role summaries

- **VIEWER** — read projects/boards/issues/settings
- **MEMBER** — collaborate on work items; cannot delete projects/boards, manage invites, or change settings
- **ADMIN** — member capabilities plus invites, settings updates, and destructive project/board actions
- **OWNER** — every permission

## Usage

```typescript
import {
  OrganizationPermission,
  roleHasPermission,
} from '@organizations/permissions';

if (!roleHasPermission(member.role, OrganizationPermission.INVITE_CREATE)) {
  throw AppException.forbidden(...);
}
```

## Code reference

| Artifact | Purpose |
|---|---|
| `src/modules/organizations/permissions/organization-permission.enum.ts` | Permission catalog |
| `src/modules/organizations/permissions/organization-permission.matrix.ts` | Role → permission matrix + helpers |
| `docs/organization-roles-v1.md` | Base roles |

## Out of scope for 3.2.2

- Route guards / `@RequirePermissions()` decorators (task 3.2.4)
- Project-scoped overrides
- Custom permissions per organization

## Revision history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-07-27 | Initial matrix for projects, boards, issues, invites, settings |
