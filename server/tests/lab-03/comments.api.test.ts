import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { seedReferenceData } from "../../prisma/seed.js";

const prisma = getPrisma();
let token = "";
let ticketId = 0;

beforeAll(async () => {
  await seedReferenceData(prisma);
  const user = await prisma.user.findFirstOrThrow({ where: { email: "anan.srisuk@example.com" } });
  const legacyRequester = await prisma.developmentRequester.findUniqueOrThrow({ where: { email: user.email } });
  const category = await prisma.category.findFirstOrThrow({ where: { active: true } });
  const system = await prisma.relatedSystem.findFirstOrThrow({ where: { active: true } });
  const ticket = await prisma.ticket.create({ data: { ticketNumber: `TK-COMMENT-${Date.now()}`, ticketDate: new Date(), summary: "Comment regression test", description: "A ticket used to verify Public Comments.", requestedPriority: "MEDIUM", currentStatus: "New", idempotencyKey: `comment-${Date.now()}`, requestFingerprint: "comment-test", requesterId: legacyRequester.id, requesterUserId: user.id, categoryId: category.id, relatedSystemId: system.id } });
  ticketId = ticket.id;
  const login = await request(app).post("/api/auth/login").send({ email: user.email, password: "Requester123!" });
  token = login.body.token;
  if (!token) {
    await prisma.user.update({ where: { id: user.id }, data: { mustChangePassword: false } });
    const retry = await request(app).post("/api/auth/login").send({ email: user.email, password: "Requester123!" });
    token = retry.body.token;
  }
});

afterAll(async () => { await prisma.ticket.delete({ where: { id: ticketId } }).catch(() => undefined); await prisma.$disconnect(); });

describe("Requester Public Comments and resolution indication", () => {
  it("rejects blank comments", async () => {
    const response = await request(app).post(`/api/tickets/${ticketId}/comments`).set("Authorization", `Bearer ${token}`).send({ content: "   " });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_COMMENT");
  });

  it("creates an append-only Public Comment and returns it in Ticket Detail", async () => {
    const created = await request(app).post(`/api/tickets/${ticketId}/comments`).set("Authorization", `Bearer ${token}`).send({ content: "The support team can see this message." });
    expect(created.status).toBe(201);
    expect(created.body.content).toBe("The support team can see this message.");
    const detail = await request(app).get(`/api/tickets/${ticketId}`).set("Authorization", `Bearer ${token}`);
    expect(detail.status).toBe(200);
    expect(detail.body.publicComments).toHaveLength(1);
    expect(detail.body.publicComments[0].author.email).toBe("anan.srisuk@example.com");
  });

  it("records apparent resolution without formally changing Ticket status", async () => {
    const response = await request(app).post(`/api/tickets/${ticketId}/problem-resolved`).set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.problemAppearsResolvedAt).toBeTruthy();
    const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
    expect(ticket.currentStatus).toBe("New");
    expect(ticket.problemAppearsResolvedAt).toBeTruthy();
  });
});
