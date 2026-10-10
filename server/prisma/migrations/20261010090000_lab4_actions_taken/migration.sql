-- Lab 4: Actions Taken parent-child records under Tickets.
CREATE TYPE "ActionStatus" AS ENUM ('Planned', 'InProgress', 'Completed', 'Cancelled');

CREATE TABLE "ActionTaken" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "actionDateTime" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "performedById" INTEGER NOT NULL,
    "assignedToId" INTEGER,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpNote" TEXT,
    "attachmentNotes" TEXT,
    "status" "ActionStatus" NOT NULL DEFAULT 'Planned',
    "version" INTEGER NOT NULL DEFAULT 1,
    "idempotencyKey" TEXT,
    "requestFingerprint" TEXT,
    "seedKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionTaken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ActionTaken_seedKey_key" ON "ActionTaken"("seedKey");
CREATE UNIQUE INDEX "ActionTaken_idempotencyKey_key" ON "ActionTaken"("idempotencyKey");

CREATE INDEX "ActionTaken_ticketId_actionDateTime_id_idx" ON "ActionTaken"("ticketId", "actionDateTime", "id");
CREATE INDEX "ActionTaken_performedById_createdAt_idx" ON "ActionTaken"("performedById", "createdAt");
CREATE INDEX "ActionTaken_assignedToId_status_updatedAt_idx" ON "ActionTaken"("assignedToId", "status", "updatedAt");

ALTER TABLE "ActionTaken" ADD CONSTRAINT "ActionTaken_ticketId_fkey"
  FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActionTaken" ADD CONSTRAINT "ActionTaken_performedById_fkey"
  FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ActionTaken" ADD CONSTRAINT "ActionTaken_assignedToId_fkey"
  FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
