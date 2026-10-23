-- Use the normal six-digit Ticket number range for the Lab 4 seed records.
UPDATE "Ticket"
SET "ticketNumber" = 'TK-2026-0' || RIGHT("ticketNumber", 5)
WHERE "idempotencyKey" LIKE 'lab4-%'
  AND "ticketNumber" ~ '^TK-2026-9[0-9]{5}$';
