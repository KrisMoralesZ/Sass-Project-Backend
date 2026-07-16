# Next implementation backlog for sass-backend

This document captures the next tasks and subtasks for the multi-tenant SaaS backend based on the current NestJS foundation already implemented in the repository.

## Current repo readiness

The backend already has:
- NestJS application bootstrap and module structure
- Config module with environment validation
- TypeORM + PostgreSQL integration
- Global exception handling, validation pipe, response envelope, API versioning, and Swagger
- Tenant context middleware and guard scaffolding
- Base tenant-scoped entities and repository helpers
- Shared DTOs, error codes, logging, and health checks

This means the next work should focus on domain modules and business workflows rather than bootstrap infrastructure.

---

## Recommended implementation order

1. Authentication
2. Organizations
3. Users and roles
4. Projects
5. Boards
6. Issues
7. Comments, attachments, notifications, activity, reports

---

## Phase 0 — Foundation and multi-tenancy base

This phase is the architectural base for the entire SaaS backend. Most of these items are already implemented in the repository and should be treated as the baseline for all later phases.

### Task 0.1 — Project architecture and conventions
Subtasks:
- Define the module structure under modules/, common/, database/, and config/
- Use TypeORM as the ORM layer
- Use PostgreSQL as the default database
- Create an environment configuration module with validation using class-validator
- Add a global exception filter, validation pipe, and consistent response envelope
- Configure API versioning with /api/v1
- Enable Swagger/OpenAPI documentation

Acceptance criteria:
- The API boots cleanly with a documented structure
- Configuration and validation work out of the box
- Swagger is available for the public API surface

### Task 0.2 — Multi-tenancy infrastructure
Subtasks:
- Define the tenant context and resolve organizationId from the JWT or request header
- Add middleware and guards that enforce tenant context on protected routes
- Create a base entity pattern with organizationId, timestamps, and soft delete support
- Add tenant-scoped query helpers and repository behavior that enforce organization isolation
- Document which entities are global versus tenant-scoped

Acceptance criteria:
- Every tenant-aware request resolves an active organization context
- Tenant-scoped repositories prevent cross-tenant data access by default
- The multi-tenancy model is documented and reusable for future modules

### Task 0.3 — Shared cross-cutting concerns
Subtasks:
- Add reusable pagination, sorting, and filtering DTOs
- Define a standard set of error codes and error messages
- Add request-scoped logging with request ID, user ID, and organization ID
- Add health endpoints for liveness and readiness checks

Acceptance criteria:
- Shared API conventions are consistent across modules
- Errors are predictable and easy to handle on the client side
- Monitoring and observability hooks are available from the start

---

## Phase 1 — Authentication

### Task 1.1 — Auth module scaffolding
Subtasks:
- Create the auth module, controller, service, and DTOs with Nest CLI
- Add password hashing with bcrypt or argon2
- Add JWT access/refresh token support
- Create public/auth guards and decorators
- Add Swagger documentation for auth endpoints

Acceptance criteria:
- Auth module exists and is registered in the app
- Public routes can be marked explicitly
- Auth endpoints are documented and protected as intended

### Task 1.2 — Registration flow
Subtasks:
- Create POST /auth/register
- Validate email uniqueness and password rules
- Create the initial user entity and profile linkage
- Return access/refresh tokens on successful registration

Acceptance criteria:
- A user can register and receive valid auth tokens
- Duplicate email attempts fail cleanly

### Task 1.3 — Login and session management
Subtasks:
- Create POST /auth/login
- Create POST /auth/refresh
- Create POST /auth/logout
- Create GET /auth/me

Acceptance criteria:
- Existing users can authenticate and receive tokens
- Refresh flow works without breaking existing sessions

### Task 1.4 — Security hardening
Subtasks:
- Rate limit auth routes
- Enforce password strength rules
- Add account lockout or failed-attempt tracking as a future enhancement

Acceptance criteria:
- Basic auth security is in place for v1

---

## Phase 2 — Organizations

### Task 2.1 — Organization entity and CRUD
Subtasks:
- Create the Organization entity with name, slug, settings, and plan placeholder
- Create organization CRUD endpoints
- Add slug uniqueness validation
- Add organization membership link to the user model

Acceptance criteria:
- A user can create or access an organization
- Organization records are tenant-scoped by organizationId

### Task 2.2 — Organization settings
Subtasks:
- Add default timezone, locale, and branding placeholders
- Add organization feature flags placeholder
- Support archive/soft delete behavior

Acceptance criteria:
- Organization settings can be updated safely
- Archived organizations are hidden from active workflows

