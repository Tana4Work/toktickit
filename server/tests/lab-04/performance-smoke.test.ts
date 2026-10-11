import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { seedReferenceData } from "../../prisma/seed.js";

const prisma = getPrisma();
let requesterToken = "";
let requesterTicketId = 0;

beforeAll(async () => {
  await seedReferenceData(prisma);
  const requester = await prisma.user.update({ where: { email: "anan.srisuk@example.com" }, data: { mustChangePassword: false } });
  const login = await request(app).post("/api/auth/login").send({ email: requester.email, password: "Requester123!" });
  requesterToken = login.body.token;
  const ticket = await prisma.ticket.findFirst({ where: { requesterUserId: requester.id }, orderBy: { updatedAt: "desc" }, select: { id: true } });
  requesterTicketId = ticket?.id ?? 0;
});

describe("Lab 4 performance smoke checks", () => {
  it("returns health quickly", async () => {
    const started = performance.now();
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(performance.now() - started).toBeLessThan(5000);
  });

  it("returns the requester dashboard quickly", async () => {
    const started = performance.now();
    const response = await request(app).get("/api/requester/dashboard").set("Authorization", `Bearer ${requesterToken}`);
    expect(response.status).toBe(200);
    expect(response.body.metrics).toHaveLength(4);
    expect(performance.now() - started).toBeLessThan(5000);
  });

  it("returns an owned Ticket detail quickly", async () => {
    expect(requesterTicketId).toBeGreaterThan(0);
    const started = performance.now();
    const response = await request(app).get(`/api/tickets/${requesterTicketId}`).set("Authorization", `Bearer ${requesterToken}`);
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(requesterTicketId);
    expect(performance.now() - started).toBeLessThan(5000);
  });
});
