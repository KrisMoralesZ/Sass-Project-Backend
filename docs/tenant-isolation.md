# Tenant Isolation Rules

This document defines how multi-tenancy works in the SaaS backend. **Organization** is the tenant boundary. All tenant-scoped data is isolated using row-level tenancy (`organizationId` on each record).

## Strategy

| Approach | Status |
|---|---|
| Row-level tenancy (`organizationId` column) | **Active** |
| Schema-per-tenant | Not used |
| Database-per-tenant | Not used |

Every request that touches tenant-owned data must carry an active organization context, and every query must filter by that `organizationId`.

### v1 membership model

v1 allows **multiple organization memberships per user** with **one active organization per request**. See [organization-membership-v1.md](./organization-membership-v1.md) for the formal decision and client/backend implications.

---

## Request lifecycle

```text
HTTP Request
     │
     ▼
TenantContextMiddleware        ← resolves organizationId (user → header → JWT)
     │
     ▼
TenantGuard (global)           ← requires org context unless @OptionalOrganization()
     │
     ▼
TenantMembershipValidator      ← verifies user belongs to org (when authenticated)
     │
     ▼
Controller / Service
     │
     ▼
TenantScopedRepository         ← all reads/writes scoped by organizationId
```

### Organization context sources (priority order)

1. `request.user.organizationId` — set by Auth module after JWT validation
2. `X-Organization-Id` header — explicit workspace selection
3. JWT `organizationId` or `orgId` claim — fallback until Auth module owns verification

> **Rule:** Never trust a client-provided `organizationId` in the request body. Always use `TenantContextService.requireOrganizationId()`.

---

## Entity classification

### Global entities (no `organizationId`)

These exist outside a single organization boundary.

| Entity | Module | Notes |
|---|---|---|
| `User` | Users / Auth | Identity is global; users can belong to many orgs |
| `Invitation` | Organizations | Tied to an org via FK, but token acceptance may be public |
| Auth tokens / sessions | Authentication | User-scoped, not org-scoped |

### Tenant-scoped entities (extend `TenantScopedEntity`)

These **must** include `organizationId` and extend `TenantScopedEntity`.

| Entity | Module | Parent scope |
|---|---|---|
| `Organization` | Organizations | Root tenant record (owns its own `id`; members reference it) |
| `OrganizationMember` | Users / Roles | `organizationId` required |
| `Project` | Projects | `organizationId` required |
| `ProjectMember` | Projects | Inherits via `projectId` + explicit `organizationId` recommended |
| `Board` | Boards | `organizationId` required (denormalized for query performance) |
| `BoardColumn` | Boards | Scoped via `boardId`; add `organizationId` if queried directly |
| `Issue` | Issues | `organizationId` required |
| `Comment` | Comments | Scoped via `issueId`; add `organizationId` if queried directly |
| `Attachment` | Attachments | Scoped via `issueId`; add `organizationId` if queried directly |
| `Activity` | Activity | `organizationId` required |
| `Notification` | Notifications | `userId` + optional `organizationId` for org-scoped events |
| `Role` (custom per org) | Roles | `organizationId` if org-defined roles; system roles are global |

### Denormalization rule

When an entity is typically queried without joining its parent, **add `organizationId` directly** even if it could be inferred through a relation. This keeps tenant filters simple and fast.

Example: `Board`, `Issue`, and `Activity` carry `organizationId` even though they belong to a `Project`.

---

## Implementation rules

### 1. Entity definition

```typescript
@Entity('projects')
export class Project extends TenantScopedEntity {
  @Column()
  name!: string;
}
```

- Extend `TenantScopedEntity` (provides `id`, timestamps, soft delete, `organizationId`)
- Never omit `organizationId` on tenant-owned tables
- Add an index on `organizationId` (included in `TenantScopedEntity`)

### 2. Data access

Always use `TenantScopedRepository` or the query helpers:

```typescript
// FindOptions — always merges organizationId
withOrganizationScope(organizationId, { slug: 'alpha' });

// QueryBuilder — always adds AND alias.organizationId = :organizationId
applyTenantScope(queryBuilder, organizationId, 'project');
```

