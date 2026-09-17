import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { seedReferenceData } from "../../prisma/seed.js";

const prisma = getPrisma();
const email = `issue5-${Date.now()}@example.com`;
let adminToken = "";
let requesterToken = "";
let adminId = 0;
let createdUserId = 0;

beforeAll(async () => {
  await seedReferenceData(prisma);
  const admin = await prisma.user.update({ where: { email: "admin@example.com" }, data: { mustChangePassword: false } });
  adminId = admin.id;
  const requester = await prisma.user.update({ where: { email: "anan.srisuk@example.com" }, data: { mustChangePassword: false } });
  adminToken = (await request(app).post("/api/auth/login").send({ email: admin.email, password: "Admin123456!" })).body.token;
  requesterToken = (await request(app).post("/api/auth/login").send({ email: requester.email, password: "Requester123!" })).body.token;
});

describe("Administrator User Management", () => {
  it("allows an Administrator to list, search, and filter users", async () => {
    const all = await request(app).get("/api/admin/users?page=1&pageSize=100").set("Authorization", `Bearer ${adminToken}`);
    expect(all.status).toBe(200);
    expect(all.body.data.some((user: { email: string }) => user.email === "admin@example.com")).toBe(true);
    const filtered = await request(app).get("/api/admin/users?role=ITStaff&search=it.staff").set("Authorization", `Bearer ${adminToken}`);
    expect(filtered.status).toBe(200);
    expect(filtered.body.data.every((user: { role: string; email: string }) => user.role === "ITStaff" && user.email.includes("it.staff"))).toBe(true);
  });

  it("forbids a Requester from using Administrator APIs", async () => {
    const response = await request(app).get("/api/admin/users").set("Authorization", `Bearer ${requesterToken}`);
    expect(response.status).toBe(403);
  });

  it("allows create, edit, activation, and initial-password reset", async () => {
    const created = await request(app).post("/api/admin/users").set("Authorization", `Bearer ${adminToken}`).send({ name: "Issue Five User", email, role: "Requester", active: true, initialPassword: "Initial123!" });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ name: "Issue Five User", email, role: "Requester", active: true, mustChangePassword: true });
    createdUserId = created.body.id;
    const edited = await request(app).patch(`/api/admin/users/${createdUserId}`).set("Authorization", `Bearer ${adminToken}`).send({ name: "Updated Issue Five User", role: "ITStaff", active: false });
    expect(edited.status).toBe(200);
    expect(edited.body).toMatchObject({ name: "Updated Issue Five User", role: "ITStaff", active: false });
    const reset = await request(app).post(`/api/admin/users/${createdUserId}/initial-password`).set("Authorization", `Bearer ${adminToken}`).send({ initialPassword: "Reset123!" });
    expect(reset.status).toBe(200);
    expect(reset.body.mustChangePassword).toBe(true);
  });

  it("rejects duplicate email, invalid role, and self-deactivation", async () => {
    const duplicate = await request(app).post("/api/admin/users").set("Authorization", `Bearer ${adminToken}`).send({ name: "Duplicate", email: "admin@example.com", role: "Requester", active: true, initialPassword: "Initial123!" });
    expect(duplicate.status).toBe(409);
    const invalidRole = await request(app).post("/api/admin/users").set("Authorization", `Bearer ${adminToken}`).send({ name: "Invalid Role", email: `invalid-${Date.now()}@example.com`, role: "Owner", active: true, initialPassword: "Initial123!" });
    expect(invalidRole.status).toBe(400);
    const selfDeactivate = await request(app).patch(`/api/admin/users/${adminId}`).set("Authorization", `Bearer ${adminToken}`).send({ active: false });
    expect(selfDeactivate.status).toBe(422);
  });
});

afterAll(async () => {
  if (createdUserId) await prisma.user.delete({ where: { id: createdUserId } }).catch(() => undefined);
  await prisma.$disconnect();
});
