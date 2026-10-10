# Lab 4 Sprint Engineering Specification

## 1. Sprint Goal

Complete the TokTickIT service-desk workflow by adding auditable Actions Taken records, enforcing the final Ticket lifecycle, providing role-appropriate dashboards, and hardening the full application while preserving all approved Lab 1-3 behavior.

## 2. Stakeholder Request

IT Staff need a reliable way to record the work performed on each Ticket, coordinate ownership, and complete or cancel work safely. Requesters need concise visibility into their own Ticket progress. Staff and Administrators need operational dashboards. The backend must remain authoritative for roles, ownership, status transitions, validation, and concurrent updates.

## 3. Scope

### Included

- Multiple Actions Taken records under one Ticket.
- Action date/time, description, result, authenticated performer, follow-up flag, conditional follow-up note, and attachment notes.
- IT Staff and Administrator Action creation/update; Requester read-only visibility for owned Tickets.
- Complete Ticket status-transition and resolution-gate enforcement.
- Requester, IT Staff, and approved Administrator dashboards with authoritative metrics and drill-downs.
- PostgreSQL/Prisma migration, idempotent seed data, REST APIs, Zen Green UI, responsive/accessibility behavior, tests, regression, and final evidence.

### Excluded

Automatic SLA clocks, escalation engines, on-call scheduling, external notifications, inventory or purchasing, billing/payroll, multi-level approvals, advanced BI/report builders, multi-tenant operations, production cloud operations, and unapproved new features.

## 4. Roles and Authorization

| Role | Required behavior |
|---|---|
| Requester | View Actions Taken and dashboard data only for owned Tickets. Cannot create or edit Actions Taken. |
| IT Staff | View accessible Tickets, create/update permitted Actions Taken, coordinate owned Tickets, and use the staff dashboard. |
| Administrator | Perform approved IT Staff behavior and retain approved administrative access for support/testing. |

The backend is authoritative. Hidden or disabled controls do not replace API authorization.

## 5. Functional Requirements

- **FR-01 Actions Taken:** A Ticket can contain multiple ordered Actions Taken records with all approved fields.
- **FR-02 Performer:** The backend records the authenticated actor and ignores any client-supplied performer.
- **FR-03 Action permissions:** IT Staff and Administrators can create/update accessible Actions Taken; Requesters can view only owned Ticket Actions Taken.
- **FR-04 Validation:** Required fields, dates, follow-up notes, active assignments, ownership, and lifecycle transitions are validated server-side.
- **FR-05 Ticket workflow:** The backend enforces the approved status-transition matrix and resolution gate.
- **FR-06 Requester dashboard:** Authenticated Requesters receive only their own open, waiting, recently updated, and recently resolved Ticket metrics and drill-downs.
- **FR-07 Staff dashboard:** IT Staff receive unassigned, current-owner, status/priority, recently updated, current-user Action, and approved urgent/recent Ticket metrics.
- **FR-08 Administrator dashboard:** Administrators receive the approved Staff dashboard reuse/extension without unrelated permission expansion.
- **FR-09 Regression:** Authentication, ownership, comments, notes, attachments, user management, and previous Ticket flows remain correct.
- **FR-10 Hardening:** The application provides safe loading, validation, empty, forbidden, conflict, not-found, failure, responsive, and accessible behavior.

## 6. Business Rules

