import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { DEVELOPMENT_REQUESTERS, RELATED_SYSTEM_NAMES, seedReferenceData } from "../../prisma/seed.js";

describe("Lab 2 reference data APIs", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns active categories and related systems", async () => {
    const categories = await request(app).get("/api/categories");
    const systems = await request(app).get("/api/related-systems");

    expect(categories.status).toBe(200);
    expect(categories.body).toHaveLength(4);
    expect(systems.status).toBe(200);
    expect(systems.body.length).toBeGreaterThanOrEqual(6);
  });

  it("returns active requesters without inactive records", async () => {
    const res = await request(app).get("/api/requesters");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(4);
    expect(res.body.every((requester: { email: string }) => requester.email !== "inactive.user@example.com")).toBe(true);
  });

  it("returns safe errors when requester loading fails", async () => {
    vi.spyOn(getPrisma().developmentRequester, "findMany").mockRejectedValueOnce(new Error("secret"));
    const res = await request(app).get("/api/requesters");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Unable to load Development Requesters." });
    expect(JSON.stringify(res.body)).not.toContain("secret");
  });

  it("seeds all Lab 2 reference data idempotently", async () => {
    const prisma = getPrisma();
    await seedReferenceData(prisma);
    await seedReferenceData(prisma);
    expect(await prisma.relatedSystem.count()).toBe(RELATED_SYSTEM_NAMES.length);
    expect(await prisma.developmentRequester.count()).toBe(DEVELOPMENT_REQUESTERS.length);
    expect(await prisma.developmentRequester.count({ where: { active: true } })).toBe(4);
    expect(await prisma.developmentRequester.count({ where: { active: false } })).toBe(1);
  });
});
