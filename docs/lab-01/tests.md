# Lab 1 - Test Plan and Evidence

All test files live under `server/tests/lab-01/` and `client/tests/lab-01/`.

## Test results

| # | Tool | Test | Result |
|---|---|---|---|
| 1 | Vitest/Supertest | `GET /api/health` returns 200 with the required JSON | Passed |
| 2 | Vitest/Supertest + PostgreSQL | `GET /api/categories` returns four seeded categories in ascending ID order | Passed |
| 3 | Vitest | Heading renders | Passed |
| 4 | Vitest | Success state shows Online and the category list | Passed |
| 5 | Vitest | Error state shows Offline and a safe useful message | Passed |
| 6 | Vitest | Loading state disables the button | Passed |
| 7 | Vitest | Database failure returns HTTP 500 without internal details | Passed |
| 8 | Prisma/real PostgreSQL | Seed can run repeatedly without duplicates | Passed |
| 9 | TypeScript | Server build | Passed |
| 10 | TypeScript/Vite | Client build | Passed |

## Issue 1 foundation evidence

| Area | Evidence | Result |
|---|---|---|
| Frontend foundation | Vite, React, TypeScript, Bootstrap, and Vitest configuration | Present |
| Backend foundation | Express, TypeScript, CORS, Prisma client, and Vitest configuration | Present |
| App/listen separation | `server/src/app.ts` exports `app`; `server/src/index.ts` starts the listener | Present |
| Environment setup | `server/.env.example` and `client/.env.example` | Present |
| Starter tests | Health, categories, and React test files | Present |

## Commands used

From `server/`:

```powershell
$env:DATABASE_URL="postgresql://toktickit:toktickit@127.0.0.1:15432/toktickit?schema=public"
npm test
npm run build
```

From `client/`:

```powershell
npm test
npm run build
```

Live API verification:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
Invoke-RestMethod http://localhost:3000/api/categories
```

The verified category response contained Account and Access, Hardware, Software, and Network, in ascending ID order.

## Chat decisions recorded

- Work was completed one issue at a time.
- Docker PostgreSQL was used for real Prisma verification.
- The assistant did not commit, merge, create pull requests, or approve its own work.
- Human peer review remains required before recording an approval.
