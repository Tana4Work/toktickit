import { getPrisma } from "../src/prisma.js";
import type { PrismaClient } from "@prisma/client";
import { pathToFileURL } from "node:url";
import { hashPassword } from "../src/passwords.js";

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

export const LAB3_SEED_USERS: ReadonlyArray<{ name: string; email: string; role: "Requester" | "ITStaff" | "Administrator"; password: string; active?: boolean }> = [
  { name: "Anan Srisuk", email: "anan.srisuk@example.com", role: "Requester" as const, password: "Requester123!" },
  { name: "Boonmee Chaiyo", email: "boonmee.chaiyo@example.com", role: "Requester" as const, password: "Requester123!" },
  { name: "Chalida Wongsa", email: "chalida.wongsa@example.com", role: "Requester" as const, password: "Requester123!" },
  { name: "Darin Kittisak", email: "darin.kittisak@example.com", role: "Requester" as const, password: "Requester123!" },
  { name: "Inactive Test User", email: "inactive.user@example.com", role: "Requester" as const, password: "Requester123!", active: false },
  { name: "IT Staff One", email: "it.staff.one@example.com", role: "ITStaff" as const, password: "ITStaff123!" },
  { name: "IT Staff Two", email: "it.staff.two@example.com", role: "ITStaff" as const, password: "ITStaff123!" },
  { name: "IT Staff Three", email: "it.staff.three@example.com", role: "ITStaff" as const, password: "ITStaff123!" },
  { name: "Inactive IT Staff", email: "inactive.staff@example.com", role: "ITStaff" as const, password: "ITStaff123!", active: false },
  { name: "Lab Administrator", email: "admin@example.com", role: "Administrator" as const, password: "Admin123456!" },
];

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

  for (const user of LAB3_SEED_USERS) {
    const savedUser = await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role, active: user.active ?? true },
      create: { name: user.name, email: user.email, role: user.role, active: user.active ?? true, passwordHash: hashPassword(user.password), mustChangePassword: true },
    });
    const legacyRequester = await prisma.developmentRequester.findUnique({ where: { email: user.email }, select: { id: true } });
    if (legacyRequester && user.role === "Requester") {
      await prisma.ticket.updateMany({ where: { requesterId: legacyRequester.id, requesterUserId: null }, data: { requesterUserId: savedUser.id } });
    }
  }
}

async function main() {
  const prisma = getPrisma();
  await seedReferenceData(prisma);
  console.log(`Seeded ${CATEGORY_NAMES.length} categories, ${RELATED_SYSTEM_NAMES.length} systems, ${DEVELOPMENT_REQUESTERS.length} requesters, and ${LAB3_SEED_USERS.length} Lab 3 users.`);
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
