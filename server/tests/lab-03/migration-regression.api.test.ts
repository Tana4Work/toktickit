import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getPrisma } from "../../src/prisma.js";
import { seedReferenceData } from "../../prisma/seed.js";

const prisma = getPrisma();

describe("Lab 2 migration and ownership regression", () => {
  beforeAll(async () => { await seedReferenceData(prisma); });

  it("maps active Lab 2 Requesters to Users and preserves Ticket/Attachment ownership", async () => {
    const requester = await prisma.developmentRequester.findUniqueOrThrow({ where: { email: "anan.srisuk@example.com" } });
    const user = await prisma.user.findUniqueOrThrow({ where: { email: requester.email } });
    const ticket = await prisma.ticket.findFirst({ where: { requesterId: requester.id }, include: { attachments: true } });
    expect(user.role).toBe("Requester");
    expect(ticket).toBeTruthy();
    expect(ticket?.requesterUserId).toBe(user.id);
    expect(ticket?.attachments).toBeDefined();
    expect(ticket?.attachments.every((attachment) => attachment.ticketId === ticket.id)).toBe(true);
  });

  it("keeps seed data idempotent", async () => {
    const seedEmails = ["anan.srisuk@example.com", "boonmee.chaiyo@example.com", "chalida.wongsa@example.com", "darin.kittisak@example.com", "inactive.user@example.com", "it.staff.one@example.com", "it.staff.two@example.com", "it.staff.three@example.com", "inactive.staff@example.com", "admin@example.com"];
    await seedReferenceData(prisma);
    const afterFirstSeed = {
      users: await prisma.user.count({ where: { email: { in: seedEmails } } }),
      categories: await prisma.category.count(),
      systems: await prisma.relatedSystem.count(),
    };
    await seedReferenceData(prisma);
    expect(await prisma.user.count({ where: { email: { in: seedEmails } } })).toBe(afterFirstSeed.users);
    expect(await prisma.category.count()).toBe(afterFirstSeed.categories);
    expect(await prisma.relatedSystem.count()).toBe(afterFirstSeed.systems);
  });
});

afterAll(async () => { await prisma.$disconnect(); });
