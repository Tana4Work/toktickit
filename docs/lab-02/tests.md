# Lab 2 Test Plan and Results

## 1. Test Strategy

Tests are planned from the specification before implementation is declared complete. Use TDD for each issue: write a failing test for the agreed behavior, implement the smallest correct change, then refactor while keeping tests green. The final suite must include unit, API/integration, UI component, UI style, responsive/visual, and E2E coverage.

## 2. Planned Tests

| Test ID | Level | Acceptance criteria | What it tests | Expected result | Planned file |
|---|---|---|---|---|---|
| UNIT-01 | Unit/API | AC-01 | Idempotent seed | Repeated seed creates no duplicates | `server/tests/lab-02/reference-data.api.test.ts` |
| UNIT-02 | API/integration | AC-03 | Ticket Number generator | Backend-generated format and idempotent uniqueness are verified | `server/tests/lab-02/create-ticket.api.test.ts` |
| UNIT-03 | API/integration | AC-11 | Attachment validator | Type, size, and active-count rules are enforced | `server/tests/lab-02/attachments.api.test.ts` |
| API-01 | API | AC-01, AC-02 | Active reference data | Required records load; inactive requester is excluded | `server/tests/lab-02/reference-data.api.test.ts` |
| API-02 | API | AC-03 | Valid ticket creation | `201`, one persisted Ticket, official values returned | `server/tests/lab-02/create-ticket.api.test.ts` |
| API-03 | API | AC-04 | Invalid ticket creation | `400`; no Ticket persisted | `server/tests/lab-02/create-ticket.api.test.ts` |
| API-04 | API | AC-05 | Repeated create/retry | No duplicate Ticket; conflict behavior is stable | `server/tests/lab-02/create-ticket.api.test.ts` |
| API-05 | API | AC-06 | Create failure | Safe error and consistent persistence behavior | `server/tests/lab-02/create-ticket.api.test.ts` |
| API-06 | API | AC-07, AC-08 | Owned ticket list | Search, filters, sorting, pagination, metadata | `server/tests/lab-02/my-tickets.api.test.ts` |
| API-07 | API | AC-09 | Ownership protection | Another requester cannot retrieve a Ticket | `server/tests/lab-02/ticket-detail.api.test.ts` |
| API-08 | API | AC-10, AC-11 | Attachment upload | Ownership and type/size/count validation | `server/tests/lab-02/attachments.api.test.ts` |
| API-09 | API | AC-10, AC-12 | Attachment download/remove | Active download works; soft removal blocks file access | `server/tests/lab-02/attachments.api.test.ts` |
| API-10 | API | AC-13 | Ticket/attachment partial failure | No false active metadata after upload failure | `server/tests/lab-02/attachments.api.test.ts` |
| UI-01 | UI | AC-02 | Requester selection | Loads active users, Continue, switch, loading/empty/error | `client/tests/lab-02/RequesterSelection.test.tsx` |
| UI-02 | UI | AC-03, AC-04 | Create Ticket form | Fields, validation, and API payload | `client/tests/lab-02/CreateTicket.test.tsx` |
| UI-03 | UI | AC-05, AC-06 | Create submit states | Busy disabled state, success number, preserved values | `client/tests/lab-02/CreateTicket.test.tsx` |
| UI-04 | UI | AC-07, AC-08 | My Tickets controls | Search, filters, Clear Filters, sorting, pagination states | `client/tests/lab-02/MyTickets.test.tsx` |
| UI-05 | UI | AC-09 | Ticket Detail access state | Read-only fields and unauthorized/missing state | `client/tests/lab-02/TicketDetail.test.tsx` |
| UI-06 | UI | AC-10, AC-11, AC-12 | Attachment section | Existing-ticket upload plus active/removed metadata and controls | `client/tests/lab-02/TicketDetail.test.tsx` |
| STYLE-01 | Visual | AC-14 | Zen Green tokens | All screens use approved colors and field/button states | `client/tests/lab-02/ZenGreen.visual.test.tsx` |
| RESP-01 | Responsive | AC-14 | Responsive layout | Desktop/tablet/mobile have no clipping or overflow | `e2e/lab-02/responsive.spec.ts` |
| E2E-01 | E2E | AC-01-AC-06 | Create flow | Select requester, create ticket, see official number | `e2e/lab-02/requester-ticket-flow.spec.ts` |
| E2E-02 | E2E | AC-07-AC-10 | Owned list/detail flow | Switch requester, search, open owned detail | `e2e/lab-02/requester-ticket-flow.spec.ts` |
| E2E-03 | E2E | AC-10-AC-13 | Attachment lifecycle | Upload, download, remove, retained metadata, blocked download | `e2e/lab-02/requester-ticket-flow.spec.ts` |

