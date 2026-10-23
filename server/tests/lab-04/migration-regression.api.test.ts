import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getPrisma } from "../../src/prisma.js";
import { seedReferenceData } from "../../prisma/seed.js";

const prisma = getPrisma();

beforeAll(async () => {
  await seedReferenceData(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Lab 4 migration and seed regression", () => {
  it("preserves earlier users and tickets while adding Lab 4 records", async () => {
    const users = await prisma.user.count();
    const legacyTickets = await prisma.ticket.count({ where: { idempotencyKey: { not: { startsWith: "lab4-" } } } });
    const lab4Tickets = await prisma.ticket.findMany({ where: { idempotencyKey: { startsWith: "lab4-" } }, select: { ticketNumber: true } });
    expect(users).toBeGreaterThanOrEqual(10);
    expect(legacyTickets).toBeGreaterThan(0);
    expect(lab4Tickets).toHaveLength(20);
    expect(lab4Tickets.every((ticket) => /^TK-2026-\d{6}$/.test(ticket.ticketNumber))).toBe(true);
  });

  it("keeps zero, one, and multiple Actions Taken seed cases after repeated seeding", async () => {
    await seedReferenceData(prisma);
    const seededTickets = await prisma.ticket.findMany({ where: { idempotencyKey: { startsWith: "lab4-" } }, select: { id: true, _count: { select: { actionsTaken: true } } } });
    const actionCounts = seededTickets.map((ticket) => ticket._count.actionsTaken);
    expect(actionCounts).toContain(0);
    expect(actionCounts).toContain(1);
    const seededActions = await prisma.actionTaken.findMany({ where: { seedKey: { startsWith: "lab4-action-" } }, select: { ticketId: true } });
    expect(seededActions).toHaveLength(4);
    const seededActionsByTicket = new Map<number, number>();
    for (const action of seededActions) seededActionsByTicket.set(action.ticketId, (seededActionsByTicket.get(action.ticketId) ?? 0) + 1);
    expect(Math.max(...seededActionsByTicket.values())).toBe(2);
  });
});
