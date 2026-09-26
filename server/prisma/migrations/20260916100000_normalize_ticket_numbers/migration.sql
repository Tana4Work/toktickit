-- Keep every persisted Ticket number in the required TK-2026-XXXXXX format.
UPDATE "Ticket"
SET "ticketNumber" = 'TK-2026-' || LPAD("id"::text, 6, '0')
WHERE "ticketNumber" !~ '^TK-2026-[0-9]{6}$';
