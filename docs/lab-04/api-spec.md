# Lab 4 API Specification

## Conventions

- Base URL: `/api`.
- JSON errors use `{ "error": { "code": "...", "message": "..." } }`.
- Existing Lab 3 bearer-token authentication and role model remain the baseline.
- `401` means unauthenticated, `403` means authenticated but forbidden, `404` means inaccessible/missing without protected-record leakage, `409` means stale/concurrent conflict, and `422` means valid JSON with invalid business input.
- Timestamps are ISO-8601 UTC values.
- Backend authorization is required for every read/write operation.

## Actions Taken

| Method | Path | Purpose |
|---|---|---|
| GET | `/tickets/:ticketId/actions-taken` | List permitted Actions Taken in stable order. |
| POST | `/tickets/:ticketId/actions-taken` | Create an Action Taken for permitted IT Staff/Admin users. |
| PATCH | `/actions-taken/:actionId` | Update permitted Action fields with stale-update protection. |
| PATCH | `/actions-taken/:actionId/status` | Apply an approved Action lifecycle change, if included in the final contract. |

`POST /tickets/:ticketId/actions-taken` requires an `Idempotency-Key` header and accepts `actionDateTime`, `description`, `result`, `followUpRequired`, optional `followUpNote`, optional `attachmentNotes`, optional `assignedToId`, and optional initial `status` (default `Planned`). The server derives `performedBy` from the authenticated session. The client cannot impersonate another performer. Repeating the same idempotency key and request returns the original Action; reusing it with different data returns `409`.

`PATCH /actions-taken/:actionId` requires the current integer `version` and may update action date/time, description, result, assignment, follow-up fields, or attachment notes. A successful update increments `version`. `PATCH /actions-taken/:actionId/status` requires the current version and supports `Planned -> InProgress`, `Planned -> Cancelled`, `InProgress -> Completed`, and `InProgress -> Cancelled`. Completed and Cancelled Actions are terminal. Completing an Action with required follow-up requires a non-empty Follow-up Note.

Requesters may use the GET operation only when the Ticket is theirs. IT Staff and Administrators may write only on accessible Tickets. The API rejects missing conditional follow-up notes, invalid dates, invalid assignments, inactive assignees, duplicate submissions, and stale versions.

## Ticket Workflow

| Method | Path | Purpose |
|---|---|---|
| PATCH | `/staff/tickets/:ticketId/status` | Apply a permitted Ticket status transition. |
| POST | `/tickets/:ticketId/problem-resolved` | Record the Requester's advisory indication. |

The backend enforces the transition matrix and resolution gate. The advisory Requester indication never directly sets `Resolved`.

The transition matrix is `New -> Open/Cancelled`, `Open -> InProgress/WaitingForRequester/Cancelled`, `InProgress -> WaitingForRequester/Resolved/Cancelled`, `WaitingForRequester -> InProgress/Resolved/Cancelled`, `Resolved -> Closed/Reopened`, `Closed -> Reopened`, `Reopened -> InProgress/Resolved/Cancelled`, and `Cancelled -> Reopened`. A Ticket may enter `Resolved` only when it has at least one `Completed` Action Taken.

## Dashboards

| Method | Path | Purpose |
|---|---|---|
| GET | `/requester/dashboard` | Return concise metrics and recent/attention-required owned Tickets for the authenticated Requester. |
| GET | `/staff/dashboard` | Return concise operational metrics and recent/urgent Ticket summaries for permitted Staff/Admin users. |

Dashboard responses must define the calculation, zero/empty behavior, UTC date boundaries, and drill-down filter or destination for each metric. They must not return an unbounded replacement for the detailed Ticket Queue or My Tickets collection.

`/requester/dashboard` is scoped to the authenticated Requester’s owned Tickets. It returns Open (New/Open/InProgress/Reopened), Waiting for Requester, updated-in-last-7-days, resolved-in-last-7-days metrics, and at most five recently updated owned Tickets. `/staff/dashboard` is restricted to IT Staff/Administrators and returns active unassigned and current-user-owned counts, current-user Actions Taken from the last 7 days, status/IT Priority counts, and at most five recently updated and urgent active Tickets. Empty results return zero metrics and empty arrays; the date boundary is an ISO UTC timestamp.

## Dashboard Response Shape

The approved response shape is a concise object containing named metric cards and recent summaries, for example:

```json
{
  "metrics": [
    { "key": "openTickets", "label": "Open Tickets", "value": 0, "drillDown": { "path": "/my-tickets", "query": { "status": "open" } } }
  ],
  "recentTickets": []
}
```

The exact keys and labels must be kept consistent with `specification.md`, `ui-spec.md`, and the implementation tests.

## Safe Failure and Conflict Behavior

- Validation failures return `422` with field-safe messages.
- Forbidden operations return `403` without relying on hidden UI controls.
- Inaccessible Tickets return the approved safe `404` behavior.
- A stale version or concurrent workflow change returns `409` and leaves the newer server state intact.
- Repeated requests must not create duplicate Actions Taken.
- Existing approved authentication, Ticket, attachment, comment, note, and user-management APIs remain compatible.

## Contract Completion Checklist

- [x] Exact request and response fields are finalized before implementation.
- [x] Authorization matrix is tested for Requester, IT Staff, and Administrator.
- [x] Status-transition matrix and resolution gate are documented.
- [x] Dashboard calculations, dates, empty states, and drill-downs are documented.
- [x] Conflict, retry, and safe-error behavior is documented.