## 3. Acceptance-Criterion Traceability

| Criterion | Planned tests |
|---|---|
| AC-01 | UNIT-01, API-01, E2E-01 |
| AC-02 | API-01, UI-01, E2E-01 |
| AC-03 | UNIT-02, API-02, UI-02, UI-03, E2E-01 |
| AC-04 | API-03, UI-02 |
| AC-05 | API-04, UI-03 |
| AC-06 | API-05, UI-03 |
| AC-07 | API-06, UI-04, E2E-02 |
| AC-08 | API-06, UI-04, E2E-02 |
| AC-09 | API-07, UI-05, E2E-02 |
| AC-10 | API-08, API-09, UI-06, E2E-03 |
| AC-11 | UNIT-03, API-08, UI-06 |
| AC-12 | API-09, UI-06, E2E-03 |
| AC-13 | API-10, E2E-03 |
| AC-14 | STYLE-01, RESP-01, E2E-01, E2E-02 |
| AC-15 | All final test commands and evidence |

## 4. Responsive and Visual Checklist

- [x] Zen Green tokens are applied consistently in the source stylesheet.
- [x] Editable and read-only fields are represented in the UI implementation.
- [x] Required markers and validation messages are implemented near fields.
- [x] Focus indicators are implemented with `:focus-visible` styles.
- [x] Busy and disabled buttons are implemented.
- [x] Success, warning, error, empty, and no-results states are implemented with text.
- [ ] Desktop, tablet, and mobile live viewport checks require browser access.

## 5. Test Commands

From `server/`:

```powershell
npm test
npm run build
```

From `client/`:

```powershell
npm test
npm run build
```

From the repository root, after PostgreSQL is running and seeded:

```powershell
npm install
npx playwright install chromium
npm run test:e2e
```

The Playwright runner is configured in `playwright.config.ts` and the requester flow is at `e2e/lab-02/requester-ticket-flow.spec.ts`.

## 6. Final Results

Executed on 2026-09-04 from the repository workspace:

| Suite | Command | Result | Evidence |
|---|---|---|---|
| Server unit/API/integration | `cd server; npm test -- --run` | PASS - 8 files, 21 tests | Vitest terminal output with TokTickIT PostgreSQL running |
| Server production build | `cd server; npm run build` | PASS | TypeScript compiler output |
| Client unit/UI | `cd client; npm test -- --run` | PASS - 5 files, 10 tests | Vitest terminal output |
| Client production build | `cd client; npm run build` | PASS | Vite production build output |
| Responsive/visual live check | Browser inspection | PENDING | Browser tool unavailable in this run |
| E2E requester ticket flow | `npm run test:e2e` | PASS - 1 test | Playwright Chromium run; development-server teardown required manual interruption after the passing result |

The executable suites cover reference data, requester selection, ticket creation with attachments, owned tickets, read-only ticket detail, attachment API lifecycle, size/count boundaries, validation, ownership, download, and soft removal. Browser-only screenshots, responsive checks, and the complete E2E flow remain explicit follow-up items.

## 7. Known Limitations or Deferred Tests

- Playwright is configured and the requester ticket-flow test passes with PostgreSQL running. On this Windows setup, the wrapper may remain open during development-server teardown after the passing result is printed.
- The source includes responsive CSS and visible focus rules, but these require manual browser verification before release approval.
- Owner: student/reviewer. Follow-up: run the documented manual checklist in `reviewer.md` and attach screenshots before creating the release PR.
- No test is silently omitted; pending checks are recorded above.

## 8. Final Acceptance-Criteria Status

| Criteria | Status | Evidence |
|---|---|---|
| AC-01 through AC-13 | PASS | Server/client automated suites and implementation review |
| AC-14 | PARTIAL | Source-level responsive/accessibility review; live viewport check pending |
| AC-15 | PARTIAL | Automated commands pass; screenshots/E2E/release integration pending |
