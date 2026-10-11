# Lab 4 Test Plan and Traceability

Tests are planned before implementation is considered complete. Each test should follow TDD where practical: define the expected failure, implement the smallest correct behavior, then refactor while keeping the test green.

## Planned Test Matrix

| Test ID | Type | Requirement / AC | What it tests | Planned file |
|---|---|---|---|---|
| DATA-01 | Migration | FR-01/AC-04 | ActionTaken relationship, fields, indexes, and preserved Lab 3 data | `server/tests/lab-04/actions-taken.api.test.ts` |
| DATA-02 | Seed | FR-01/FR-07 | Idempotent seed; zero/one/multiple Actions Taken and dashboard cases | `server/tests/lab-04/migration-regression.api.test.ts` |
| API-01 | API | AC-01 | Create valid Action Taken with authenticated performer | `server/tests/lab-04/actions-taken.api.test.ts` |
| API-02 | API | AC-02 | Required fields, follow-up validation, dates, and inactive assignment | `server/tests/lab-04/actions-taken.api.test.ts` |
| API-03 | API/security | AC-03 | Requester read-only ownership and staff/admin write authorization | `server/tests/lab-04/actions-taken.api.test.ts` |
| API-04 | API | AC-04 | List ordering, update behavior, duplicate retry, stale/conflict handling | `server/tests/lab-04/actions-taken.api.test.ts` |
| FLOW-01 | API/workflow | AC-05/06 | Status matrix, resolution gate, and advisory Requester indication | `server/tests/lab-04/workflow-dashboards.api.test.ts`, existing Lab 3 workflow coverage |
| DASH-01 | API/security | AC-07 | Requester dashboard calculations and ownership protection | `server/tests/lab-04/workflow-dashboards.api.test.ts` |
| DASH-02 | API | AC-08 | Staff/Admin dashboard calculations, empty states, and drill-down data | `server/tests/lab-04/workflow-dashboards.api.test.ts` |
| UI-01 | Component | AC-01/02/03/04 | Actions Taken list, create/edit/read-only modes, validation, feedback | `client/tests/lab-04/ActionsTakenPanel.test.tsx` |
| UI-02 | Component | AC-05/06 | Ticket workflow controls and status refresh | `client/tests/lab-04/TicketWorkflow.test.tsx` |
| UI-03 | Component | AC-07 | Requester dashboard metrics, empty state, and drill-down | `client/tests/lab-04/RequesterDashboard.test.tsx`, `client/tests/lab-04/Dashboard.test.tsx` |
| UI-04 | Component | AC-08 | Staff dashboard cards, lists, forbidden state, and drill-down | `client/tests/lab-04/StaffDashboard.test.tsx`, `client/tests/lab-04/Dashboard.test.tsx` |
| STYLE-01 | Visual/accessibility | AC-09 | Zen Green consistency, focus, labels, status cues, and field modes | `client/tests/lab-04/ZenGreen.visual.test.tsx` |
| RESP-01 | Responsive | AC-09 | Desktop/tablet/mobile clipping, overlap, and horizontal overflow | `e2e/lab-04/dashboards.spec.ts` |
| E2E-01 | E2E | AC-01/03/04 | Actions Taken staff and requester flow | `e2e/lab-04/actions-taken-flow.spec.ts` |
| E2E-02 | E2E | AC-05/06 | Ticket resolution, reopen, complete, and cancel workflow | `e2e/lab-04/ticket-resolution.spec.ts` plus API transition coverage |
| E2E-03 | E2E | AC-07/08 | Requester and Staff dashboards with drill-down | `e2e/lab-04/dashboards.spec.ts` |
| REG-01 | Regression | AC-09 | Lab 1-3 authentication, Ticket, attachment, comment, note, and admin behavior | `server/tests/lab-04/migration-regression.api.test.ts` |
| PERF-01 | Smoke | AC-10 | Health, dashboard, and Ticket detail response smoke checks | `server/tests/lab-04/performance-smoke.test.ts` |

## Acceptance-Criteria Traceability

| Criterion | Planned tests |
|---|---|
| AC-01 | API-01, UI-01, E2E-01 |
| AC-02 | API-02, UI-01 |
| AC-03 | API-03, UI-01, E2E-01 |
| AC-04 | DATA-01, DATA-02, API-04, E2E-01 |
| AC-05 | FLOW-01, UI-02, E2E-02 |
| AC-06 | FLOW-01, UI-02, E2E-02 |
| AC-07 | DASH-01, UI-03, E2E-03 |
| AC-08 | DASH-02, UI-04, E2E-03 |
| AC-09 | REG-01, STYLE-01, RESP-01 |
| AC-10 | All planned tests and final full-suite output |

## Final Evidence Checklist

- [x] Unit/model and business-rule tests pass.
- [x] API/integration and direct authorization tests pass.
- [x] UI component and visual/style tests pass.
- [x] Responsive dashboard checks pass at desktop, tablet, and mobile sizes.
- [x] Migration and seed regression tests pass against preserved Lab 3 data.
- [x] Workflow, dashboard, and Actions Taken E2E tests pass.
- [x] Performance-smoke checks pass.
- [ ] Test output and file paths are recorded for final submission.

## Issue 5 Progress

- Client regression tests were updated for the authenticated Lab 3/4 entry flow instead of the retired Lab 2 requester selector.
- Current client component regression result: 9 test files and 19 tests passing with `npx vitest run` from `client/`.
- Server regression, migration/seed verification, responsive browser checks, and performance smoke checks pass locally.
- Dedicated dashboard and workflow component tests were added; the client suite now includes dedicated Lab 4 coverage.
- Dedicated Lab 4 dashboard E2E and desktop/tablet/mobile overflow checks were added and pass locally.
- Dedicated browser coverage now covers Actions Taken creation, Ticket status control, requester/staff dashboards, drill-down, and responsive overflow checks.
- Live accessibility evidence, screenshots, reviewer records, final test-output capture, and final integration remain follow-up work.
