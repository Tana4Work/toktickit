import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { seedReferenceData } from "../../prisma/seed.js";

const prisma = getPrisma();
const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
let ownerId: number;
let otherId: number;
let ticketId: number;

beforeAll(async () => {
  await seedReferenceData(prisma);
  const requesters = await prisma.developmentRequester.findMany({ where: { active: true }, orderBy: { id: "asc" }, take: 2 });
  ownerId = requesters[0].id; otherId = requesters[1].id;
  const categoryId = (await prisma.category.findFirstOrThrow({ where: { active: true } })).id;
  const relatedSystemId = (await prisma.relatedSystem.findFirstOrThrow({ where: { active: true } })).id;
  const ticket = await prisma.ticket.create({ data: { ticketNumber: `TK-${runId}`, ticketDate: new Date(), summary: `Detail ticket ${runId}`, description: "Detailed ticket description for testing.", requestedPriority: "HIGH", currentStatus: "New", idempotencyKey: `detail-${runId}`, requestFingerprint: "test", requesterId: ownerId, categoryId, relatedSystemId } });
  ticketId = ticket.id;
  await prisma.attachment.createMany({ data: [
    { ticketId, originalName: "screen.png", storageKey: `safe/${runId}-screen`, mimeType: "image/png", sizeBytes: 1234 },
    { ticketId, originalName: "old.pdf", storageKey: `safe/${runId}-old`, mimeType: "application/pdf", sizeBytes: 2345, removedAt: new Date(), removalReason: "No longer needed" },
  ] });
});

describe("GET /api/tickets/:ticketId", () => {
  it("returns read-only owned ticket fields and attachment metadata", async () => {
    const res = await request(app).get(`/api/tickets/${ticketId}?requesterId=${ownerId}`);
    expect(res.status).toBe(200);
    expect(res.body.summary).toBe(`Detail ticket ${runId}`);
    expect(res.body.requester).toHaveProperty("email");
    expect(res.body.attachments).toHaveLength(2);
    expect(res.body.attachments[1].removalReason).toBe("No longer needed");
  });

  it("does not reveal a ticket to another requester", async () => {
    const res = await request(app).get(`/api/tickets/${ticketId}?requesterId=${otherId}`);
    expect(res.status).toBe(404);
  });
});

afterAll(async () => { await prisma.$disconnect(); });
