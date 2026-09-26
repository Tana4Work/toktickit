import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { hashPassword } from "../../src/passwords.js";
import { seedReferenceData } from "../../prisma/seed.js";

const prisma = getPrisma();
const testEmail = `lab3-auth-${Date.now()}@example.com`;
const staffEmail = `lab3-staff-${Date.now()}@example.com`;

beforeAll(async () => {
  await seedReferenceData(prisma);
  await prisma.user.create({
    data: {
      name: "Lab 3 Auth Test",
      email: testEmail,
      passwordHash: hashPassword("InitialPassword123!"),
      role: "Requester",
      active: true,
      mustChangePassword: true,
    },
  });
  await prisma.user.create({
    data: {
      name: "Lab 3 Staff Authorization Test",
      email: staffEmail,
      passwordHash: hashPassword("StaffPassword123!"),
      role: "ITStaff",
      active: true,
      mustChangePassword: false,
    },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: testEmail } });
  await prisma.user.deleteMany({ where: { email: staffEmail } });
  await prisma.$disconnect();
});

describe("Lab 3 authentication foundation", () => {
  it("rejects invalid credentials with a safe response", async () => {
    const response = await request(app).post("/api/auth/login").send({ email: testEmail, password: "wrong-password" });
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: { code: "INVALID_CREDENTIALS", message: "Email or password is incorrect." } });
  });

  it("logs in, returns the role and password-change state, and retrieves the current user", async () => {
    const login = await request(app).post("/api/auth/login").send({ email: testEmail, password: "InitialPassword123!" });
    expect(login.status).toBe(200);
    expect(login.body.user).toMatchObject({ email: testEmail, role: "Requester", mustChangePassword: true });
    expect(login.body.user.passwordHash).toBeUndefined();

    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${login.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.user).toMatchObject({ email: testEmail, role: "Requester" });

    const blockedApplicationApi = await request(app).get("/api/categories").set("Authorization", `Bearer ${login.body.token}`);
    expect(blockedApplicationApi.status).toBe(403);
    expect(blockedApplicationApi.body.error.code).toBe("PASSWORD_CHANGE_REQUIRED");
  });

  it("requires authentication for current-user and invalidates a logged-out session", async () => {
    const unauthenticated = await request(app).get("/api/auth/me");
    expect(unauthenticated.status).toBe(401);

    const login = await request(app).post("/api/auth/login").send({ email: testEmail, password: "InitialPassword123!" });
    const token = login.body.token as string;
    const logout = await request(app).post("/api/auth/logout").set("Authorization", `Bearer ${token}`);
    expect(logout.status).toBe(204);

    const afterLogout = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(afterLogout.status).toBe(401);

    const protectedTickets = await request(app).get("/api/tickets?requesterId=1");
    expect(protectedTickets.status).toBe(401);
  });

  it("rejects inactive users and expired sessions", async () => {
    const inactive = await request(app).post("/api/auth/login").send({ email: "inactive.user@example.com", password: "Requester123!" });
    expect(inactive.status).toBe(401);

    const expiredToken = `expired-${Date.now()}`;
    await prisma.session.create({ data: { tokenHash: createHash("sha256").update(expiredToken).digest("hex"), userId: (await prisma.user.findUniqueOrThrow({ where: { email: testEmail } })).id, expiresAt: new Date(Date.now() - 1000) } });
    const expired = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${expiredToken}`);
    expect(expired.status).toBe(401);
  });

  it("rejects a non-Requester from Requester-only ticket APIs", async () => {
    const login = await request(app).post("/api/auth/login").send({ email: staffEmail, password: "StaffPassword123!" });
    const response = await request(app).get("/api/tickets").set("Authorization", `Bearer ${login.body.token}`);
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("changes an initial password and clears the password-change requirement", async () => {
    const login = await request(app).post("/api/auth/login").send({ email: testEmail, password: "InitialPassword123!" });
    const response = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${login.body.token}`)
      .send({ newPassword: "ChangedPassword123!", confirmPassword: "ChangedPassword123!" });
    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({ email: testEmail, mustChangePassword: false });

    const relogin = await request(app).post("/api/auth/login").send({ email: testEmail, password: "ChangedPassword123!" });
    expect(relogin.status).toBe(200);
    expect(relogin.body.user.mustChangePassword).toBe(false);
  });
});
