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

const LAB4_SEED_TICKETS = [
  { key: "lab4-dashboard-open", ticketNumber: "TK-2026-900001", summary: "Campus Wi-Fi disconnects repeatedly", description: "The requester loses the campus Wi-Fi connection several times each morning.", requestedPriority: "HIGH" as const, currentStatus: "Open" as const, itPriority: "HIGH" as const, requesterEmail: "anan.srisuk@example.com", ownerEmail: "it.staff.one@example.com" },
  { key: "lab4-dashboard-waiting", ticketNumber: "TK-2026-900002", summary: "VPN access is waiting for confirmation", description: "VPN access was configured and is waiting for the requester to confirm the result.", requestedPriority: "MEDIUM" as const, currentStatus: "WaitingForRequester" as const, itPriority: "MEDIUM" as const, requesterEmail: "boonmee.chaiyo@example.com", ownerEmail: "it.staff.two@example.com" },
  { key: "lab4-dashboard-unassigned", ticketNumber: "TK-2026-900003", summary: "Shared printer is unavailable", description: "The shared printer is offline and has not yet been assigned to an IT Staff owner.", requestedPriority: "URGENT" as const, currentStatus: "New" as const, itPriority: "URGENT" as const, requesterEmail: "chalida.wongsa@example.com", ownerEmail: null },
  { key: "lab4-dashboard-resolved", ticketNumber: "TK-2026-900004", summary: "Email account access restored", description: "The email account was unlocked and the requester confirmed that access was restored.", requestedPriority: "LOW" as const, currentStatus: "Resolved" as const, itPriority: "LOW" as const, requesterEmail: "darin.kittisak@example.com", ownerEmail: "it.staff.one@example.com" },
] as const;

const LAB4_SEED_ACTIONS = [
  { key: "lab4-action-wifi-check", ticketKey: "lab4-dashboard-open", description: "Checked the access point logs and client signal strength.", result: "Interference was found near the requester desk.", status: "InProgress" as const, followUpRequired: true, followUpNote: "Retest after the access point channel is changed.", attachmentNotes: "Look for the access point log screenshot.", performedByEmail: "it.staff.one@example.com", assignedToEmail: "it.staff.two@example.com" },
  { key: "lab4-action-wifi-channel", ticketKey: "lab4-dashboard-open", description: "Changed the access point channel and monitored the connection.", result: "Connection remained stable during the monitoring window.", status: "Completed" as const, followUpRequired: false, followUpNote: null, attachmentNotes: null, performedByEmail: "it.staff.two@example.com", assignedToEmail: "it.staff.two@example.com" },
  { key: "lab4-action-vpn-configure", ticketKey: "lab4-dashboard-waiting", description: "Updated the VPN profile and sent connection instructions.", result: "Configuration completed; requester confirmation is pending.", status: "Completed" as const, followUpRequired: true, followUpNote: "Ask the requester to test from the campus network.", attachmentNotes: null, performedByEmail: "it.staff.two@example.com", assignedToEmail: "it.staff.two@example.com" },
  { key: "lab4-action-email-restore", ticketKey: "lab4-dashboard-resolved", description: "Unlocked the email account and reset the blocked sign-in attempt.", result: "Requester confirmed successful sign-in.", status: "Completed" as const, followUpRequired: false, followUpNote: null, attachmentNotes: "See the access restoration screenshot.", performedByEmail: "it.staff.one@example.com", assignedToEmail: "it.staff.one@example.com" },
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

  const seededUsers = await prisma.user.findMany({ select: { id: true, email: true } });
  const usersByEmail = new Map(seededUsers.map((user) => [user.email, user.id]));
  const seededRequesters = await prisma.developmentRequester.findMany({ select: { id: true, email: true } });
  const requestersByEmail = new Map(seededRequesters.map((requester) => [requester.email, requester.id]));
  const category = await prisma.category.findFirstOrThrow({ where: { name: "Network" } });
  const system = await prisma.relatedSystem.findFirstOrThrow({ where: { name: "Campus Wi-Fi" } });
  const now = new Date();
  const ticketIds = new Map<string, number>();

  for (const ticket of LAB4_SEED_TICKETS) {
    const requesterId = requestersByEmail.get(ticket.requesterEmail);
    const requesterUserId = usersByEmail.get(ticket.requesterEmail);
    if (!requesterId || !requesterUserId) throw new Error(`Missing seeded requester ${ticket.requesterEmail}`);
    const ownerId = ticket.ownerEmail ? usersByEmail.get(ticket.ownerEmail) ?? null : null;
    const saved = await prisma.ticket.upsert({
      where: { idempotencyKey: ticket.key },
      update: { ticketNumber: ticket.ticketNumber, summary: ticket.summary, description: ticket.description, requestedPriority: ticket.requestedPriority, currentStatus: ticket.currentStatus, itPriority: ticket.itPriority, requesterId, requesterUserId, ownerId, categoryId: category.id, relatedSystemId: system.id },
      create: { ticketNumber: ticket.ticketNumber, ticketDate: now, summary: ticket.summary, description: ticket.description, requestedPriority: ticket.requestedPriority, currentStatus: ticket.currentStatus, itPriority: ticket.itPriority, idempotencyKey: ticket.key, requestFingerprint: `seed-${ticket.key}`, requesterId, requesterUserId, ownerId, categoryId: category.id, relatedSystemId: system.id },
      select: { id: true },
    });
    ticketIds.set(ticket.key, saved.id);
  }

  for (const action of LAB4_SEED_ACTIONS) {
    const ticketId = ticketIds.get(action.ticketKey);
    const performedById = usersByEmail.get(action.performedByEmail);
    const assignedToId = usersByEmail.get(action.assignedToEmail);
    if (!ticketId || !performedById || !assignedToId) throw new Error(`Missing seeded Action Taken dependency for ${action.key}`);
    await prisma.actionTaken.upsert({
      where: { seedKey: action.key },
      update: { ticketId, description: action.description, result: action.result, performedById, assignedToId, followUpRequired: action.followUpRequired, followUpNote: action.followUpNote, attachmentNotes: action.attachmentNotes, status: action.status },
      create: { seedKey: action.key, ticketId, actionDateTime: now, description: action.description, result: action.result, performedById, assignedToId, followUpRequired: action.followUpRequired, followUpNote: action.followUpNote, attachmentNotes: action.attachmentNotes, status: action.status },
    });
  }
}

async function main() {
  const prisma = getPrisma();
  await seedReferenceData(prisma);
  console.log(`Seeded ${CATEGORY_NAMES.length} categories, ${RELATED_SYSTEM_NAMES.length} systems, ${DEVELOPMENT_REQUESTERS.length} requesters, ${LAB3_SEED_USERS.length} Lab 3 users, ${LAB4_SEED_TICKETS.length} Lab 4 tickets, and ${LAB4_SEED_ACTIONS.length} Actions Taken.`);
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
