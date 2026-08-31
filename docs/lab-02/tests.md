# Lab 2 Test Plan and Results

## 1. Test Strategy

Tests are planned from the specification before implementation is declared complete. Use TDD for each issue: write a failing test for the agreed behavior, implement the smallest correct change, then refactor while keeping tests green. The final suite must include unit, API/integration, UI component, UI style, responsive/visual, and E2E coverage.

## 2. Planned Tests

| Test ID | Level | Acceptance criteria | What it tests | Expected result | Planned file |
|---|---|---|---|---|---|
| UNIT-01 | Unit | AC-01 | Idempotent seed | Repeated seed creates no duplicates | `server/tests/lab-02/reference-data.test.ts` |
| UNIT-02 | Unit | AC-03 | Ticket Number generator | Format is valid and values are unique | `server/tests/lab-02/ticket-number.test.ts` |
| UNIT-03 | Unit | AC-11 | Attachment validator | Type, size, and active-count rules are enforced | `server/tests/lab-02/attachment-validation.test.ts` |
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
| UI-05 | UI | AC-09 | Ticket Detail access state | Read-only fields and unauthorized/missing state | `client/tests/lab-02/RequesterTicketDetail.test.tsx` |
| UI-06 | UI | AC-10, AC-11, AC-12 | Attachment section | Valid/invalid, active/removed, download/remove controls | `client/tests/lab-02/AttachmentSection.test.tsx` |
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

- [ ] Zen Green tokens are applied consistently on every screen.
- [ ] Editable and read-only fields are visually distinct.
- [ ] Required markers and validation messages are visible near fields.
- [ ] Focus indicators are visible with keyboard navigation.
- [ ] Busy and disabled buttons are distinguishable.
- [ ] Success, warning, error, empty, and no-results states do not rely on color alone.
- [ ] Desktop, tablet, and mobile layouts have no clipping, overlap, or horizontal overflow.
- [ ] Screenshots are readable at normal zoom for Create Ticket, My Tickets, and Ticket Detail.

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

The E2E command and any required database/storage setup will be added when the chosen E2E runner and attachment adapter are approved.

## 6. Final Results

To be completed during Issue 7. Each planned test must record its final status, actual file path, command, and evidence link/screenshot where applicable. No test may be marked passed without execution evidence.

## 7. Known Limitations or Deferred Tests

- Exact text limits, priority values, E2E runner, and storage adapter must be approved and reflected in the contract before implementation.
- Visual screenshot paths will be populated after the screens exist.
- Any deferred test requires a reason, owner, and follow-up decision; it cannot be silently omitted.
