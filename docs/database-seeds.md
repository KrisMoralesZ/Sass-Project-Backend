# Database seeds (task 3.2.3, extended by 3.3.8)

Development seeds for verifying the `OrganizationMember` join entity, base roles, and the organization invitation flow.

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

### Pending invitation (task 3.3.8)

One `pending` invitation is created for local QA of the invite + accept flow:

| Field | Value |
|---|---|
| Email | `invitee@acme.local` (not a seed user) |
| Role on accept | `MEMBER` |
| Invited by | `owner@acme.local` |
| Raw token | Fixed: `seed-invite-token-for-local-qa-0001` (stored hashed) |

The seed prints the accept URL:

```text
Pending invitation for local QA:
  - invitee@acme.local (pending)
  - accept URL: http://localhost:5173/invites/accept?token=seed-invite-token-for-local-qa-0001
```

Register (or sign up) as `invitee@acme.local`, then open that URL to join Acme Workspace. Re-running the seed never resurrects a terminal invitation: `accepted` / `revoked` rows are left as they are, and a `pending` invite past its TTL is extended.

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

# List pending invitations
curl -s http://localhost:3000/api/v1/invites \
  -H "Authorization: Bearer <accessToken>" \
  -H "X-Organization-Id: <organizationId>"

# Accept the seeded invitation (no X-Organization-Id required)
curl -s -X POST http://localhost:3000/api/v1/invites/accept \
  -H "Authorization: Bearer <inviteeAccessToken>" \
  -H 'Content-Type: application/json' \
  -d '{"token":"seed-invite-token-for-local-qa-0001"}'
```

## Code

| File | Purpose |
|---|---|
| `src/database/data-source.ts` | Standalone TypeORM data source |
| `src/database/seeds/seed-data.ts` | Seed constants (org + role users + pending invitation) |
| `src/database/seeds/run-seed.ts` | Seed runner |
