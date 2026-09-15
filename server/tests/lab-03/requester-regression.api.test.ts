import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { seedReferenceData } from "../../prisma/seed.js";

const prisma = getPrisma();
let ticketId: number;
let requesterToken = "";
let otherRequesterToken = "";

beforeAll(async () => {
  await seedReferenceData(prisma);
  const requester = await prisma.user.update({ where: { email: "anan.srisuk@example.com" }, data: { mustChangePassword: false } });
  const otherRequester = await prisma.user.update({ where: { email: "boonmee.chaiyo@example.com" }, data: { mustChangePassword: false } });
  const category = await prisma.category.findFirstOrThrow({ where: { active: true } });
  const system = await prisma.relatedSystem.findFirstOrThrow({ where: { active: true } });
  const ticket = await prisma.ticket.create({ data: { ticketNumber: `TK-REG-${Date.now()}`, ticketDate: new Date(), summary: "Requester regression ticket", description: "Ticket and attachment ownership regression.", requestedPriority: "MEDIUM", currentStatus: "New", idempotencyKey: `regression-${Date.now()}`, requestFingerprint: "requester-regression", requesterId: (await prisma.developmentRequester.findUniqueOrThrow({ where: { email: requester.email } })).id, requesterUserId: requester.id, categoryId: category.id, relatedSystemId: system.id } });
  ticketId = ticket.id;
  requesterToken = (await request(app).post("/api/auth/login").send({ email: requester.email, password: "Requester123!" })).body.token;
  otherRequesterToken = (await request(app).post("/api/auth/login").send({ email: otherRequester.email, password: "Requester123!" })).body.token;
});

afterAll(async () => {
  const attachments = await prisma.attachment.findMany({ where: { ticketId }, select: { storageKey: true } });
  await Promise.all(attachments.map(({ storageKey }) => unlink(path.join(process.cwd(), "uploads", storageKey)).catch(() => undefined)));
  await prisma.attachment.deleteMany({ where: { ticketId } });
  await prisma.ticket.delete({ where: { id: ticketId } }).catch(() => undefined);
  await prisma.$disconnect();
});

describe("Requester Lab 2 regression under authenticated ownership", () => {
  it("lists and opens the authenticated Requester's Ticket with attachment metadata", async () => {
    const list = await request(app).get("/api/tickets").set("Authorization", `Bearer ${requesterToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data.some((item: { id: number }) => item.id === ticketId)).toBe(true);

    const detail = await request(app).get(`/api/tickets/${ticketId}`).set("Authorization", `Bearer ${requesterToken}`);
    expect(detail.status).toBe(200);
    expect(detail.body.attachments).toEqual([]);
  });

  it("supports authenticated Attachment upload, download, removal, and ownership checks", async () => {
    const uploaded = await request(app).post(`/api/tickets/${ticketId}/attachments`).set("Authorization", `Bearer ${requesterToken}`).attach("file", Buffer.from("evidence"), { filename: "evidence.pdf", contentType: "application/pdf" });
    expect(uploaded.status).toBe(201);
    const attachmentId = uploaded.body.id as number;
    const listed = await request(app).get(`/api/tickets/${ticketId}/attachments`).set("Authorization", `Bearer ${requesterToken}`);
    expect(listed.status).toBe(200);
    expect(listed.body[0].originalName).toBe("evidence.pdf");
    expect((await request(app).get(`/api/attachments/${attachmentId}/download`).set("Authorization", `Bearer ${requesterToken}`)).status).toBe(200);
    expect((await request(app).get(`/api/tickets/${ticketId}/attachments`).set("Authorization", `Bearer ${otherRequesterToken}`)).status).toBe(404);
    const removed = await request(app).delete(`/api/attachments/${attachmentId}`).set("Authorization", `Bearer ${requesterToken}`).send({ reason: "No longer needed" });
    expect(removed.status).toBe(200);
    expect(removed.body.removedAt).toBeTruthy();
    expect((await request(app).get(`/api/attachments/${attachmentId}/download`).set("Authorization", `Bearer ${requesterToken}`)).status).toBe(404);
  });

  it("does not expose another Requester's Ticket", async () => {
    const response = await request(app).get(`/api/tickets/${ticketId}`).set("Authorization", `Bearer ${otherRequesterToken}`);
    expect(response.status).toBe(404);
  });
});
