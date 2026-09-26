# Lab 3 API Specification

## Conventions

- Base URL: `/api`.
- JSON responses use ISO-8601 UTC timestamps and safe structured errors: `{ "error": { "code": "...", "message": "..." } }`.
- Authentication uses an opaque bearer token in the `Authorization: Bearer <token>` header. The server stores only a SHA-256 token hash in `Session`.
- Sessions expire after eight hours and are invalidated by logout. Inactive users cannot authenticate or continue an existing session.
- Passwords are stored as salted `scrypt` hashes. A valid password is 8-128 characters; password hashes and tokens never appear in responses.
- `401` means unauthenticated, `403` means authenticated but forbidden, `404` means an inaccessible/missing resource without leaking protected existence, `409` means a conflict, and `422` means valid JSON with invalid business input.
- Authentication failures intentionally use the same safe message for unknown, invalid, and inactive accounts. Login does not reveal whether an email exists.
- Passwords are never returned, logged, or placed in client-side source. Local seed credentials are for development and demonstration only.

## Authentication

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/login` | Authenticate active user with email/password; return user, role, and password-change-required state. |
| POST | `/auth/logout` | Invalidate authenticated access. |
| GET | `/auth/me` | Return the current authenticated user and role. |
| POST | `/auth/change-password` | Save a valid new password and clear password-change-required state. |

All application APIs require authentication and a completed initial password change. Requests made with an initial password receive `403 PASSWORD_CHANGE_REQUIRED` until `/auth/change-password` succeeds.

The browser stores the opaque token only for the local session, sends it in the `Authorization` header, and clears it on logout or an invalid-session response. CSRF protection is not required for this bearer-header API because browsers do not attach the token automatically to cross-site requests.

## Requester APIs

Continue all Lab 2 Ticket and Attachment APIs, but derive ownership from the authenticated user. The legacy `requesterId` query/body value is ignored for authorization and cannot broaden access. Add:

| Method | Path | Purpose |
|---|---|---|
| POST | `/tickets/:ticketId/comments` | Create a Public Comment for an owned/accessible Ticket. |
| GET | `/tickets/:ticketId/comments` | Retrieve visible Public Comments. |
| POST | `/tickets/:ticketId/problem-resolved` | Record the Requester's resolution indication. |

## IT Staff APIs

IT Staff and Administrators may use these endpoints after authentication and password change. Queue results support `search`, `status`, `priority`, `owner` (`all`, `unassigned`, or a User ID), `sortBy`, `sortDirection`, `page`, and `pageSize`. Owner assignment accepts active IT Staff or Administrator users only. IT Priority starts equal to Requested Priority. Statuses are `New`, `Open`, `InProgress`, `WaitingForRequester`, `Resolved`, `Closed`, `Reopened`, and `Cancelled`; invalid transitions return `422`.

Queue defaults are `page=1`, `pageSize=10`, `sortBy=updatedAt`, and `sortDirection=desc`. Search covers ticket number, summary, and requester name. Invalid page, page size, sort, status, priority, owner, or transition values return a safe `400` or `422` response.

| Method | Path | Purpose |
|---|---|---|
| GET | `/staff/tickets` | Queue retrieval with documented search, filters, sorting, pagination, and metadata. |
| GET | `/staff/tickets/:ticketId` | Retrieve a Ticket for permitted staff operations. |
| PATCH | `/staff/tickets/:ticketId/owner` | Claim, assign, or reassign ownership. |
| PATCH | `/staff/tickets/:ticketId/priority` | Update IT Priority. |
| PATCH | `/staff/tickets/:ticketId/status` | Apply a permitted status transition. |
| POST | `/staff/tickets/:ticketId/comments` | Create a Public Comment. |
| GET | `/staff/tickets/:ticketId/comments` | Retrieve Public Comments. |
| POST | `/staff/tickets/:ticketId/notes` | Create an Internal Note for permitted roles. |
| GET | `/staff/tickets/:ticketId/notes` | Retrieve Internal Notes for permitted roles. |

## Administrator APIs

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/users` | List users with name/email search and optional role filter. |
| POST | `/admin/users` | Create a user with one role, activation state, and initial password. |
| PATCH | `/admin/users/:userId` | Update name, email, role, and activation state. |
| POST | `/admin/users/:userId/initial-password` | Set a new initial password and require change at next login. |

## Validation and safe-failure rules

- Name and comment fields reject empty or whitespace-only values and enforce their documented length limits.
- Passwords are accepted only from 8 through 128 characters; first-login and reset passwords set `mustChangePassword=true`.
- Duplicate emails return `409 DUPLICATE_EMAIL`; invalid roles and malformed payloads return `400`.
- Self-deactivation and removal of the last active Administrator return `422`.
- Requesters cannot access another Requester's Ticket, Attachment, or Internal Note, and forbidden responses do not disclose protected content.
