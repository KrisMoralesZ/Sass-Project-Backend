# AGENTS.md (sass-backend)

Guidance for AI agents working in the NestJS API. Root-level repo guidance lives in
`../AGENTS.md`; this file adds backend-specific detail. Keep both accurate.

## What this is

NestJS 11 + TypeORM + PostgreSQL multi-tenant SaaS API, serving `/api/v1`.
Sibling SPA: `../sass-frontend` (Vite + React).

## Commands (run here, `workdir: sass-backend`)

- Dev: `npm run start:dev` (API on :3000, Swagger at `/api/docs`)
- Build: `npm run build` (nest build + tsc-alias)
- Lint: `npm run lint` (eslint `--fix`) — run before finishing a change
- Unit tests: `npm run test` · coverage `npm run test:cov` (threshold 70%) · e2e `npm run test:e2e`
- Local QA seed: `npm run seed` (idempotent; users use password `Password1`, see `docs/database-seeds.md`)
- Docker Postgres on :5433: `npm run docker:dev` (local `npm run start:dev` uses localhost:5433 by default)

## Codebase quick map

- `src/main.ts` — bootstrap, global pipe/filter/interceptors, API versioning, Swagger.
- `src/app.module.ts` — imports order matters: `JwtAuthGuard` must register before `TenantGuard`.
- `src/common/` — cross-cutting: error codes + `AppException`, response envelope
  (`transform-response.interceptor`), filters, pagination/sort/filter DTOs, logging,
  throttling, and `tenant/` (context, guards, `@CurrentOrganization` / `@OptionalOrganization`).
- `src/database/` — data source, entities registration, seeds (`seeds/run-seed.ts`).
- `src/config/` — env validation (class-validator).

## Conventions (Nest CLI layout)

- Domain modules under `src/modules/<domain>/` with `controller`, `service`, `module`,
  `dto/`, `entities/`, `interfaces/`, plus `*.spec.ts` tests beside sources.
- Path aliases: `@app/*`, `@common/*`, `@config/*`, `@database/*`, `@health/*`,
  `@authentication/*`, `@organizations/*`, `@users/*`.
- Multi-tenancy is mandatory: tenant-scoped entities extend the base entity
  (`organizationId`, timestamps, soft delete) and every query enforces org isolation.
  Global vs tenant-scoped entities: `docs/tenant-isolation.md`.
- Auth via JWT (access/refresh) + Passport. RBAC roles `OWNER | ADMIN | MEMBER | VIEWER`;
  use `@RequirePermissions` / `@RequireMinRole` (never hand-roll checks).
  See `docs/organization-rbac-v1.md` and `src/modules/organizations/permissions/`.
- Errors: throw `AppException` with a code from `error-code.enum.ts`; the global filter
  formats `{ success: false, error: { code, statusCode, message }, meta }`. Never leak raw errors.
- Responses: controllers return data; the interceptor wraps as `{ success: true, data, meta }`.
- DTOs use class-validator; validate with existing shared list/sort/filter DTOs where applicable.

## Testing

- Unit tests are `*.spec.ts` beside sources (`npm run test`), coverage enforced at 70%.
- Add controller/service/entity tests for new endpoints (RBAC, validation, tenant scoping).
- Seed data lives in `src/database/seeds/`; keep it idempotent.

## Where we are (backlog)

See `docs/next-tasks-and-subtasks.md`. Phases 0–3.3 (auth, orgs, users, RBAC, invites) are done.
Next: **Task 3.4 — Member management** (role update, removal, last-owner protection),
taken **alongside** `../sass-frontend` frontend task 3.5.