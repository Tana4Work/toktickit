# Lab 3 Sprint Engineering Specification

## 1. Sprint Goal

Replace the temporary Lab 2 Requester selector with secure authentication and role-based authorization. Deliver a working Requester regression path, an operational IT Staff ticket workflow, and a minimalist Administrator User Management screen while preserving Lab 2 Ticket and Attachment data.

## 2. Stakeholder Request

Real users must sign in with email and password. Requesters continue to manage their own tickets. IT Staff need a queue and ticket detail workflow for ownership, priority, status, comments, and private notes. Administrators manage basic user accounts. Every protected screen and API operation must enforce its role and ownership rules on the server.

## 3. Scope

### Included

- Authentication, logout, current-user retrieval, secure password storage, and mandatory first-login password change.
- Three roles: `Requester`, `IT Staff`, and `Administrator`; each user has exactly one role.
- Server-side role authorization and Requester ownership checks.
- Migration of Lab 2 Requester identity and existing Ticket/Attachment ownership to the User model.
- Requester Ticket and Attachment regression, Public Comments, and the Problem Appears Resolved indication.
- IT Staff Ticket Queue and Ticket Detail with ownership, IT Priority, status transitions, Public Comments, and Internal Notes.
- Minimalist Administrator User Management: list/search, create, edit, one-role assignment, activation/deactivation, and new initial password.
- PostgreSQL/Prisma model changes, idempotent seed data, REST API, Zen Green UI, responsive behavior, accessibility, tests, and final evidence.

### Explicitly excluded

Email invitations or password-reset email, MFA, social login, SSO, self-registration, Actions Taken, formal SLA/escalation/notification services, dashboards/KPI analytics, multi-tenant administration, production cloud deployment, multiple roles per user, user deletion, bulk operations, import/export, account history, extended profiles, and advanced identity-management workflows.

## 4. Roles and Authorization

| Role | Required behavior |
|---|---|
| Requester | Use authenticated identity; create and manage only owned Tickets and permitted Attachments; post Public Comments; indicate that a problem appears resolved. |
| IT Staff | View the Ticket Queue; open Tickets; claim/reassign ownership; set IT Priority; perform permitted status changes; post Public Comments; create Internal Notes. |
| Administrator | View, create, and edit users; assign one role; activate/deactivate accounts; set a new initial password. |

The backend is authoritative. Hidden or disabled UI controls do not replace API authorization. Administrator and IT Staff responsibilities remain conceptually separate unless the approved authorization matrix explicitly permits an operation.

## 5. Functional Requirements

- **FR-01 Authentication:** Active users with valid credentials can log in, log out, retrieve the current user, and receive safe errors for invalid or inactive accounts.
- **FR-02 First login:** A user with an initial password cannot enter normal application screens until a valid new password is saved.
- **FR-03 Role shell:** The application displays the current user and role and only presents permitted navigation.
- **FR-04 Requester identity:** Requester Ticket and Attachment operations use the authenticated identity, not a client-supplied `requesterId`.
- **FR-05 Requester regression:** Existing Lab 2 Ticket and Attachment functions continue to work after migration.
- **FR-06 Requester communication:** Requesters can create Public Comments and indicate that a problem appears resolved.
- **FR-07 Queue:** IT Staff can retrieve a searchable, filterable, sortable, paginated Ticket Queue.
- **FR-08 Staff operations:** Permitted IT Staff can open a Ticket, claim/reassign ownership, set IT Priority, and update permitted statuses.
- **FR-09 Comments and notes:** Public Comments are shared; Internal Notes are restricted to IT Staff and Administrators. Both are append-only and record backend author/time.
- **FR-10 User list:** Administrators can list users, search by name/email, and optionally filter by role.
- **FR-11 User administration:** Administrators can create and edit basic user information, assign one role, activate/deactivate accounts, and set a new initial password.
- **FR-12 Safety:** Duplicate emails, invalid roles, self-deactivation, and removal/deactivation of the last active Administrator are rejected.
- **FR-13 Migration:** Existing Categories, Related Systems, Tickets, and Attachments remain valid and correctly owned after migration.

