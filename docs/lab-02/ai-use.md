# Lab 2 - AI Use and Reflection

**LLM/agent used:** OpenAI Codex 5.6 Luna Medium

## Selected key prompts

| # | Prompt (summarised) | What I did with the result |
|---|---|---|
| 1 | Read the Lab 2 PDF completely and list the features, in-scope work, and out-of-scope work. | Turned the handout into five product features plus final testing and delivery work. |
| 2 | Create a phased plan with one issue and one feature branch per increment; do not implement before confirmation. | Used separate branches for specification, requester data, ticket creation, My Tickets, Ticket Detail, attachments, and final delivery. |
| 3 | Check each feature against the Lab 2 requirements and identify what is complete or incomplete. | Used requirement-by-requirement audits to find missing behavior and test coverage instead of assuming completion. |
| 4 | Diagnose the frontend error saying Development Requesters could not load. | Checked the terminal, found the backend was not running, started it, and verified `/api/requesters` returned HTTP 200. |
| 5 | Redesign the UI using the supplied Zen Green reference while excluding IT Priority, comments, service actions, event logs, and real profiles/authentication. | Updated the application shell, requester-selection screen, ticket list, detail view, responsive styles, and Lab 2 scope messaging. |
| 6 | Fix the ticket-number format and remove records that do not match `TK-YYYY-000000`. | Queried the database first, deleted only verified non-matching test records, and verified no invalid-format ticket remained. |
| 7 | Check all attachment requirements, including upload, ownership, validation, download, metadata, soft removal, and failed upload behavior. | Audited the API and UI, found that existing-ticket upload was missing from Ticket Detail, then added it and ran attachment tests. |
| 8 | Run all test cases and check what is still missing from the Lab 2 PDF. | Ran all configured server/client tests and builds, updated traceability, and recorded browser, screenshot, and E2E evidence as pending when unavailable. |

## Project plan recorded in this chat

The Lab 2 work was planned and implemented incrementally in seven issues:

1. **Issue 1 - Specification and test plan:** define the engineering contract, API/UI rules, acceptance criteria, and test traceability.
2. **Issue 2 - Reference data and requester:** add PostgreSQL reference data, idempotent seed behavior, active requester selection, and requester context.
3. **Issue 3 - Create Ticket:** add the Ticket model, backend-generated values, validation, idempotency, Create Ticket UI, and tests.
4. **Issue 4 - My Tickets:** add requester-owned search, filters, sorting, pagination, state handling, and tests.
5. **Issue 5 - Ticket Detail:** add ownership-protected read-only detail retrieval and attachment metadata display.
6. **Issue 6 - Attachment Management:** add upload, download, metadata, safe storage, ownership checks, and soft removal.
7. **Issue 7 - Final Testing and Delivery:** run automated checks, update documents, prepare evidence, and record remaining browser/E2E/review gates.

## My Reflection

Codex was most useful when I provided exact requirements, branch boundaries, acceptance criteria, and test expectations. Reviewing the PDF again revealed that passing unit/API/UI tests was not enough: the required E2E flow, responsive screenshots, visual checks, and nine-part PDF evidence also needed explicit proof. I also learned to verify database cleanup and terminal configuration directly instead of relying only on what the interface displayed. I remain responsible for checking the final diff, completing browser evidence, and obtaining human peer approval before merge.
