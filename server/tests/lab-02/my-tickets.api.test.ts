import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { seedReferenceData } from "../../prisma/seed.js";

const prisma = getPrisma();
const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const testTicketPrefix = String(Date.now() % 1000000).padStart(6, "0");
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
    { ticketNumber: `TK-2026-${testTicketPrefix}`, ticketDate: new Date("2026-08-01T00:00:00Z"), summary: "Laptop battery drains quickly", description: "The laptop battery drops below 20 percent within one hour of normal use.", requestedPriority: "HIGH", currentStatus: "New", idempotencyKey: `list-a1-${runId}`, requestFingerprint: "test", requesterId: requesterA, categoryId, relatedSystemId },
    { ticketNumber: `TK-2026-${String((Number(testTicketPrefix) + 1) % 1000000).padStart(6, "0")}`, ticketDate: new Date("2026-08-02T00:00:00Z"), summary: "Cannot connect to campus VPN", description: "The VPN client fails to establish a connection from the campus network.", requestedPriority: "LOW", currentStatus: "New", idempotencyKey: `list-a2-${runId}`, requestFingerprint: "test", requesterId: requesterA, categoryId, relatedSystemId },
    { ticketNumber: `TK-2026-${String((Number(testTicketPrefix) + 2) % 1000000).padStart(6, "0")}`, ticketDate: new Date("2026-08-03T00:00:00Z"), summary: "Printer keeps going offline", description: "The shared office printer repeatedly disconnects and cannot receive print jobs.", requestedPriority: "MEDIUM", currentStatus: "New", idempotencyKey: `list-b1-${runId}`, requestFingerprint: "test", requesterId: requesterB, categoryId, relatedSystemId },
  ] });
});

describe("GET /api/tickets", () => {
  it("returns only owned tickets with pagination metadata", async () => {
    const res = await request(app).get(`/api/tickets?requesterId=${requesterA}&search=${testTicketPrefix}&page=1&pageSize=1&sortBy=ticketDate&sortDirection=asc`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].summary).toBe("Laptop battery drains quickly");
    expect(res.body.data[0].category).toHaveProperty("name");
    expect(res.body.pagination).toEqual(expect.objectContaining({ page: 1, pageSize: 1, totalItems: 2, totalPages: 2 }));
    expect(JSON.stringify(res.body)).not.toContain("Printer keeps going offline");
  });

  it("applies search and filters", async () => {
    const res = await request(app).get(`/api/tickets?requesterId=${requesterA}&search=${testTicketPrefix}&requestedPriority=LOW&status=New`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].summary).toBe("Cannot connect to campus VPN");
  });

  it("rejects invalid list query values", async () => {
    const res = await request(app).get(`/api/tickets?requesterId=${requesterA}&sortBy=id&pageSize=101`);
    expect(res.status).toBe(400);
  });
});

afterAll(async () => { await prisma.$disconnect(); });
