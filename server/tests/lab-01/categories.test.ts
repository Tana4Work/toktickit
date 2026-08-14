import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("GET /api/categories", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the four seeded categories with only id and name in id order", async () => {
    const res = await request(app).get("/api/categories");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(4);
    expect(res.body.map((category: { name: string }) => category.name)).toEqual([
      "Account and Access",
      "Hardware",
      "Software",
      "Network",
    ]);
    expect(res.body.map((category: { id: number }) => category.id)).toEqual(
      [...res.body].sort((a, b) => a.id - b.id).map((category) => category.id),
    );
    expect(res.body.every((category: object) => Object.keys(category).sort().join() === "id,name")).toBe(true);
  });

  it("returns a safe 500 response when the database request fails", async () => {
    vi.spyOn(getPrisma().category, "findMany").mockRejectedValueOnce(
      new Error("password=secret SQL SELECT internal details"),
    );

    const res = await request(app).get("/api/categories");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Unable to load categories." });
    expect(JSON.stringify(res.body)).not.toContain("password");
    expect(JSON.stringify(res.body)).not.toContain("SQL");
  });
});
