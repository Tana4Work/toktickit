-- Expand the status lifecycle used by IT Staff.
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'Open';
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'InProgress';
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'WaitingForRequester';
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'Resolved';
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'Closed';
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'Reopened';
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'Cancelled';

ALTER TABLE "Ticket" ADD COLUMN "ownerId" INTEGER;
ALTER TABLE "Ticket" ADD COLUMN "itPriority" "TicketPriority";
UPDATE "Ticket" SET "itPriority" = "requestedPriority" WHERE "itPriority" IS NULL;
ALTER TABLE "Ticket" ALTER COLUMN "itPriority" SET NOT NULL;
ALTER TABLE "Ticket" ALTER COLUMN "itPriority" SET DEFAULT 'MEDIUM';

CREATE TABLE "InternalNote" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InternalNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Ticket_ownerId_currentStatus_itPriority_updatedAt_idx" ON "Ticket"("ownerId", "currentStatus", "itPriority", "updatedAt");
CREATE INDEX "InternalNote_ticketId_createdAt_idx" ON "InternalNote"("ticketId", "createdAt");

ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
