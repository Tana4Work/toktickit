import { getPrisma } from "../src/prisma.js";
import type { PrismaClient } from "@prisma/client";
import { pathToFileURL } from "node:url";

// Issue 3 — seed the four supported categories.
// The four names are: Account and Access, Hardware, Software, Network.
// Requirement: running the seed twice must NOT create duplicates.
// Hint: prisma.category.upsert({ where:{name}, update:{}, create:{name} }).
export const CATEGORY_NAMES = [
  "Account and Access",
  "Hardware",
  "Software",
  "Network",
] as const;

export const RELATED_SYSTEM_NAMES = [
  "Email",
  "Campus Wi-Fi",
  "VPN",
  "LEB2 App",
  "Grade Submission App",
  "Printer",
  "Corporate Laptop",
] as const;

export const DEVELOPMENT_REQUESTERS = [
  { name: "Anan Srisuk", email: "anan.srisuk@example.com", active: true },
  { name: "Boonmee Chaiyo", email: "boonmee.chaiyo@example.com", active: true },
  { name: "Chalida Wongsa", email: "chalida.wongsa@example.com", active: true },
  { name: "Darin Kittisak", email: "darin.kittisak@example.com", active: true },
  { name: "Inactive Test User", email: "inactive.user@example.com", active: false },
] as const;

export async function seedCategories(prisma: PrismaClient) {
  for (const name of CATEGORY_NAMES) {
    await prisma.category.upsert({
      where: { name },
      update: { active: true },
      create: { name, active: true },
    });
  }
}

export async function seedReferenceData(prisma: PrismaClient) {
  await seedCategories(prisma);

  for (const name of RELATED_SYSTEM_NAMES) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: { active: true },
      create: { name, active: true },
    });
  }

  for (const requester of DEVELOPMENT_REQUESTERS) {
    await prisma.developmentRequester.upsert({
      where: { email: requester.email },
      update: { name: requester.name, active: requester.active },
      create: requester,
    });
  }
}

async function main() {
  const prisma = getPrisma();
  await seedReferenceData(prisma);
  console.log(`Seeded ${CATEGORY_NAMES.length} categories, ${RELATED_SYSTEM_NAMES.length} systems, and ${DEVELOPMENT_REQUESTERS.length} requesters.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await getPrisma().$disconnect();
    });
}
