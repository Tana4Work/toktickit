-- CreateTable
CREATE TABLE "PublicComment" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PublicComment_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN "problemAppearsResolvedAt" TIMESTAMP(3), ADD COLUMN "problemAppearsResolvedById" INTEGER;

-- CreateIndex
CREATE INDEX "PublicComment_ticketId_createdAt_idx" ON "PublicComment"("ticketId", "createdAt");

-- AddForeignKey
ALTER TABLE "PublicComment" ADD CONSTRAINT "PublicComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublicComment" ADD CONSTRAINT "PublicComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_problemAppearsResolvedById_fkey" FOREIGN KEY ("problemAppearsResolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
