# TokTickIT Lab 4

TokTickIT is a small React and Express service-desk application backed by PostgreSQL and Prisma.

## Requirements

- Node.js
- Docker Desktop
- npm

## Start PostgreSQL with Docker

If port 5432 is available, start PostgreSQL with:

~~~powershell
docker run -d --name toktickit-postgres -e POSTGRES_USER=toktickit -e POSTGRES_PASSWORD=toktickit -e POSTGRES_DB=toktickit -p 5432:5432 postgres:16-alpine
~~~

Create server/.env:

~~~env
DATABASE_URL="postgresql://toktickit:toktickit@127.0.0.1:5432/toktickit?schema=public"
PORT=3000
~~~

If port 5432 is already occupied, publish the container on another port, such as 15432, and use this URL instead:

~~~env
DATABASE_URL="postgresql://toktickit:toktickit@127.0.0.1:15432/toktickit?schema=public"
PORT=3000
~~~

## Prepare the database

~~~powershell
cd server
npx prisma migrate deploy
npm run prisma:seed
~~~

The seed is idempotent and creates the Lab 2 reference data, authenticated Lab 3 users, Lab 4 Tickets, and Actions Taken records. It can be rerun safely after migrations.

## Run the backend

In a terminal from server/:

~~~powershell
npm run dev
~~~

The API runs at http://localhost:3000.

Check the API:

~~~powershell
Invoke-RestMethod http://localhost:3000/api/health
Invoke-RestMethod http://localhost:3000/api/categories
~~~

## Run the frontend

In another terminal:

~~~powershell
cd client
npm run dev
~~~

Open http://localhost:5174. Sign in with a seeded account. Requesters see the Requester Dashboard, while IT Staff and Administrators see the Staff Dashboard and their role-appropriate navigation. The Playwright E2E server uses port 5175 as an isolated test server so it does not conflict with the normal development frontend on port 5174.

The frontend calls the requester, reference-data, ticket, and attachment endpoints. It shows loading, success, validation, empty, no-results, and safe API-failure states.

## Lab 2 scope

Lab 2 includes requester selection, ticket creation, requester-owned ticket search/filter/list/detail views, and attachment upload/download/metadata/soft removal. Attachments can be uploaded during ticket creation or from Ticket Detail; ticket fields remain read-only there, while attachment metadata, active-file download, upload, and soft removal are available. It does not include real authentication, IT Priority, comments, service actions, event logs, profiles, admin functions, or IT workflow/status changes.

## Responsive UI requirements

The UI is designed for these Lab 2 viewport ranges:

- Desktop: `>= 992px`
- Tablet: `768px-991px`
- Mobile: `< 768px`

All pages should remain usable without clipping or horizontal page scrolling. Keyboard focus is visible on interactive controls.

## Run tests and builds

Server:

~~~powershell
cd server
npm test
npm run build
~~~

Client:

~~~powershell
cd client
npm test -- --run
npm run build
~~~

E2E (from the repository root, with PostgreSQL running):

~~~powershell
npm install
npx playwright install chromium
npm run test:e2e
~~~

The E2E suite covers authenticated requester ticket creation, attachments, Ticket Detail, Lab 3 authentication/staff/admin regression, Lab 4 requester and staff dashboards, dashboard drill-down, and desktop/tablet/mobile overflow checks. The Playwright configuration is in `playwright.config.ts`.

For final delivery evidence, see `docs/lab-02/tests.md` and `docs/lab-02/reviewer.md`.

## Lab 4 engineering contract

Lab 4 completes the service-desk workflow with Actions Taken, final Ticket status enforcement, role-appropriate dashboards, and final regression hardening. The approved contract and traceability documents are in `docs/lab-04/`:

- `specification.md` - requirements, business rules, data decisions, acceptance criteria, and Definition of Done.
- `tests.md` - planned tests and acceptance-criterion traceability.
- `ui-spec.md` - screen behavior, feedback, responsive rules, and accessibility.
- `api-spec.md` - endpoint, authorization, validation, dashboard, and conflict contracts.
- `reviewer.md` - peer-review and PR evidence record.
- `ai-use.md` - selected AI prompts and reflection.

The Lab 4 scope includes multiple Actions Taken per Ticket, backend-authoritative authorization, Ticket workflow and resolution rules, Requester and Staff dashboards, migration-safe seed data, responsive/accessibility behavior, and Lab 1-3 regression. SLA clocks, external notifications, inventory, billing, advanced BI, multi-tenant operations, and other unapproved features are excluded.

## Lab 4 branch workflow

`main` remains unchanged while Lab 4 is developed. The integration baseline is `lab4-staging`, created from `main`. Create each issue branch from the latest `lab4-staging`, push the completed issue branch, and open a PR targeting `lab4-staging`. A peer reviews and merges the PR. Only after all Lab 4 issues pass final verification should `lab4-staging` be integrated into `main`.

~~~text
main
`-- lab4-staging
    |-- feature/lab4-01-docs-test-planning
    |-- feature/lab4-02-actions-taken-backend
    |-- feature/lab4-03-actions-taken-ui
    |-- feature/lab4-04-workflow-dashboards
    |-- feature/lab4-05-regression-responsive-visual-qa
    `-- feature/lab4-06-integration-submission-release
~~~

Issue 5 is the current QA increment on `feature/lab4-05-regression-responsive-visual-qa`. Its dedicated Lab 4 API, component, E2E, responsive, and performance checks are included in this branch. Later issue branches should be created from the updated `lab4-staging` after the preceding issue has been merged.

## Lab 4 test and migration commands

From `server/`, apply migrations and seed the database:

~~~powershell
npx prisma migrate deploy
npm run prisma:seed
npm test
npm run build
~~~

From `client/`, run the client checks:

~~~powershell
npm test -- --run
npm run build
~~~

From the repository root, run E2E tests with PostgreSQL available:

~~~powershell
npm run test:e2e
~~~

The Lab 4 test coverage includes:

- `server/tests/lab-04/actions-taken.api.test.ts` for Actions Taken authorization, validation, idempotency, and lifecycle behavior.
- `server/tests/lab-04/workflow-dashboards.api.test.ts` for workflow/dashboard API behavior and dashboard authorization.
- `server/tests/lab-04/performance-smoke.test.ts` for health, dashboard, and Ticket detail response smoke checks.
- `client/tests/lab-04/ActionsTakenPanel.test.tsx` and `client/tests/lab-04/TicketWorkflow.test.tsx` for Actions Taken and workflow UI behavior.
- `client/tests/lab-04/RequesterDashboard.test.tsx`, `StaffDashboard.test.tsx`, and `Dashboard.test.tsx` for dashboard metrics, empty states, and drill-down controls.
- `e2e/lab-04/dashboards.spec.ts` for dashboard flows and responsive desktop/tablet/mobile checks.

The final Lab 4 evidence must also show migration/seed behavior, full regression, accessibility/visual inspection, peer review, and final branch integration.

## Historical Lab 2 branch workflow

~~~text
feature/lab2-01-specification-test-plan
feature/lab2-02-reference-data-requester
feature/lab2-03-create-ticket
feature/lab2-04-my-tickets
feature/lab2-05-ticket-detail
feature/lab2-06-attachment-management
feature/lab2-07-final-testing-delivery
lab2-staging
~~~

If a push is rejected because the remote branch is ahead, integrate it safely first:

~~~powershell
git pull --rebase origin <branch-name>
git push origin <branch-name>
~~~
