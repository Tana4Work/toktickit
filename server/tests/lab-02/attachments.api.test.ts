import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { seedReferenceData } from "../../prisma/seed.js";

const prisma = getPrisma();
const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
let ownerId: number;
let otherId: number;
let ticketId: number;
let attachmentId: number;

beforeAll(async () => {
  await seedReferenceData(prisma);
  const requesters = await prisma.developmentRequester.findMany({ where: { active: true }, orderBy: { id: "asc" }, take: 2 });
  ownerId = requesters[0].id; otherId = requesters[1].id;
  const categoryId = (await prisma.category.findFirstOrThrow({ where: { active: true } })).id;
  const relatedSystemId = (await prisma.relatedSystem.findFirstOrThrow({ where: { active: true } })).id;
  const ticket = await prisma.ticket.create({ data: { ticketNumber: `TK-2099-${String(Date.now() % 1000000).padStart(6, "0")}`, ticketDate: new Date(), summary: `Attachment ticket ${runId}`, description: "Attachment lifecycle test ticket.", requestedPriority: "MEDIUM", currentStatus: "New", idempotencyKey: `attachment-${runId}`, requestFingerprint: "test", requesterId: ownerId, categoryId, relatedSystemId } });
  ticketId = ticket.id;
});

describe("attachment lifecycle", () => {
  it("uploads an allowed file and returns metadata", async () => {
    const res = await request(app).post(`/api/tickets/${ticketId}/attachments?requesterId=${ownerId}`).attach("file", Buffer.from("fake png data"), { filename: "screen.png", contentType: "image/png" });
    expect(res.status).toBe(201);
    expect(res.body.originalName).toBe("screen.png");
    expect(res.body).not.toHaveProperty("storageKey");
    attachmentId = res.body.id;
  });

  it("rejects an unsupported file type and non-owner access", async () => {
    const invalid = await request(app).post(`/api/tickets/${ticketId}/attachments?requesterId=${ownerId}`).attach("file", Buffer.from("script"), { filename: "script.exe", contentType: "application/octet-stream" });
    expect(invalid.status).toBe(415);
    const forbidden = await request(app).get(`/api/tickets/${ticketId}/attachments?requesterId=${otherId}`);
    expect(forbidden.status).toBe(404);
  });

  it("downloads active files and soft-removes them", async () => {
    const download = await request(app).get(`/api/attachments/${attachmentId}/download?requesterId=${ownerId}`);
    expect(download.status).toBe(200);
    const removed = await request(app).delete(`/api/attachments/${attachmentId}?requesterId=${ownerId}`).send({ reason: "No longer needed" });
    expect(removed.status).toBe(200);
    expect(removed.body.removedAt).toBeTruthy();
    const blocked = await request(app).get(`/api/attachments/${attachmentId}/download?requesterId=${ownerId}`);
    expect(blocked.status).toBe(404);
    const metadata = await request(app).get(`/api/tickets/${ticketId}/attachments?requesterId=${ownerId}`);
    expect(metadata.body[0].removalReason).toBe("No longer needed");
  });

  it("rejects files over 5 MB and a sixth active attachment", async () => {
    const oversized = await request(app)
      .post(`/api/tickets/${ticketId}/attachments?requesterId=${ownerId}`)
      .attach("file", Buffer.alloc(5 * 1024 * 1024 + 1), { filename: "large.pdf", contentType: "application/pdf" });
    expect(oversized.status).toBe(413);

    for (let index = 0; index < 5; index += 1) {
      const uploaded = await request(app)
        .post(`/api/tickets/${ticketId}/attachments?requesterId=${ownerId}`)
        .attach("file", Buffer.from(`file-${index}`), { filename: `file-${index}.pdf`, contentType: "application/pdf" });
      expect(uploaded.status).toBe(201);
    }
    const sixth = await request(app)
      .post(`/api/tickets/${ticketId}/attachments?requesterId=${ownerId}`)
      .attach("file", Buffer.from("sixth"), { filename: "sixth.pdf", contentType: "application/pdf" });
    expect(sixth.status).toBe(409);
  });
});

afterAll(async () => {
  if (!ticketId) {
    await prisma.$disconnect();
    return;
  }
  const attachments = await prisma.attachment.findMany({ where: { ticketId }, select: { storageKey: true } });
  await Promise.all(attachments.map(({ storageKey }) => unlink(path.join(process.cwd(), "uploads", storageKey)).catch(() => undefined)));
  await prisma.attachment.deleteMany({ where: { ticketId } });
  await prisma.ticket.delete({ where: { id: ticketId } });
  await prisma.$disconnect();
});
