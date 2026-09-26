# Lab 3 Test Plan and Traceability

Tests are planned before implementation is considered complete. Each test follows TDD where practical: write a failing test for the agreed behavior, implement the smallest correct change, then refactor while keeping the test green.

The plan is the Test DD deliverable and is maintained alongside the specification before implementation. Final results must be recorded from the final integrated branch, not inferred only from generated tests.

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
| REG-02 | API/UI | AC-06 | Public Comments and resolution indication | `server/tests/lab-03/comments.api.test.ts` |
| QUEUE-01 | API/UI | AC-05 | Queue search, filters, sorting, pagination, and states | `server/tests/lab-03/staff-queue.api.test.ts`, `client/tests/lab-03/StaffTicketQueue.test.tsx` |
| STAFF-01 | API/UI | AC-05/06 | Queue, ownership, priority, statuses, comments, notes, and Attachments | `server/tests/lab-03/staff-ticket-workflow.api.test.ts`, `client/tests/lab-03/StaffTicketDetail.test.tsx` |
| ADMIN-01 | API/UI | AC-07 | User list, search, optional role filter, create, edit | `server/tests/lab-03/users-admin.api.test.ts`, `client/tests/lab-03/UserManagement.test.tsx` |
| ADMIN-02 | API | AC-07 | Duplicate email, one role, activation, self-deactivation, last active Administrator | `server/tests/lab-03/users-admin.api.test.ts` |
| STYLE-01 | Visual | AC-09 | Zen Green tokens, badges, editable/read-only fields, validation | `client/tests/lab-03/ZenGreen.visual.test.tsx` |
| RESP-01 | Responsive | AC-09 | Desktop/tablet/mobile layout, clipping, overflow, focus | `e2e/lab-03/responsive.spec.ts` |
| E2E-01 | E2E | AC-01/02 | Authentication, first-login change, logout | `e2e/lab-03/authentication.spec.ts` |
| E2E-02 | E2E | AC-05/06 | IT Staff queue, detail, ownership, comments, notes | `e2e/lab-03/staff-ticket-flow.spec.ts` |
| E2E-03 | E2E | AC-07 | Administrator user-management flow | `e2e/lab-03/user-administration.spec.ts` |

## Issue 6 QA Evidence

| Evidence ID | Coverage | Actual file or artifact | Current result |
|---|---|---|---|
| QA-01 | Authentication safe failure and first-login continuation | `e2e/lab-03/authentication.spec.ts`, `artifacts/lab-03/screenshots/authentication/` | Pass: local Playwright run; desktop/tablet/mobile login captures present |
| QA-02 | Desktop/tablet/mobile login layout and horizontal overflow | `e2e/lab-03/responsive.spec.ts` | Pass: 3 viewport checks |
| QA-03 | Zen Green brand/status/focus UI hooks | `client/tests/lab-03/ZenGreen.visual.test.tsx` | Pass: local Vitest run |
| QA-04 | IT Staff authenticated queue entry | `e2e/lab-03/staff-ticket-flow.spec.ts` | Pass: local Playwright run |
| QA-05 | Administrator authenticated User Management entry | `e2e/lab-03/user-administration.spec.ts` | Pass: local Playwright run |

The Lab 3 Playwright run currently reports 7 passing tests. Screenshot evidence paths are documented in `ui-spec.md` and must be included in the final PDF under Answer Part 9.

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

## Final Submission Mapping

The single final PDF must use the exact headings `Answer Part 1` through `Answer Part 9`. This repository supports the evidence as follows:

| Answer Part | Primary repository evidence |
|---|---|
| 1 | Git history, branches, PRs, `reviewer.md`, README, and repository structure |
| 2 | `specification.md` |
| 3 | This file, test output, traceability table, and actual test paths |
| 4 | `ai-use.md` |
| 5 | Authentication implementation, tests, and authentication screenshots |
| 6 | Staff Queue implementation, tests, and staff queue screenshots |
| 7 | Staff Ticket Detail implementation, authorization tests, and detail screenshots |
| 8 | Administrator User Management implementation, tests, and user-management screenshots |
| 9 | `ui-spec.md` plus desktop/tablet/mobile screenshots and completed visual checklist |