**Required:**
- Use `TenantScopedRepository` for CRUD on tenant entities
- Use `scopedQueryBuilder()` for custom queries
- Use `create()` on the repository so `organizationId` is assigned automatically
- Use `findOneById()` instead of raw `findOne({ where: { id } })`

**Forbidden:**
- Querying tenant entities without an `organizationId` filter
- Accepting `organizationId` from request body/query params for authorization
- Using `repository.find({ where: { id } })` without tenant scope
- Hard-deleting tenant records (use `softRemove()`)

### 3. Writes and ownership checks

| Operation | Rule |
|---|---|
| **Create** | Set `organizationId` from `TenantContextService`, never from client input |
| **Read** | Filter by `organizationId` on every query |
| **Update** | Load via scoped query first; reject if `entity.organizationId !== currentOrg` |
| **Delete** | Use `softRemove()`; assert ownership before delete |

Cross-tenant access attempts return `403 Forbidden`.

### 4. Route classification

| Type | Decorator | Example routes |
|---|---|---|
| Public (no org required) | `@OptionalOrganization()` | `GET /health`, `POST /auth/register`, `POST /auth/login` |
| Tenant-protected (default) | None — global `TenantGuard` applies | All business routes |
| Explicit guard | `@RequireOrganization()` | Optional redundancy on sensitive endpoints |

### 5. Public endpoints

Routes that do not need organization context must be explicitly marked:

```typescript
@OptionalOrganization()
@Controller('health')
export class HealthController {}
```

Unmarked routes require `X-Organization-Id` or a JWT with an `organizationId` claim.

---

## Module-specific guidance

### Authentication
- Registration and login are **global** (`@OptionalOrganization()`)
- Post-login, clients must send organization context for workspace operations

### Organizations
- `Organization` is the tenant root entity
- Creating an org does not require prior org context
- Listing/switching orgs is user-scoped, not org-scoped
- v1 supports multiple memberships per user; clients must send explicit active organization context for workspace routes ([organization-membership-v1.md](./organization-membership-v1.md))

### Projects → Boards → Issues
- Strict hierarchy: `Organization → Project → Board → Issue`
- Every layer that is directly queried must be tenant-filtered
- Issue keys (`PROJ-123`) are unique **per project**, not globally

### Comments, Attachments, Activity
- Always verify the parent `Issue` belongs to the current org before creating child records
- Prefer loading the parent via `TenantScopedRepository.findOneById()` first

### Reports
- All aggregations must include `WHERE organizationId = :currentOrg`
- Cross-project reports stay within the same organization

---

## Security checklist (per feature)

Before merging any module:

- [ ] Entity extends `TenantScopedEntity` (if tenant-owned)
- [ ] Repository extends `TenantScopedRepository`
- [ ] No raw TypeORM calls without tenant scope
- [ ] `organizationId` is never taken from client input
- [ ] Public routes use `@OptionalOrganization()`
- [ ] E2E test confirms cross-tenant access is blocked
- [ ] Soft delete used instead of hard delete

---

## Anti-patterns

```typescript
// BAD — no tenant filter
await this.projectRepo.findOne({ where: { id } });

// GOOD
await this.projectsRepository.findOneById(id);
```

```typescript
// BAD — trusts client-supplied org
const project = this.projectsRepository.create({
  ...dto,
  organizationId: dto.organizationId,
});

// GOOD
const project = this.projectsRepository.create(dto);
```

```typescript
// BAD — raw query without scope
await this.dataSource.query(`SELECT * FROM issues WHERE id = $1`, [id]);

// GOOD
await this.issuesRepository.scopedQueryBuilder('issue')
  .andWhere('issue.id = :id', { id })
  .getOne();
```

---

## Related code

| File | Purpose |
|---|---|
| `src/common/tenant/` | Context resolution, guard, middleware |
| `src/database/entities/tenant-scoped.entity.ts` | Base entity with `organizationId` |
| `src/database/repositories/tenant-scoped.repository.ts` | Scoped CRUD operations |
| `src/database/helpers/` | `withOrganizationScope`, `applyTenantScope` |

---

## Revision history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-07-13 | Initial tenant isolation rules (Phase 0.2.5) |
| 1.1 | 2026-07-23 | Documented v1 multi-membership policy (task 2.3.1) |
