# Lab 3 Test Plan and Traceability

Tests are planned before implementation is considered complete. Each test follows TDD where practical: write a failing test for the agreed behavior, implement the smallest correct change, then refactor while keeping the test green.

## Required Coverage

- Unit and model/business-rule tests
- API/integration tests
- UI component tests
- UI style/visual tests
- Responsive and accessibility tests
- Security/authorization tests
- Migration/regression tests
- End-to-end tests

## Planned Test Matrix

| Test ID | Type | Requirement/AC | What it tests | Planned file |
|---|---|---|---|---|
| AUTH-01 | API | AC-01 | Valid and invalid login; safe response | `server/tests/lab-03/auth.api.test.ts` |
| AUTH-02 | API/E2E | AC-02 | Initial password login and mandatory change | `server/tests/lab-03/auth.api.test.ts`, `e2e/lab-03/authentication.spec.ts` |
| AUTH-03 | API | AC-01 | Logout, current user, inactive account, and session invalidation | `server/tests/lab-03/auth.api.test.ts` |
| AUTHZ-01 | API | AC-03/04 | Direct role and ownership authorization; no data leakage | `server/tests/lab-03/authorization.api.test.ts` |
| MIG-01 | Migration | AC-08 | Lab 2 data remains valid and ownership is mapped | `server/tests/lab-03/migration.api.test.ts` |
| REG-01 | API/UI | AC-03 | Requester Ticket and Attachment regression without selector | `server/tests/lab-03/requester-regression.api.test.ts` |
| REG-02 | API/UI | AC-06 | Public Comments and resolution indication | `server/tests/lab-03/comments-notes.api.test.ts` |
| QUEUE-01 | API/UI | AC-05 | Queue search, filters, sorting, pagination, and states | `server/tests/lab-03/staff-queue.api.test.ts`, `client/tests/lab-03/StaffTicketQueue.test.tsx` |
| STAFF-01 | API/UI | AC-05/06 | Ownership, priority, statuses, comments, notes, and Attachments | `server/tests/lab-03/staff-ticket-detail.api.test.ts`, `client/tests/lab-03/StaffTicketDetail.test.tsx` |
| ADMIN-01 | API/UI | AC-07 | User list, search, optional role filter, create, edit | `server/tests/lab-03/users-admin.api.test.ts`, `client/tests/lab-03/UserManagement.test.tsx` |
| ADMIN-02 | API | AC-07 | Duplicate email, one role, activation, self-deactivation, last active Administrator | `server/tests/lab-03/users-admin.api.test.ts` |
| STYLE-01 | Visual | AC-09 | Zen Green tokens, badges, editable/read-only fields, validation | `client/tests/lab-03/ZenGreen.visual.test.tsx` |
| RESP-01 | Responsive | AC-09 | Desktop/tablet/mobile layout, clipping, overflow, focus | `e2e/lab-03/responsive.spec.ts` |
| E2E-01 | E2E | AC-01/02 | Authentication, first-login change, logout | `e2e/lab-03/authentication.spec.ts` |
| E2E-02 | E2E | AC-05/06 | IT Staff queue, detail, ownership, comments, notes | `e2e/lab-03/staff-ticket-flow.spec.ts` |
| E2E-03 | E2E | AC-07 | Administrator user-management flow | `e2e/lab-03/user-administration.spec.ts` |

## Acceptance-Criteria Traceability

| Criterion | Planned tests |
|---|---|
| AC-01 | AUTH-01, AUTH-03, E2E-01 |
| AC-02 | AUTH-02, E2E-01 |
| AC-03 | AUTHZ-01, REG-01, MIG-01 |
| AC-04 | AUTHZ-01 |
| AC-05 | QUEUE-01, STAFF-01, E2E-02 |
| AC-06 | REG-02, STAFF-01, E2E-02 |
| AC-07 | ADMIN-01, ADMIN-02, E2E-03 |
| AC-08 | MIG-01, REG-01 |
| AC-09 | STYLE-01, RESP-01, E2E-01, E2E-02, E2E-03 |
| AC-10 | Final full-suite output from the main branch |

## Final Evidence Checklist

- [ ] Unit/model tests pass.
- [ ] API/integration and direct authorization tests pass.
- [ ] UI component and visual/style tests pass.
- [ ] Responsive and accessibility checks pass at desktop, tablet, and mobile sizes.
- [ ] Migration/regression tests pass against preserved Lab 2 data.
- [ ] E2E authentication, staff workflow, and administration tests pass.
- [ ] Test output and file paths are recorded in the final submission.
