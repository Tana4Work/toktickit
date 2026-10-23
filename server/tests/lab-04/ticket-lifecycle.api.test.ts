import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { seedReferenceData } from "../../prisma/seed.js";

const prisma = getPrisma();
let ticketId = 0;
let staffToken = "";

beforeAll(async () => {
  await seedReferenceData(prisma);
  const staff = await prisma.user.update({ where: { email: "it.staff.one@example.com" }, data: { mustChangePassword: false } });
  const requester = await prisma.user.update({ where: { email: "anan.srisuk@example.com" }, data: { mustChangePassword: false } });
  const category = await prisma.category.findFirstOrThrow({ where: { active: true } });
  const system = await prisma.relatedSystem.findFirstOrThrow({ where: { active: true } });
  const legacyRequester = await prisma.developmentRequester.findUniqueOrThrow({ where: { email: requester.email } });
  const unique = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber: `TEST-${unique}`,
      ticketDate: new Date(), summary: "Lab 4 lifecycle test", description: "Verifies every permitted Ticket status transition.",
      requestedPriority: "MEDIUM", itPriority: "MEDIUM", currentStatus: "New", idempotencyKey: `lab4-lifecycle-${unique}`,
      requestFingerprint: "lab4-lifecycle-test", requesterId: legacyRequester.id, requesterUserId: requester.id,
      categoryId: category.id, relatedSystemId: system.id,
    },
  });
  ticketId = ticket.id;
  staffToken = (await request(app).post("/api/auth/login").send({ email: staff.email, password: "ITStaff123!" })).body.token;
});

afterAll(async () => {
  await prisma.actionTaken.deleteMany({ where: { ticketId } });
  await prisma.ticket.delete({ where: { id: ticketId } }).catch(() => undefined);
  await prisma.$disconnect();
});

describe("Lab 4 complete Ticket lifecycle", () => {
  it("enforces the transition matrix and resolution gate", async () => {
    const status = (next: string) => request(app).patch(`/api/staff/tickets/${ticketId}/status`).set("Authorization", `Bearer ${staffToken}`).send({ status: next });
    for (const next of ["Open", "InProgress", "WaitingForRequester", "InProgress"]) {
      const response = await status(next);
      expect(response.status).toBe(200);
      expect(response.body.currentStatus).toBe(next);
    }

    const blocked = await status("Resolved");
    expect(blocked.status).toBe(422);
    expect(blocked.body.error.code).toBe("RESOLUTION_GATE");

    const staff = await prisma.user.findUniqueOrThrow({ where: { email: "it.staff.one@example.com" } });
    await prisma.actionTaken.create({ data: {
      ticketId, actionDateTime: new Date(), description: "Completed lifecycle verification", result: "Verification completed.",
      performedById: staff.id, status: "Completed", idempotencyKey: `lab4-lifecycle-action-${Date.now()}`,
    } });

    for (const next of ["Resolved", "Closed", "Reopened", "Cancelled", "Reopened", "InProgress"]) {
      const response = await status(next);
      expect(response.status).toBe(200);
      expect(response.body.currentStatus).toBe(next);
    }
  });
});
