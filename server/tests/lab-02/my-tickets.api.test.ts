import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { seedReferenceData } from "../../prisma/seed.js";

const prisma = getPrisma();
const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
let requesterA: number;
let requesterB: number;
let categoryId: number;
let relatedSystemId: number;

beforeAll(async () => {
  await seedReferenceData(prisma);
  const requesters = await prisma.developmentRequester.findMany({ where: { active: true }, orderBy: { id: "asc" }, take: 2 });
  requesterA = requesters[0].id;
  requesterB = requesters[1].id;
  categoryId = (await prisma.category.findFirstOrThrow({ where: { active: true } })).id;
  relatedSystemId = (await prisma.relatedSystem.findFirstOrThrow({ where: { active: true } })).id;
  await prisma.ticket.createMany({ data: [
    { ticketNumber: `TK-${runId}-A1`, ticketDate: new Date("2026-08-01T00:00:00Z"), summary: `Laptop issue ${runId}`, description: "A test ticket for the owned list.", requestedPriority: "HIGH", currentStatus: "New", idempotencyKey: `list-a1-${runId}`, requestFingerprint: "test", requesterId: requesterA, categoryId, relatedSystemId },
    { ticketNumber: `TK-${runId}-A2`, ticketDate: new Date("2026-08-02T00:00:00Z"), summary: `VPN issue ${runId}`, description: "Another test ticket for pagination.", requestedPriority: "LOW", currentStatus: "New", idempotencyKey: `list-a2-${runId}`, requestFingerprint: "test", requesterId: requesterA, categoryId, relatedSystemId },
    { ticketNumber: `TK-${runId}-B1`, ticketDate: new Date("2026-08-03T00:00:00Z"), summary: `Other user issue ${runId}`, description: "This must not appear for requester A.", requestedPriority: "MEDIUM", currentStatus: "New", idempotencyKey: `list-b1-${runId}`, requestFingerprint: "test", requesterId: requesterB, categoryId, relatedSystemId },
  ] });
});

describe("GET /api/tickets", () => {
  it("returns only owned tickets with pagination metadata", async () => {
    const res = await request(app).get(`/api/tickets?requesterId=${requesterA}&search=${runId}&page=1&pageSize=1&sortBy=ticketDate&sortDirection=asc`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].summary).toContain(`Laptop issue ${runId}`);
    expect(res.body.data[0].category).toHaveProperty("name");
    expect(res.body.pagination).toEqual(expect.objectContaining({ page: 1, pageSize: 1, totalItems: 2, totalPages: 2 }));
    expect(JSON.stringify(res.body)).not.toContain(`Other user issue ${runId}`);
  });

  it("applies search and filters", async () => {
    const res = await request(app).get(`/api/tickets?requesterId=${requesterA}&search=${runId}&requestedPriority=LOW&status=New`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].summary).toContain(`VPN issue ${runId}`);
  });

  it("rejects invalid list query values", async () => {
    const res = await request(app).get(`/api/tickets?requesterId=${requesterA}&sortBy=id&pageSize=101`);
    expect(res.status).toBe(400);
  });
});

afterAll(async () => { await prisma.$disconnect(); });
