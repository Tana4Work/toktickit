import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { seedReferenceData } from "../../prisma/seed.js";

const prisma = getPrisma();
let ticketId: number;
let staffToken = "";
let requesterToken = "";

beforeAll(async () => {
  await seedReferenceData(prisma);
  const staff = await prisma.user.update({ where: { email: "it.staff.one@example.com" }, data: { mustChangePassword: false } });
  const requester = await prisma.user.update({ where: { email: "anan.srisuk@example.com" }, data: { mustChangePassword: false } });
  const category = await prisma.category.findFirstOrThrow({ where: { active: true } });
  const system = await prisma.relatedSystem.findFirstOrThrow({ where: { active: true } });
  const legacyRequester = await prisma.developmentRequester.findUniqueOrThrow({ where: { email: requester.email } });
  const ticket = await prisma.ticket.create({ data: { ticketNumber: `TK-2026-${String(Date.now() % 1000000).padStart(6, "0")}`, ticketDate: new Date(), summary: "Docking station is not detected", description: "Ticket used to verify the staff queue and detail workflow.", requestedPriority: "HIGH", itPriority: "HIGH", currentStatus: "New", idempotencyKey: `staff-${Date.now()}`, requestFingerprint: "staff-workflow", requesterId: legacyRequester.id, requesterUserId: requester.id, categoryId, relatedSystemId } });
  ticketId = ticket.id;
  staffToken = (await request(app).post("/api/auth/login").send({ email: staff.email, password: "ITStaff123!" })).body.token;
  requesterToken = (await request(app).post("/api/auth/login").send({ email: requester.email, password: "Requester123!" })).body.token;
});

afterAll(async () => { await prisma.internalNote.deleteMany({ where: { ticketId } }); await prisma.publicComment.deleteMany({ where: { ticketId } }); await prisma.ticket.delete({ where: { id: ticketId } }).catch(() => undefined); await prisma.$disconnect(); });

describe("IT Staff Queue and Ticket Detail workflow", () => {
  it("returns a searchable Queue and Ticket Detail for staff", async () => {
    const queue = await request(app).get("/api/staff/tickets?search=Staff%20workflow&pageSize=10").set("Authorization", `Bearer ${staffToken}`);
    expect(queue.status).toBe(200);
    expect(queue.body.data.some((item: { id: number; itPriority: string }) => item.id === ticketId && item.itPriority === "HIGH")).toBe(true);
    const detail = await request(app).get(`/api/staff/tickets/${ticketId}`).set("Authorization", `Bearer ${staffToken}`);
    expect(detail.status).toBe(200);
    expect(detail.body.internalNotes).toEqual([]);
  });

  it("rejects Requesters from the staff workflow", async () => {
    const response = await request(app).get("/api/staff/tickets").set("Authorization", `Bearer ${requesterToken}`);
    expect(response.status).toBe(403);
  });

  it("supports owner, priority, and permitted status updates", async () => {
    const owner = await prisma.user.findUniqueOrThrow({ where: { email: "it.staff.two@example.com" } });
    expect((await request(app).patch(`/api/staff/tickets/${ticketId}/owner`).set("Authorization", `Bearer ${staffToken}`).send({ ownerId: owner.id })).status).toBe(200);
    expect((await request(app).patch(`/api/staff/tickets/${ticketId}/priority`).set("Authorization", `Bearer ${staffToken}`).send({ itPriority: "URGENT" })).body.itPriority).toBe("URGENT");
    expect((await request(app).patch(`/api/staff/tickets/${ticketId}/status`).set("Authorization", `Bearer ${staffToken}`).send({ status: "Open" })).body.currentStatus).toBe("Open");
    const invalid = await request(app).patch(`/api/staff/tickets/${ticketId}/status`).set("Authorization", `Bearer ${staffToken}`).send({ status: "Closed" });
    expect(invalid.status).toBe(422);
  });

  it("keeps Public Comments shared and Internal Notes staff-only", async () => {
    const comment = await request(app).post(`/api/staff/tickets/${ticketId}/comments`).set("Authorization", `Bearer ${staffToken}`).send({ content: "Support has started investigating." });
    expect(comment.status).toBe(201);
    const note = await request(app).post(`/api/staff/tickets/${ticketId}/notes`).set("Authorization", `Bearer ${staffToken}`).send({ content: "Checked the device logs." });
    expect(note.status).toBe(201);
    const requesterDetail = await request(app).get(`/api/tickets/${ticketId}`).set("Authorization", `Bearer ${requesterToken}`);
    expect(requesterDetail.status).toBe(200);
    expect(requesterDetail.body.publicComments).toHaveLength(1);
    expect(requesterDetail.body.internalNotes).toBeUndefined();
  });
});
