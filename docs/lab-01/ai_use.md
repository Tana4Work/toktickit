# Lab 1 - AI Use and Reflection

**LLM/agent used:** OpenAI Codex

## Selected key prompts

| # | Prompt (summarised) | What I did with the result |
|---|---|---|
| 1 | Inspect the the pdf lab file with grill with docs skill abd plan the project. | Force clarification, small milestones, testing, and peer approval before merging. |
| 2 | Use Docker for the PostgreSQL database. | Used a real PostgreSQL container and verified Prisma behavior against it. |
| 3 | Implement Issue 3: Prisma Category model and seed data. | Added the model, migration, idempotent seed, and real database test. |
| 4 | Continue with Issue 4 on `feature/4-category-list`. | Added the categories API route, safe error handling, API client behavior, and React states. |
| 5 | Verify all Issue 4 checklist items. | Ran server/client tests and builds, then checked the live API response. |
| 6 | Diagnose the frontend Offline message. | Compared `/api/health` and `/api/categories`, identifying the Docker port/configuration mismatch. |


## Project plan recorded in this chat

The project was planned and implemented incrementally in four issues:

1. **Issue 1 - Project foundation:** establish the React/Vite/TypeScript client, Express/TypeScript server, Prisma/PostgreSQL configuration, test tooling, environment examples, and the separation between the exported Express app and `app.listen()`.
2. **Issue 2 - Health endpoint:** implement `GET /api/health` with the required status and service response.
3. **Issue 3 - Category model and seed:** add the Prisma `Category` model, migration, four categories, idempotent seed behavior, and a real database test.
4. **Issue 4 - Category list and UI:** add `GET /api/categories`, safe database error handling, API-client validation, and idle/loading/success/error React states.

## Reflection

My prompts became better when I gave Codex clear issue boundaries, exact acceptance criteria, required tests, and a rule to stop for human review before merging. I had to correct the agent when the frontend showed an Offline state because it initially overlooked the mismatch between the Docker API port and the client configuration; I rejected a quick workaround and fixed the configuration so the client used the correct API address.