### Task 2.3 — Organization context switching
Subtasks:
- Define whether a user can belong to multiple organizations in v1
- Add membership validation before tenant context is accepted
- Ensure the request context can resolve the correct organization consistently

Acceptance criteria:
- A user can work within the correct organization context for all downstream modules

---

## Phase 3 — Users and roles

### Task 3.1 — Users module
Subtasks:
- Create the user profile entity and profile update flows
- Add profile fields such as displayName, avatar, and preferences
- Create list and detail endpoints for organization members

Acceptance criteria:
- Users can view and update their own profile
- Organization members can be listed by workspace

### Task 3.2 — Roles and permissions
Subtasks:
- Define base roles: OWNER, ADMIN, MEMBER, VIEWER
- Create a permission matrix for projects, boards, issues, invites, and settings
- Create an OrganizationMember join entity with role data
- Add role-based guards and decorators

Acceptance criteria:
- Role-based access control exists for the core modules
- The permission model is reusable across future modules

### Task 3.3 — Invitation system
Subtasks:
- Create the Invitation entity
- Add invite creation, acceptance, and revoke endpoints
- Add token-based invitation flow
- Add an email delivery stub for development

Acceptance criteria:
- Owners can invite new members to the organization
- Invited users can accept the invitation and join the workspace

### Task 3.4 — Member management
Subtasks:
- Add role update endpoints
- Add member removal endpoints
- Prevent removal of the last owner

Acceptance criteria:
- Organization administrators can manage membership safely

---

## Phase 4 — Projects

### Task 4.1 — Project CRUD
Subtasks:
- Create the Project entity
- Add project create/list/detail/update/delete endpoints
- Add tenant scoping to all project queries

Acceptance criteria:
- Organization members can create and manage projects

### Task 4.2 — Project membership and visibility
Subtasks:
- Decide whether project access is org-wide or project-scoped for v1
- Add project visibility support
- Add project member management if needed

Acceptance criteria:
- Project access rules are clear and enforced

---

## Phase 5 — Boards

### Task 5.1 — Board CRUD
Subtasks:
- Create the Board entity and board endpoints
- Link boards to projects
- Add board type support such as KANBAN and SCRUM

Acceptance criteria:
- A project can contain one or more boards

### Task 5.2 — Board columns
Subtasks:
- Create board column entities and CRUD endpoints
- Add default columns on board creation
- Add column reorder support

Acceptance criteria:
- Boards have configurable workflow columns

---

## Phase 6 — Issues (tasks)

### Task 6.1 — Issue CRUD
Subtasks:
- Create the Issue entity
- Add create/list/detail/update/delete endpoints
- Link issues to projects, boards, and columns

Acceptance criteria:
- Users can create and manage issues inside a board workflow

### Task 6.2 — Issue assignment and movement
Subtasks:
- Add assignee and reporter fields
- Add assignment endpoints
- Add drag-and-drop style move endpoint between columns
- Emit activity events when issue state changes

Acceptance criteria:
- Issues can be assigned and moved through workflow stages

---

## Phase 7 — Collaboration modules

### Task 7.1 — Comments
Subtasks:
- Create the Comment entity and CRUD endpoints
- Attach comments to issues
- Enforce author-only edit/delete rules

### Task 7.2 — Attachments
Subtasks:
- Add attachment storage support
- Create upload and list endpoints for issue files
- Add file validation and size limits

---

## Phase 8 — Activity, notifications, and reports

### Task 8.1 — Activity stream
Subtasks:
- Create the Activity entity and event emission flow
- Add issue and project activity endpoints

### Task 8.2 — Notifications
Subtasks:
- Create notification entities and endpoints
- Trigger notifications for assignments and mentions

### Task 8.3 — Reports
Subtasks:
- Add summary reports by project and organization
- Add basic analytics for task progress and workload

---

## Suggested execution checklist for the next implementation pass

- [ ] Scaffold auth module and initial DTOs
- [ ] Implement registration and login flows
- [ ] Add JWT auth guards and public decorators
- [ ] Create organization entity and first organization creation flow
- [ ] Link user accounts to organizations and membership
- [ ] Add role-based permission scaffolding
- [ ] Create projects and board modules
- [ ] Implement issue CRUD and assignment workflow

## Planning note

The implementation should stay aligned with the existing conventions:
- Use Nest CLI generation inside the modules folder
- Keep tenant scoping on every domain entity and repository
- Use DTO validation and shared error handling
- Keep each module testable in isolation before moving to the next workflow step
