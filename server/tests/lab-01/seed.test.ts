import { afterAll, describe, expect, it } from "vitest";
import { getPrisma } from "../../src/prisma.js";
import { CATEGORY_NAMES, seedCategories } from "../../prisma/seed.js";

const prisma = getPrisma();

describe("Issue 3 category seed", () => {
  it("creates exactly the four categories and is idempotent", async () => {
    await seedCategories(prisma);
    await seedCategories(prisma);

    const categories = await prisma.category.findMany({
      orderBy: { id: "asc" },
      select: { name: true },
    });

    expect(categories.map(({ name }) => name)).toEqual([...CATEGORY_NAMES]);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
