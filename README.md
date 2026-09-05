# TokTickIT Lab 2

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

The seed is idempotent and creates four Categories, seven Related Systems, four active Development Requesters, and one inactive Development Requester. Only active Requesters are shown in the Lab 2 selector.

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

Open http://localhost:5175. The first screen is the Lab 2 Development Requester Selection screen. Select an active requester and click Continue; this is a testing context, not authentication. No navigation item is selected before Continue. My Tickets opens first after Continue, and Create Ticket is available from the header. Use Change Requester in the header to switch the testing context.

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

The E2E flow covers requester selection, ticket creation, creation-time attachment upload, My Tickets, and Ticket Detail. The Playwright configuration is in `playwright.config.ts` and the test is in `e2e/lab-02/requester-ticket-flow.spec.ts`.

For final delivery evidence, see `docs/lab-02/tests.md` and `docs/lab-02/reviewer.md`.

## Branch workflow

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
