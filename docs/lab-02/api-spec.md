# Lab 2 API Specification

## Conventions

- Base URL: `/api`
- Existing Lab 1 and reference-data endpoints return successful collections as raw JSON arrays for backward compatibility. New resource endpoints may use `{ "data": ... }` when explicitly documented. Safe errors use `{ "error": { "code": "...", "message": "..." } }` or the existing Lab 1 `{ "error": "..." }` shape until the API contract is versioned.
- IDs are positive integers. Dates are ISO-8601 strings in UTC.
- The selected requester context is supplied as `requesterId` for Lab 2 testing. It is not authentication.
- List endpoints use `page` starting at 1 and `pageSize` from the allowed set `[10, 25, 50]`; default `page=1&pageSize=10`.

## Reference Data

| Method | Path | Purpose | Success |
|---|---|---|---|
| GET | `/categories` | Retrieve active Categories | `200 [{ id, name }]` |
| GET | `/related-systems` | Retrieve active Related Systems | `200 [{ id, name }]` |
| GET | `/requesters` | Retrieve active Development Requesters | `200 [{ id, name, email }]` |

Reference-data failures return `500` with a safe message. Inactive records are never returned by these selector endpoints.

## Tickets

### Create Ticket

`POST /tickets`

Request:

```json
{
  "requesterId": 1,
  "categoryId": 2,
  "relatedSystemId": 3,
  "summary": "Laptop battery drains quickly",
  "requestedPriority": "MEDIUM",
  "description": "The battery reaches 0% after about one hour."
}
```

The backend validates the requester and active reference IDs, trims text, validates required fields and priority, generates `ticketNumber`, `ticketDate`, and `currentStatus`, and persists the Ticket. The response is `201` with the saved Ticket:

```json
{
  "data": {
    "id": 10,
    "ticketNumber": "TK-2026-000010",
    "ticketDate": "2026-08-31T10:00:00.000Z",
    "requesterId": 1,
    "categoryId": 2,
    "relatedSystemId": 3,
    "summary": "Laptop battery drains quickly",
    "requestedPriority": "MEDIUM",
    "description": "The battery reaches 0% after about one hour.",
    "currentStatus": "New"
  }
}
```

The approved implementation must use a server-supported idempotency mechanism for retries, such as a required `Idempotency-Key` header with a unique stored operation result. A repeated key with the same request returns the original result; reuse with different data returns `409`.

Statuses: `400` invalid input, `404` missing/inactive reference, `409` idempotency conflict, `500` safe unexpected error.

### List Owned Tickets

`GET /tickets?requesterId=1&search=laptop&categoryId=2&relatedSystemId=3&requestedPriority=MEDIUM&status=New&sortBy=updatedAt&sortDirection=desc&page=1&pageSize=10`

Allowed search fields and query names must remain exactly as documented here. Search matches Ticket Number and Summary. Filters are `categoryId`, `relatedSystemId`, `requestedPriority`, and `status`. Sort fields are `ticketDate`, `ticketNumber`, `summary`, `requestedPriority`, `currentStatus`, and `updatedAt`; `updatedAt` is the default and `id` is the required secondary sort. Invalid query values return `400`.

Response `200`:

```json
{
  "data": [{ "id": 10, "ticketNumber": "TK-2026-000010", "summary": "Laptop battery drains quickly", "category": { "id": 2, "name": "Hardware" }, "relatedSystem": { "id": 3, "name": "Corporate Laptop" }, "requestedPriority": "MEDIUM", "currentStatus": "New", "ticketDate": "2026-08-31T10:00:00.000Z", "updatedAt": "2026-08-31T10:00:00.000Z" }],
  "pagination": { "page": 1, "pageSize": 10, "totalItems": 1, "totalPages": 1 }
}
```

The backend scopes the query by `requesterId`; the client cannot request another requester’s tickets by changing a ticket ID or query.

### Retrieve Owned Ticket

`GET /tickets/:ticketId?requesterId=1`

Returns `200` with read-only ticket fields, reference labels, and attachment metadata. A missing or non-owned ticket returns the documented safe result (`404` is recommended to avoid revealing whether another requester’s ticket exists). Invalid requester/ticket IDs return `400`.

## Attachments

### Upload

`POST /tickets/:ticketId/attachments?requesterId=1` as `multipart/form-data` with field `file`.

The backend checks ownership, file type, size, active count, safe storage, and generated storage key. Success returns `201` attachment metadata. Invalid type is `415`, oversized file is `413`, active-count limit is `409`, missing/non-owned Ticket is `404`, and unexpected errors are `500` with no internal paths.

### Metadata

`GET /tickets/:ticketId/attachments?requesterId=1` returns `200` metadata for the owned Ticket, including active and removed records. Removed records contain removal timestamp/reason but do not expose a usable download URL.

### Download

`GET /attachments/:attachmentId/download?requesterId=1` returns the file only when the Attachment belongs to a Ticket owned by the selected Requester and is active. Missing, non-owned, or removed files return `404`.

### Soft Remove

`DELETE /attachments/:attachmentId?requesterId=1` with JSON body `{ "reason": "No longer needed" }`.

The backend checks ownership, active state, and reason requirements, marks the Attachment removed, retains metadata, and makes the file unavailable. Success returns `200` metadata. Re-removal returns `409`; invalid reason returns `400`; non-owned/missing resources return `404`.

## Common Error Requirements

Every endpoint must return safe, stable error codes and user-facing messages. Do not return stack traces, SQL, filesystem paths, secrets, or internal exception messages. The frontend must retain form/list state where recovery is possible.