## 6. Business Rules

- **BR-01:** Only an active user with valid credentials may authenticate.
- **BR-02:** A password-change-required user cannot access normal application screens before changing the password.
- **BR-03:** Authenticated identity determines Requester ownership; client-supplied identity cannot broaden access.
- **BR-04:** Public Comments are visible to Requester, IT Staff, and Administrator. Internal Notes are visible only to IT Staff and Administrator.
- **BR-05:** A Requester may indicate apparent resolution but cannot formally set a Ticket to Resolved or Closed.
- **BR-06:** A Ticket has zero or one primary owner, and the owner must be an active IT Staff or Administrator user.
- **BR-07:** IT Priority initially copies Requested Priority and may be changed only by permitted staff roles.
- **BR-08:** Required statuses are New, Open, In Progress, Waiting for Requester, Resolved, Closed, Reopened, and Cancelled. The approved transition matrix is authoritative.
- **BR-09:** Comments and Notes reject empty/whitespace-only content and are append-only in Lab 3.
- **BR-10:** A user has exactly one permitted role and email addresses are unique.
- **BR-11:** An Administrator cannot deactivate their own account or leave the system without an active Administrator.
- **BR-12:** Deactivation is used instead of user deletion.
- **BR-13:** Passwords are never stored in plaintext or exposed to client code.

## 7. Data Changes and Migration Decisions

Add a `User` model with name, unique email, password hash, one role, active state, password-change-required state, and timestamps. Add Ticket owner, IT Priority, Public Comment, and Internal Note relationships/fields as required by the approved Prisma migration. Preserve existing Ticket and Attachment records and map Lab 2 Requester records to Users. Seed behavior must be idempotent and include at least four active and one inactive Requester, three active and one inactive IT Staff user, one active Administrator, realistic Tickets, Comments, and Notes.

## 8. API Contract Summary

The API specification must define exact paths, methods, request/response shapes, authentication/session behavior, validation, safe errors, and status codes for:

- login, logout, current user, and password change;
- authenticated Lab 2 Ticket and Attachment operations;
- IT Staff Queue and Ticket Detail;
- claim/assign/reassign, IT Priority, status, Public Comments, and Internal Notes;
- Administrator user list/search/filter, create, edit, activation, and initial-password reset.

## 9. Acceptance Criteria

- **AC-01:** An active user with valid credentials receives authenticated access and their role.
- **AC-02:** A password-change-required user cannot access normal screens until a valid password change succeeds.
- **AC-03:** Requester operations always use the authenticated identity and cannot access another Requester's Ticket or Attachment.
- **AC-04:** Requesters cannot retrieve Internal Notes; the response does not leak note content.
- **AC-05:** IT Staff can find a Ticket in the Queue and perform only permitted ownership, priority, status, comment, and note operations.
- **AC-06:** Public Comments and Internal Notes have distinct visibility and backend author/time values.
- **AC-07:** Administrators can complete the required User Management operations and safety rules.
- **AC-08:** Existing Lab 2 data remains valid after migration and seed scripts are safe to rerun.
- **AC-09:** Required screens work on desktop, tablet, and mobile with safe loading, validation, empty, forbidden, not-found, conflict, and API-failure feedback.
- **AC-10:** Planned tests pass on the final main branch and every criterion maps to at least one test.

## 10. Definition of Done

- All approved requirements, rules, and acceptance criteria are implemented.
- API authorization is tested directly, not only through hidden UI controls.
- Migration preserves existing Ticket and Attachment ownership/data.
- `docs/lab-03/` is complete, rendered/reviewed, and linked from the final submission PDF.
- Unit, API/integration, UI, visual/style, responsive, security, migration/regression, and E2E tests pass.
- Peer review, screenshots, AI-use reflection, GitHub workflow, and final Answer Parts 1–9 evidence are complete.

## 11. Assumptions and Decisions

- A user has one role in Lab 3; multi-role authorization is excluded.
- Local development seed credentials are documented but never real personal secrets.
- The session/token mechanism, password hashing library, status-transition matrix, field length limits, and exact endpoint paths must be finalized in `api-spec.md` before implementation.
