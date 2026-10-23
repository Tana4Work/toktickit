import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { seedReferenceData } from "../../prisma/seed.js";

const prisma = getPrisma();
let staffToken = "";
let requesterToken = "";

beforeAll(async () => {
  await seedReferenceData(prisma);
  const staff = await prisma.user.update({ where: { email: "it.staff.one@example.com" }, data: { mustChangePassword: false } });
  const requester = await prisma.user.update({ where: { email: "anan.srisuk@example.com" }, data: { mustChangePassword: false } });
  staffToken = (await request(app).post("/api/auth/login").send({ email: staff.email, password: "ITStaff123!" })).body.token;
  requesterToken = (await request(app).post("/api/auth/login").send({ email: requester.email, password: "Requester123!" })).body.token;
});

describe("Lab 4 workflow and dashboard API", () => {
  it("returns scoped Requester dashboard metrics and recent Tickets", async () => {
    const response = await request(app).get("/api/requester/dashboard").set("Authorization", `Bearer ${requesterToken}`);
    expect(response.status).toBe(200);
    expect(response.body.metrics.map((item: { key: string }) => item.key)).toEqual(["openTickets", "waitingForRequester", "recentlyUpdated", "recentlyResolved"]);
    expect(response.body.recentTickets.length).toBeLessThanOrEqual(5);
    expect(response.body.dateBoundary).toBeTruthy();
  });

  it("returns Staff dashboard metrics, counts, and recent/urgent lists", async () => {
    const response = await request(app).get("/api/staff/dashboard").set("Authorization", `Bearer ${staffToken}`);
    expect(response.status).toBe(200);
    expect(response.body.metrics.map((item: { key: string }) => item.key)).toEqual(["unassignedTickets", "myOwnedTickets", "recentlyUpdated", "myActionsTaken"]);
    expect(response.body.statusCounts).toBeTypeOf("object");
    expect(response.body.priorityCounts).toBeTypeOf("object");
  });

  it("rejects dashboard access for Requesters on the Staff endpoint", async () => {
    const response = await request(app).get("/api/staff/dashboard").set("Authorization", `Bearer ${requesterToken}`);
    expect(response.status).toBe(403);
  });
});
