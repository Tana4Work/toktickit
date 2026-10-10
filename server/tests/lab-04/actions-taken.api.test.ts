import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { seedReferenceData } from "../../prisma/seed.js";

const prisma = getPrisma();
let ticketId = 0;
let staffToken = "";
let requesterToken = "";
let staffTwoId = 0;

beforeAll(async () => {
  await seedReferenceData(prisma);
  const staff = await prisma.user.update({ where: { email: "it.staff.one@example.com" }, data: { mustChangePassword: false } });
  const staffTwo = await prisma.user.update({ where: { email: "it.staff.two@example.com" }, data: { mustChangePassword: false } });
  const requester = await prisma.user.update({ where: { email: "anan.srisuk@example.com" }, data: { mustChangePassword: false } });
  staffTwoId = staffTwo.id;
  const category = await prisma.category.findFirstOrThrow({ where: { active: true } });
  const system = await prisma.relatedSystem.findFirstOrThrow({ where: { active: true } });
  const legacyRequester = await prisma.developmentRequester.findUniqueOrThrow({ where: { email: requester.email } });
  const ticket = await prisma.ticket.create({ data: { ticketNumber: `TK-2026-${String(Date.now() % 1000000).padStart(6, "0")}`, ticketDate: new Date(), summary: "Actions Taken API test", description: "A Ticket used to verify the Lab 4 Actions Taken backend contract.", requestedPriority: "MEDIUM", currentStatus: "Open", itPriority: "MEDIUM", idempotencyKey: `lab4-actions-${Date.now()}`, requestFingerprint: "lab4-actions-test", requesterId: legacyRequester.id, requesterUserId: requester.id, categoryId: category.id, relatedSystemId: system.id } });
  ticketId = ticket.id;
  staffToken = (await request(app).post("/api/auth/login").send({ email: staff.email, password: "ITStaff123!" })).body.token;
  requesterToken = (await request(app).post("/api/auth/login").send({ email: requester.email, password: "Requester123!" })).body.token;
});

afterAll(async () => {
  await prisma.actionTaken.deleteMany({ where: { ticketId } });
  await prisma.ticket.delete({ where: { id: ticketId } }).catch(() => undefined);
  await prisma.$disconnect();
});

describe("Lab 4 Actions Taken API", () => {
  it("keeps Lab 4 seed data idempotent", async () => {
    await seedReferenceData(prisma);
    expect(await prisma.ticket.count({ where: { idempotencyKey: { startsWith: "lab4-dashboard-" } } })).toBe(4);
    expect(await prisma.actionTaken.count({ where: { seedKey: { startsWith: "lab4-action-" } } })).toBe(4);
  });

  it("creates an Action Taken with the authenticated performer and valid assignee", async () => {
    const response = await request(app)
      .post(`/api/tickets/${ticketId}/actions-taken`)
      .set("Authorization", `Bearer ${staffToken}`)
      .set("Idempotency-Key", "lab4-actions-create-1")
      .send({ actionDateTime: "2026-10-10T09:00:00.000Z", description: "Checked the service logs.", result: "The service restarted successfully.", followUpRequired: true, followUpNote: "Monitor the service for one hour.", attachmentNotes: "Look for the service log screenshot.", assignedToId: staffTwoId });

    expect(response.status).toBe(201);
    expect(response.body.performedBy.email).toBe("it.staff.one@example.com");
    expect(response.body.assignedTo.id).toBe(staffTwoId);
    expect(response.body.status).toBe("Planned");
    expect(response.body.version).toBe(1);

    const retry = await request(app)
      .post(`/api/tickets/${ticketId}/actions-taken`)
      .set("Authorization", `Bearer ${staffToken}`)
      .set("Idempotency-Key", "lab4-actions-create-1")
      .send({ actionDateTime: "2026-10-10T09:00:00.000Z", description: "Checked the service logs.", result: "The service restarted successfully.", followUpRequired: true, followUpNote: "Monitor the service for one hour.", attachmentNotes: "Look for the service log screenshot.", assignedToId: staffTwoId });
    expect(retry.status).toBe(200);
    expect(retry.body.id).toBe(response.body.id);
  });

  it("lists Actions Taken for staff and the owning Requester", async () => {
    const staffResponse = await request(app).get(`/api/tickets/${ticketId}/actions-taken`).set("Authorization", `Bearer ${staffToken}`);
    const requesterResponse = await request(app).get(`/api/tickets/${ticketId}/actions-taken`).set("Authorization", `Bearer ${requesterToken}`);
    expect(staffResponse.status).toBe(200);
    expect(requesterResponse.status).toBe(200);
    expect(staffResponse.body).toHaveLength(1);
    expect(requesterResponse.body[0].description).toBe("Checked the service logs.");
  });

  it("rejects Requester writes and invalid follow-up/assignee data", async () => {
    const requesterWrite = await request(app).post(`/api/tickets/${ticketId}/actions-taken`).set("Authorization", `Bearer ${requesterToken}`).send({ actionDateTime: "2026-10-10T09:00:00.000Z", description: "Requester write", result: "Not allowed", followUpRequired: false });
    expect(requesterWrite.status).toBe(403);

    const missingFollowUp = await request(app).post(`/api/tickets/${ticketId}/actions-taken`).set("Authorization", `Bearer ${staffToken}`).set("Idempotency-Key", "lab4-actions-invalid-follow-up").send({ actionDateTime: "2026-10-10T09:00:00.000Z", description: "Missing note", result: "Invalid", followUpRequired: true });
    expect(missingFollowUp.status).toBe(400);

    const inactive = await prisma.user.findUniqueOrThrow({ where: { email: "inactive.staff@example.com" } });
    const invalidAssignee = await request(app).post(`/api/tickets/${ticketId}/actions-taken`).set("Authorization", `Bearer ${staffToken}`).set("Idempotency-Key", "lab4-actions-invalid-assignee").send({ actionDateTime: "2026-10-10T09:00:00.000Z", description: "Inactive assignment", result: "Invalid", followUpRequired: false, assignedToId: inactive.id });
    expect(invalidAssignee.status).toBe(422);
  });

  it("updates with version checks and enforces the Action status lifecycle", async () => {
    const listed = await request(app).get(`/api/tickets/${ticketId}/actions-taken`).set("Authorization", `Bearer ${staffToken}`);
    const action = listed.body[0];
    const stale = await request(app).patch(`/api/actions-taken/${action.id}`).set("Authorization", `Bearer ${staffToken}`).send({ version: 99, result: "Stale update" });
    expect(stale.status).toBe(409);

    const updated = await request(app).patch(`/api/actions-taken/${action.id}`).set("Authorization", `Bearer ${staffToken}`).send({ version: action.version, result: "Updated result" });
    expect(updated.status).toBe(200);
    expect(updated.body.version).toBe(2);

    const inProgress = await request(app).patch(`/api/actions-taken/${action.id}/status`).set("Authorization", `Bearer ${staffToken}`).send({ version: updated.body.version, status: "InProgress" });
    expect(inProgress.status).toBe(200);
    const completed = await request(app).patch(`/api/actions-taken/${action.id}/status`).set("Authorization", `Bearer ${staffToken}`).send({ version: inProgress.body.version, status: "Completed" });
    expect(completed.status).toBe(200);

    const invalid = await request(app).patch(`/api/actions-taken/${action.id}/status`).set("Authorization", `Bearer ${staffToken}`).send({ version: completed.body.version, status: "Cancelled" });
    expect(invalid.status).toBe(422);
  });
});
