import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { seedReferenceData } from "../../prisma/seed.js";

const prisma = getPrisma(); let requesterId: number; let categoryId: number; let relatedSystemId: number;
const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
beforeAll(async () => { await seedReferenceData(prisma); requesterId = (await prisma.developmentRequester.findFirstOrThrow({ where: { active: true } })).id; categoryId = (await prisma.category.findFirstOrThrow({ where: { active: true } })).id; relatedSystemId = (await prisma.relatedSystem.findFirstOrThrow({ where: { active: true } })).id; });

describe("POST /api/tickets", () => {
  it("creates a ticket with backend-generated values", async () => { const res = await request(app).post("/api/tickets").set("Idempotency-Key", `create-ticket-test-1-${runId}`).send({ requesterId, categoryId, relatedSystemId, summary: "Laptop battery issue", requestedPriority: "MEDIUM", description: "The laptop battery drains in one hour." }); expect(res.status).toBe(201); expect(res.body.ticketNumber).toMatch(/^TK-\d{4}-\d{6}$/); expect(res.body.currentStatus).toBe("New"); expect(res.body.ticketDate).toBeTruthy(); });
  it("rejects invalid input without creating a ticket", async () => { const before = await prisma.ticket.count(); const res = await request(app).post("/api/tickets").set("Idempotency-Key", `create-ticket-test-invalid-${runId}`).send({ requesterId, categoryId, relatedSystemId, summary: "x", requestedPriority: "MEDIUM", description: "short" }); expect(res.status).toBe(400); expect(await prisma.ticket.count()).toBe(before); });
  it("returns the original ticket for an idempotent retry", async () => { const key = `create-ticket-test-retry-${runId}`; const body = { requesterId, categoryId, relatedSystemId, summary: "VPN access issue", requestedPriority: "HIGH", description: "The VPN does not connect from campus." }; const first = await request(app).post("/api/tickets").set("Idempotency-Key", key).send(body); const second = await request(app).post("/api/tickets").set("Idempotency-Key", key).send(body); expect(first.status).toBe(201); expect(second.status).toBe(200); expect(second.body.id).toBe(first.body.id); expect(await prisma.ticket.count({ where: { idempotencyKey: key } })).toBe(1); });
  it("rejects reuse of an idempotency key with different data", async () => { const key = `create-ticket-test-conflict-${runId}`; const original = { requesterId, categoryId, relatedSystemId, summary: "Original ticket", requestedPriority: "HIGH", description: "This key is already associated with data." }; await request(app).post("/api/tickets").set("Idempotency-Key", key).send(original); const res = await request(app).post("/api/tickets").set("Idempotency-Key", key).send({ ...original, summary: "Different ticket" }); expect(res.status).toBe(409); });
});
afterAll(async () => { await prisma.$disconnect(); });
