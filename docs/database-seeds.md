# Database seeds (task 3.2.3)

Development seeds for verifying the `OrganizationMember` join entity and base roles.

## Prerequisites

1. Postgres is running (`docker compose up` or local Postgres on the port in `.env`)
2. `DATABASE_SYNCHRONIZE=true` at least once so tables/enums exist (or run the app once)
3. `.env` is configured (see `.env.example`)

## Run

```bash
npm run seed
```

The seed is **idempotent**: re-running updates display names/roles without duplicating rows.

## What it creates

### Organization

| Field | Value |
|---|---|
| Name | Acme Workspace |
| Slug | `acme-workspace` |

### Users and memberships

Password for every seed user: **`Password1`**

| Email | Role |
|---|---|
| `owner@acme.local` | `OWNER` |
| `admin@acme.local` | `ADMIN` |
| `member@acme.local` | `MEMBER` |
| `viewer@acme.local` | `VIEWER` |

Each user also gets a `UserProfile` and an `OrganizationMember` row linking them to Acme Workspace with the role above.

## Useful follow-ups

```bash
# Login
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"owner@acme.local","password":"Password1"}'

# List members (use organization id printed by the seed)
curl -s http://localhost:3000/api/v1/members \
  -H "Authorization: Bearer <accessToken>" \
  -H "X-Organization-Id: <organizationId>"
```

## Code

| File | Purpose |
|---|---|
| `src/database/data-source.ts` | Standalone TypeORM data source |
| `src/database/seeds/seed-data.ts` | Seed constants (org + role users) |
| `src/database/seeds/run-seed.ts` | Seed runner |