- **BR-01:** Every Action Taken belongs to exactly one Ticket.
- **BR-02:** One Ticket may contain zero or many Actions Taken.
- **BR-03:** The Ticket Owner coordinates the Ticket, but another permitted IT Staff member may perform and record an Action Taken.
- **BR-04:** `Performed by` is always the authenticated actor and cannot be selected by the client.
- **BR-05:** Follow-up Note is required when Follow-up Required is true and is otherwise optional/empty according to the API contract.
- **BR-06:** Requesters cannot create, update, complete, or cancel Actions Taken.
- **BR-07:** Only active permitted users may be assigned where assignment is required.
- **BR-08:** Ticket statuses remain New, Open, In Progress, Waiting for Requester, Resolved, Closed, Reopened, and Cancelled.
- **BR-09:** A Requester problem-resolved indication is advisory and cannot directly set Resolved.
- **BR-10:** The backend rejects forbidden or invalid transitions even when a client bypasses the normal UI.
- **BR-11:** Dashboard metrics are calculated from authoritative backend data and return zero/empty values safely when no records match.
- **BR-12:** Stale or conflicting updates must not silently overwrite newer workflow data.
- **BR-13:** Repeating an Action Taken request with the same idempotency key and data returns the original record; reusing the key with different data returns a conflict.
- **BR-14:** Action statuses are Planned, InProgress, Completed, and Cancelled. Completed and Cancelled are terminal.

## 7. Data and Migration Decisions

Add an `ActionTaken` model related to `Ticket`, `User`, and any approved status/reference data. Use UTC timestamps, foreign keys, indexes for Ticket/date/performer queries, and a version or equivalent stale-update check. The migration is additive: it creates the ActionTaken table, enum, indexes, and foreign keys without rewriting existing records. Recovery is to stop application writes, restore the database backup, and redeploy the prior migration set; removing the new table is only acceptable before any Lab 4 data is retained. The migration preserves all existing Users, Tickets, Attachments, Public Comments, and Internal Notes. Existing Tickets may have zero Actions Taken and remain valid. Seed data is idempotent and covers zero, one, and multiple Actions Taken plus dashboard empty/non-empty cases.

## 8. API Contract Summary

The API contract defines exact paths, methods, request/response shapes, validation, role checks, ownership checks, safe errors, status codes, and conflicts for:

- Ticket Actions Taken list/create/update/lifecycle operations.
- Requester dashboard data.
- IT Staff dashboard data.
- Approved existing Lab 2 and Lab 3 endpoints.
- Health, validation, regression, and safe-failure behavior.

Dashboard endpoints return concise metrics and recent summaries rather than entire Ticket collections.

## 9. Acceptance Criteria

- **AC-01:** A permitted staff user can create a valid Action Taken under the correct Ticket with the authenticated actor.
- **AC-02:** An Action with required follow-up data is accepted; missing conditional data is rejected.
- **AC-03:** Requesters can view Actions Taken for owned Tickets but cannot write them or access another Requester's data.
- **AC-04:** Multiple Actions Taken retain stable ordering and remain available after migration.
- **AC-05:** Every approved Ticket status transition succeeds and every forbidden transition is rejected by the backend.
- **AC-06:** A Requester resolution indication does not itself change a Ticket to Resolved.
- **AC-07:** Requester dashboard metrics and drill-downs contain only that Requester's Tickets.
- **AC-08:** Staff dashboard metrics match documented backend queries and drill down to detailed views.
- **AC-09:** Existing Lab 1-3 behavior passes regression, authorization, responsive, and accessibility checks.
- **AC-10:** Planned tests pass on the final `main` branch and evidence is traceable to requirements.

## 10. Definition of Done

- All approved requirements, rules, and acceptance criteria are implemented.
- Direct API authorization and conflict behavior are tested.
- Migration preserves earlier data and seed is safe to rerun.
- Required Lab 4 documents, tests, screenshots, reviewer records, and AI-use reflection are complete.
- Unit, API/integration, UI, responsive, accessibility, regression, performance-smoke, and E2E tests pass.
- Feature PRs are reviewed and merged into `lab4-staging`; final integration is reviewed before `main`.

## 11. Assumptions and Decisions

- Existing Lab 3 authentication, role model, Ticket statuses, and Zen Green conventions remain the baseline.
- Dashboard dates use UTC boundaries unless `api-spec.md` documents a more specific product timezone.
- Action lifecycle/status fields are included only where required by the approved UI and workflow contract; they are not expanded into a separate service-management system.
- Any change to this scope must be agreed in the engineering contract before implementation.
