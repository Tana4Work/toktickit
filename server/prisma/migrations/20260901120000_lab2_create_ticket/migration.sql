-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('New');

-- AlterTable
ALTER TABLE "Ticket"
  ADD COLUMN "ticketNumber" TEXT,
  ADD COLUMN "ticketDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "summary" TEXT,
  ADD COLUMN "description" TEXT,
  ADD COLUMN "requestedPriority" "TicketPriority",
  ADD COLUMN "currentStatus" "TicketStatus" NOT NULL DEFAULT 'New',
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "requestFingerprint" TEXT,
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Existing Lab 2 databases contain no tickets before this migration. These
-- constraints become required after the new create-ticket API is deployed.
ALTER TABLE "Ticket" ALTER COLUMN "ticketNumber" SET NOT NULL;
ALTER TABLE "Ticket" ALTER COLUMN "summary" SET NOT NULL;
ALTER TABLE "Ticket" ALTER COLUMN "description" SET NOT NULL;
ALTER TABLE "Ticket" ALTER COLUMN "requestedPriority" SET NOT NULL;
ALTER TABLE "Ticket" ALTER COLUMN "idempotencyKey" SET NOT NULL;
ALTER TABLE "Ticket" ALTER COLUMN "requestFingerprint" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_ticketNumber_key" ON "Ticket"("ticketNumber");
CREATE UNIQUE INDEX "Ticket_idempotencyKey_key" ON "Ticket"("idempotencyKey");
CREATE INDEX "Ticket_requesterId_updatedAt_idx" ON "Ticket"("requesterId", "updatedAt");
