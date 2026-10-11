import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

export async function loginAs(email: string, password: string) {
  await getPrisma().user.update({ where: { email }, data: { mustChangePassword: false } });
  const response = await request(app).post("/api/auth/login").send({ email, password });
  if (response.status !== 200 || typeof response.body.token !== "string") throw new Error(`Unable to authenticate test user ${email}`);
  return response.body.token as string;
}

export const requesterEmail = "anan.srisuk@example.com";
export const requesterPassword = "Requester123!";
