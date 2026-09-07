# Organization RBAC guards (v1)

This document covers **task 3.2.4** — role-based guards and decorators that
enforce the [permission matrix](./organization-permissions-v1.md) and
[base roles](./organization-roles-v1.md).

## Decorators

| Decorator | Purpose |
|---|---|
| `@RequirePermissions(...permissions)` | Require every listed permission for the caller’s org role |
| `@RequireMinRole(role)` | Require at least the given role (`OWNER` > `ADMIN` > `MEMBER` > `VIEWER`) |
| `@OrganizationIdParam('id')` | Resolve org id from a route param (or assert it matches tenant context) |
| `@CurrentOrganizationRole()` | Read the role attached after the guard runs |

`@RequirePermissions` / `@RequireMinRole` apply `PermissionsGuard` via
`UseGuards`, so they run **after** global JWT + tenant guards.

## Resolution order for organization id

1. Accepted `request.tenantContext.organizationId` (header / claim after membership validation)
2. Else route param from `@OrganizationIdParam(...)`
3. If both are present, they must match

## Example usage

```typescript
@Patch(':id')
@OrganizationIdParam('id')
@RequirePermissions(OrganizationPermission.SETTINGS_UPDATE)
update(...) { ... }

@Delete(':id')
@OrganizationIdParam('id')
@RequireMinRole(OrganizationRole.OWNER)
remove(...) { ... }

@Post('invites')
@RequirePermissions(OrganizationPermission.INVITE_CREATE)
createInvite(...) { ... }
```

## Applied routes (v1 examples)

| Route | Rule |
|---|---|
| `PATCH /api/v1/organizations/:id` | `settings:update` |
| `DELETE /api/v1/organizations/:id` | minimum role `OWNER` |

## Code reference

| Artifact | Purpose |
|---|---|
| `src/modules/organizations/rbac/` | Decorators, guard, metadata |
| `src/modules/organizations/services/organization-membership.service.ts` | `getActiveMembership()` |
| `docs/organization-permissions-v1.md` | Permission matrix |

## Out of scope

- Project-scoped permission overrides
- Custom roles per organization
- Attribute-based policies beyond role/permission matrix

## Revision history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-07-27 | Initial guards and decorators (task 3.2.4) |
