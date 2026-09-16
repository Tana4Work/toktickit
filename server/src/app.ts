import express, { Request, Response } from "express";
import cors from "cors";
import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import multer from "multer";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getPrisma } from "./prisma.js";
import { createSessionToken, passwordChangeRequired, publicUser, requireAuth, requireRoles, sessionExpiry, type AuthenticatedRequest } from "./auth.js";
import { hashPassword, isValidPassword, verifyPassword } from "./passwords.js";
// getPrisma() is your lazy database handle. Call it INSIDE a route when you
// need the DB (Issue 4). It is intentionally unused until then.
void getPrisma;

// The Express app is exported separately from app.listen() (see index.ts) so
// Supertest can import `app` without opening a port. Do not merge these files.
export const app = express();

app.use(cors());          // already wired: lets the Vite dev server call this API
app.use(express.json());

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const MAX_ACTIVE_ATTACHMENTS = 5;
const ALLOWED_ATTACHMENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const ALLOWED_ATTACHMENT_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".pdf"]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ATTACHMENT_SIZE },
  fileFilter: (_req, file, callback) => callback(null, ALLOWED_ATTACHMENT_TYPES.has(file.mimetype) && ALLOWED_ATTACHMENT_EXTENSIONS.has(path.extname(file.originalname).toLowerCase())),
});
const attachmentStorage = path.resolve(process.cwd(), "uploads");
const TICKET_NUMBER_YEAR = "2026";

function safeOriginalName(name: string) {
  const base = path.basename(name).replace(/[\u0000-\u001f\u007f]/g, "").replace(/[^a-zA-Z0-9._ -]/g, "_").trim();
  return base.slice(0, 180) || "attachment";
}

function attachmentResponse(attachment: { id: number; originalName: string; mimeType: string; sizeBytes: number; createdAt: Date; removedAt: Date | null; removalReason: string | null }) {
  return { id: attachment.id, originalName: attachment.originalName, mimeType: attachment.mimeType, sizeBytes: attachment.sizeBytes, createdAt: attachment.createdAt, removedAt: attachment.removedAt, removalReason: attachment.removalReason };
}

// ---------------------------------------------------------------------------
// Issue 2 — API health check
// Make the test in tests/lab-01/health.test.ts pass.
// It must return HTTP 200 with JSON: { status: "ok", service: "TokTickIT API" }
// ---------------------------------------------------------------------------
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "TokTickIT API" });
});

const requireApplicationUser = [requireAuth, passwordChangeRequired];
const requireRequester = [requireAuth, passwordChangeRequired, requireRoles("Requester")];
const requireStaff = [...requireApplicationUser, requireRoles("ITStaff", "Administrator")];

async function legacyRequesterIdForUser(userId: number) {
  const user = await getPrisma().user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) return null;
  const legacy = await getPrisma().developmentRequester.findUnique({ where: { email: user.email }, select: { id: true } });
  return legacy?.id ?? null;
}

function publicCommentResponse(comment: { id: number; content: string; createdAt: Date; author: { id: number; name: string; email: string; role: string } }) {
  return { id: comment.id, content: comment.content, createdAt: comment.createdAt, author: comment.author };
}

function internalNoteResponse(note: { id: number; content: string; createdAt: Date; author: { id: number; name: string; email: string; role: string } }) {
  return { id: note.id, content: note.content, createdAt: note.createdAt, author: note.author };
}

const STAFF_STATUSES = ["New", "Open", "InProgress", "WaitingForRequester", "Resolved", "Closed", "Reopened", "Cancelled"] as const;
type StaffStatus = (typeof STAFF_STATUSES)[number];
const STATUS_TRANSITIONS: Record<StaffStatus, readonly StaffStatus[]> = {
  New: ["Open", "Cancelled"],
  Open: ["InProgress", "WaitingForRequester", "Cancelled"],
  InProgress: ["WaitingForRequester", "Resolved", "Cancelled"],
  WaitingForRequester: ["InProgress", "Resolved", "Cancelled"],
  Resolved: ["Closed", "Reopened"],
  Closed: ["Reopened"],
  Reopened: ["InProgress", "Resolved", "Cancelled"],
  Cancelled: ["Reopened"],
};

function authBody(req: Request) {
  return isRecord(req.body) ? req.body : {};
}

app.post("/api/auth/login", async (req: Request, res: Response) => {
  const body = authBody(req);
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    res.status(400).json({ error: { code: "INVALID_CREDENTIALS", message: "Email and password are required." } });
    return;
  }
  try {
    const user = await getPrisma().user.findUnique({ where: { email } });
    if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Email or password is incorrect." } });
      return;
    }
    const token = createSessionToken();
    await getPrisma().session.create({ data: { tokenHash: createHash("sha256").update(token).digest("hex"), userId: user.id, expiresAt: sessionExpiry() } });
    res.status(200).json({ token, user: publicUser(user) });
  } catch {
    res.status(500).json({ error: { code: "LOGIN_ERROR", message: "Unable to complete login." } });
  }
});

app.post("/api/auth/logout", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.sessionId) await getPrisma().session.delete({ where: { id: req.sessionId } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: { code: "LOGOUT_ERROR", message: "Unable to complete logout." } });
  }
});

app.get("/api/auth/me", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({ user: publicUser(req.user!) });
});

app.post("/api/auth/change-password", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const body = authBody(req);
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
  const confirmation = typeof body.confirmPassword === "string" ? body.confirmPassword : "";
  if (req.user!.mustChangePassword && currentPassword && !verifyPassword(currentPassword, req.user!.passwordHash)) {
    res.status(401).json({ error: { code: "INVALID_CURRENT_PASSWORD", message: "The current temporary password is incorrect." } });
    return;
  }
  if (!isValidPassword(newPassword) || newPassword !== confirmation) {
    res.status(400).json({ error: { code: "INVALID_PASSWORD", message: "Passwords must match and be 8-128 characters." } });
    return;
  }
  try {
    const user = await getPrisma().user.update({ where: { id: req.user!.id }, data: { passwordHash: hashPassword(newPassword), mustChangePassword: false } });
    res.status(200).json({ user: publicUser(user) });
  } catch {
    res.status(500).json({ error: { code: "PASSWORD_CHANGE_ERROR", message: "Unable to change password." } });
  }
});

// ---------------------------------------------------------------------------
// Issue 4 — Category list
// Add:  GET /api/categories
//   -> read categories from PostgreSQL via getPrisma().category.findMany(...)
//   -> return each { id, name } in a predictable (id) order
//   -> on failure, respond 500 with a safe message (no internal details)
app.get("/api/categories", ...requireApplicationUser, async (_req: Request, res: Response) => {
  try {
    const categories = await getPrisma().category.findMany({
      where: { active: true },
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    });

    res.status(200).json(categories);
  } catch {
    res.status(500).json({ error: "Unable to load categories." });
  }
});
// ---------------------------------------------------------------------------

app.get("/api/related-systems", ...requireApplicationUser, async (_req: Request, res: Response) => {
  try {
    const systems = await getPrisma().relatedSystem.findMany({
      where: { active: true },
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    });
    res.status(200).json(systems);
  } catch {
    res.status(500).json({ error: "Unable to load related systems." });
  }
});

app.get("/api/requesters", ...requireApplicationUser, async (_req: Request, res: Response) => {
  try {
    const requesters = await getPrisma().developmentRequester.findMany({
      where: { active: true },
      orderBy: { id: "asc" },
      select: { id: true, name: true, email: true },
    });
    res.status(200).json(requesters);
  } catch {
    res.status(500).json({ error: "Unable to load Development Requesters." });
  }
});

const ALLOWED_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

function requestFingerprint(input: unknown) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

app.post("/api/tickets", ...requireRequester, async (req: AuthenticatedRequest, res: Response) => {
  const idempotencyKey = req.header("Idempotency-Key")?.trim();
  if (!idempotencyKey || idempotencyKey.length > 120) {
    res.status(400).json({ error: "A valid Idempotency-Key header is required." });
    return;
  }

  const body = req.body as unknown;
  if (!isRecord(body)) {
    res.status(400).json({ error: "Invalid ticket data." });
    return;
  }

  const requesterId = await legacyRequesterIdForUser(req.user!.id) ?? NaN;
  const categoryId = typeof body.categoryId === "number" ? body.categoryId : NaN;
  const relatedSystemId = typeof body.relatedSystemId === "number" ? body.relatedSystemId : NaN;
  const summary = typeof body.summary === "string" ? body.summary.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const requestedPriority = body.requestedPriority;
  const normalized = { requesterId, categoryId, relatedSystemId, summary, description, requestedPriority };

  if (!Number.isInteger(requesterId) || !Number.isInteger(categoryId) || !Number.isInteger(relatedSystemId) ||
      summary.length < 3 || summary.length > 120 || description.length < 10 || description.length > 2000 ||
      typeof requestedPriority !== "string" || !ALLOWED_PRIORITIES.includes(requestedPriority as (typeof ALLOWED_PRIORITIES)[number])) {
    res.status(400).json({ error: "Please provide valid ticket fields." });
    return;
  }

  const prisma = getPrisma();
  const fingerprint = requestFingerprint(normalized);
  try {
    const existing = await prisma.ticket.findUnique({ where: { idempotencyKey } });
    if (existing) {
      if (existing.requestFingerprint !== fingerprint) {
        res.status(409).json({ error: "This Idempotency-Key was already used with different ticket data." });
        return;
      }
      res.status(200).json(existing);
      return;
    }

    const [requester, category, relatedSystem] = await Promise.all([
      prisma.developmentRequester.findFirst({ where: { id: requesterId, active: true }, select: { id: true } }),
      prisma.category.findFirst({ where: { id: categoryId, active: true }, select: { id: true } }),
      prisma.relatedSystem.findFirst({ where: { id: relatedSystemId, active: true }, select: { id: true } }),
    ]);
    if (!requester || !category || !relatedSystem) {
      res.status(404).json({ error: "One or more selected reference records were not found." });
      return;
    }

    const created = await prisma.ticket.create({
      data: {
        ticketNumber: `PENDING-${idempotencyKey}`,
        ticketDate: new Date(),
        summary,
        description,
        requestedPriority: requestedPriority as (typeof ALLOWED_PRIORITIES)[number],
        itPriority: requestedPriority as (typeof ALLOWED_PRIORITIES)[number],
        currentStatus: "New",
        idempotencyKey,
        requestFingerprint: fingerprint,
        requesterId,
        requesterUserId: req.user!.id,
        categoryId,
        relatedSystemId,
      },
    });
    const ticketNumber = `TK-${TICKET_NUMBER_YEAR}-${String(created.id).padStart(6, "0")}`;
    const ticket = await prisma.ticket.update({
      where: { id: created.id },
      data: { ticketNumber },
    });
    res.status(201).json(ticket);
  } catch (error) {
    if (isRecord(error) && error.code === "P2002") {
      const existing = await prisma.ticket.findUnique({ where: { idempotencyKey } });
      if (existing && existing.requestFingerprint === fingerprint) {
        res.status(200).json(existing);
        return;
      }
      res.status(409).json({ error: "This ticket submission conflicts with an existing request." });
      return;
    }
    res.status(500).json({ error: "Unable to create ticket." });
  }
});

const TICKET_SORT_FIELDS = ["ticketDate", "ticketNumber", "summary", "requestedPriority", "currentStatus", "updatedAt"] as const;
type TicketSortField = (typeof TICKET_SORT_FIELDS)[number];

function queryString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

app.get("/api/tickets", ...requireRequester, async (req: AuthenticatedRequest, res: Response) => {
  const requesterId = await legacyRequesterIdForUser(req.user!.id) ?? NaN;
  const search = queryString(req.query.search)?.trim() ?? "";
  const categoryId = queryString(req.query.categoryId);
  const relatedSystemId = queryString(req.query.relatedSystemId);
  const requestedPriority = queryString(req.query.requestedPriority);
  const status = queryString(req.query.status);
  const sortBy = queryString(req.query.sortBy) ?? "updatedAt";
  const sortDirection = queryString(req.query.sortDirection) ?? "desc";
  const page = Number(queryString(req.query.page) ?? "1");
  const pageSize = Number(queryString(req.query.pageSize) ?? "10");

  const parsedCategoryId = categoryId === undefined ? undefined : Number(categoryId);
  const parsedRelatedSystemId = relatedSystemId === undefined ? undefined : Number(relatedSystemId);
  const validPriority = requestedPriority === undefined || ALLOWED_PRIORITIES.includes(requestedPriority as (typeof ALLOWED_PRIORITIES)[number]);
  const validStatus = status === undefined || status === "New";
  const validSort = TICKET_SORT_FIELDS.includes(sortBy as TicketSortField);
  const validDirection = sortDirection === "asc" || sortDirection === "desc";

  if (!Number.isInteger(requesterId) || requesterId < 1 ||
      (parsedCategoryId !== undefined && (!Number.isInteger(parsedCategoryId) || parsedCategoryId < 1)) ||
      (parsedRelatedSystemId !== undefined && (!Number.isInteger(parsedRelatedSystemId) || parsedRelatedSystemId < 1)) ||
      !validPriority || !validStatus || !validSort || !validDirection ||
      !Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    res.status(400).json({ error: "Invalid ticket list query." });
    return;
  }

  const where: Prisma.TicketWhereInput = {
    OR: [{ requesterUserId: req.user!.id }, ...(Number.isInteger(requesterId) ? [{ requesterId }] : [])],
    ...(search ? { OR: [{ ticketNumber: { contains: search, mode: "insensitive" } }, { summary: { contains: search, mode: "insensitive" } }] } : {}),
    ...(parsedCategoryId === undefined ? {} : { categoryId: parsedCategoryId }),
    ...(parsedRelatedSystemId === undefined ? {} : { relatedSystemId: parsedRelatedSystemId }),
    ...(requestedPriority === undefined ? {} : { requestedPriority: requestedPriority as (typeof ALLOWED_PRIORITIES)[number] }),
    ...(status === undefined ? {} : { currentStatus: "New" }),
  };
  const orderBy = [{ [sortBy]: sortDirection }, { id: "asc" }] as Prisma.TicketOrderByWithRelationInput[];

  try {
    const prisma = getPrisma();
    const [totalItems, tickets] = await prisma.$transaction([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, ticketNumber: true, summary: true, requestedPriority: true,
          currentStatus: true, ticketDate: true, updatedAt: true,
          category: { select: { id: true, name: true } },
          relatedSystem: { select: { id: true, name: true } },
        },
      }),
    ]);
    res.status(200).json({ data: tickets, pagination: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) } });
  } catch {
    res.status(500).json({ error: "Unable to load tickets." });
  }
});

app.get("/api/tickets/:ticketId", ...requireRequester, async (req: AuthenticatedRequest, res: Response) => {
  const ticketId = Number(req.params.ticketId);
  const requesterId = await legacyRequesterIdForUser(req.user!.id) ?? NaN;
  if (!Number.isInteger(ticketId) || ticketId < 1 || !Number.isInteger(requesterId) || requesterId < 1) {
    res.status(400).json({ error: "Invalid ticket or requester ID." });
    return;
  }

  try {
    const ticket = await getPrisma().ticket.findFirst({
      where: { id: ticketId, OR: [{ requesterUserId: req.user!.id }, ...(Number.isInteger(requesterId) ? [{ requesterId }] : [])] },
      select: {
        id: true, ticketNumber: true, ticketDate: true, summary: true, description: true,
        requestedPriority: true, currentStatus: true, createdAt: true, updatedAt: true,
        requester: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        problemAppearsResolvedAt: true,
        publicComments: { orderBy: { createdAt: "asc" }, select: { id: true, content: true, createdAt: true, author: { select: { id: true, name: true, email: true, role: true } } } },
        attachments: { orderBy: { createdAt: "asc" }, select: { id: true, originalName: true, mimeType: true, sizeBytes: true, createdAt: true, removedAt: true, removalReason: true } },
      },
    });
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found." });
      return;
    }
    res.status(200).json(ticket);
  } catch {
    res.status(500).json({ error: "Unable to load ticket." });
  }
});

app.post("/api/tickets/:ticketId/comments", ...requireRequester, async (req: AuthenticatedRequest, res: Response) => {
  const ticketId = Number(req.params.ticketId);
  const content = isRecord(req.body) && typeof req.body.content === "string" ? req.body.content.trim() : "";
  const requesterId = await legacyRequesterIdForUser(req.user!.id);
  if (!Number.isInteger(ticketId) || ticketId < 1 || content.length < 1 || content.length > 2000) {
    res.status(400).json({ error: { code: "INVALID_COMMENT", message: "Comment content must be between 1 and 2000 characters." } });
    return;
  }
  try {
    const ticket = await getPrisma().ticket.findFirst({ where: { id: ticketId, OR: [{ requesterUserId: req.user!.id }, ...(requesterId ? [{ requesterId }] : [])] }, select: { id: true } });
    if (!ticket) { res.status(404).json({ error: { code: "TICKET_NOT_FOUND", message: "Ticket not found." } }); return; }
    const comment = await getPrisma().publicComment.create({ data: { ticketId, authorId: req.user!.id, content }, select: { id: true, content: true, createdAt: true, author: { select: { id: true, name: true, email: true, role: true } } } });
    res.status(201).json(publicCommentResponse(comment));
  } catch { res.status(500).json({ error: { code: "COMMENT_CREATE_ERROR", message: "Unable to add Public Comment." } }); }
});

app.get("/api/tickets/:ticketId/comments", ...requireRequester, async (req: AuthenticatedRequest, res: Response) => {
  const ticketId = Number(req.params.ticketId);
  const requesterId = await legacyRequesterIdForUser(req.user!.id);
  if (!Number.isInteger(ticketId) || ticketId < 1) { res.status(400).json({ error: { code: "INVALID_TICKET", message: "Invalid ticket ID." } }); return; }
  try {
    const ticket = await getPrisma().ticket.findFirst({ where: { id: ticketId, OR: [{ requesterUserId: req.user!.id }, ...(requesterId ? [{ requesterId }] : [])] }, select: { id: true } });
    if (!ticket) { res.status(404).json({ error: { code: "TICKET_NOT_FOUND", message: "Ticket not found." } }); return; }
    const comments = await getPrisma().publicComment.findMany({ where: { ticketId }, orderBy: { createdAt: "asc" }, select: { id: true, content: true, createdAt: true, author: { select: { id: true, name: true, email: true, role: true } } } });
    res.status(200).json(comments.map(publicCommentResponse));
  } catch { res.status(500).json({ error: { code: "COMMENT_LIST_ERROR", message: "Unable to load Public Comments." } }); }
});

app.post("/api/tickets/:ticketId/problem-resolved", ...requireRequester, async (req: AuthenticatedRequest, res: Response) => {
  const ticketId = Number(req.params.ticketId);
  const requesterId = await legacyRequesterIdForUser(req.user!.id);
  if (!Number.isInteger(ticketId) || ticketId < 1) { res.status(400).json({ error: { code: "INVALID_TICKET", message: "Invalid ticket ID." } }); return; }
  try {
    const ticket = await getPrisma().ticket.findFirst({ where: { id: ticketId, OR: [{ requesterUserId: req.user!.id }, ...(requesterId ? [{ requesterId }] : [])] }, select: { id: true } });
    if (!ticket) { res.status(404).json({ error: { code: "TICKET_NOT_FOUND", message: "Ticket not found." } }); return; }
    const updated = await getPrisma().ticket.update({ where: { id: ticketId }, data: { problemAppearsResolvedAt: new Date(), problemAppearsResolvedById: req.user!.id }, select: { id: true, problemAppearsResolvedAt: true } });
    res.status(200).json({ problemAppearsResolvedAt: updated.problemAppearsResolvedAt });
  } catch { res.status(500).json({ error: { code: "RESOLUTION_INDICATION_ERROR", message: "Unable to record the resolution indication." } }); }
});

app.get("/api/staff/tickets", ...requireStaff, async (req: AuthenticatedRequest, res: Response) => {
  const search = queryString(req.query.search)?.trim() ?? "";
  const status = queryString(req.query.status);
  const priority = queryString(req.query.priority);
  const owner = queryString(req.query.owner);
  const sortBy = queryString(req.query.sortBy) ?? "updatedAt";
  const sortDirection = queryString(req.query.sortDirection) === "asc" ? "asc" : "desc";
  const page = Number(queryString(req.query.page) ?? "1");
  const pageSize = Number(queryString(req.query.pageSize) ?? "10");
  const validSort = ["updatedAt", "ticketDate", "ticketNumber", "summary", "itPriority", "currentStatus"].includes(sortBy);
  const validStatus = status === undefined || STAFF_STATUSES.includes(status as StaffStatus);
  const validPriority = priority === undefined || ALLOWED_PRIORITIES.includes(priority as (typeof ALLOWED_PRIORITIES)[number]);
  if (!validSort || !validStatus || !validPriority || !Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) { res.status(400).json({ error: { code: "INVALID_QUEUE_QUERY", message: "Invalid queue query." } }); return; }
  const ownerFilter = owner === undefined || owner === "all" ? undefined : owner === "unassigned" ? null : Number(owner);
  if (owner !== undefined && owner !== "all" && owner !== "unassigned" && (!Number.isInteger(ownerFilter) || (ownerFilter as number) < 1)) { res.status(400).json({ error: { code: "INVALID_QUEUE_QUERY", message: "Invalid owner filter." } }); return; }
  const where: Prisma.TicketWhereInput = { ...(search ? { OR: [{ ticketNumber: { contains: search, mode: "insensitive" } }, { summary: { contains: search, mode: "insensitive" } }, { requester: { name: { contains: search, mode: "insensitive" } } }] } : {}), ...(status ? { currentStatus: status as StaffStatus } : {}), ...(priority ? { itPriority: priority as (typeof ALLOWED_PRIORITIES)[number] } : {}), ...(ownerFilter === null ? { ownerId: null } : ownerFilter === undefined ? {} : { ownerId: ownerFilter }) };
  try {
    const prisma = getPrisma();
    const [totalItems, data] = await Promise.all([prisma.ticket.count({ where }), prisma.ticket.findMany({ where, orderBy: { [sortBy]: sortDirection }, skip: (page - 1) * pageSize, take: pageSize, select: { id: true, ticketNumber: true, summary: true, requestedPriority: true, itPriority: true, currentStatus: true, ticketDate: true, updatedAt: true, requester: { select: { id: true, name: true, email: true } }, owner: { select: { id: true, name: true, email: true, role: true } }, category: { select: { id: true, name: true } }, relatedSystem: { select: { id: true, name: true } } } })]);
    res.status(200).json({ data, pagination: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) } });
  } catch { res.status(500).json({ error: { code: "QUEUE_ERROR", message: "Unable to load the IT Staff Queue." } }); }
});

app.get("/api/staff/owners", ...requireStaff, async (_req: AuthenticatedRequest, res: Response) => {
  try { const owners = await getPrisma().user.findMany({ where: { active: true, role: { in: ["ITStaff", "Administrator"] } }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true, role: true } }); res.status(200).json(owners); } catch { res.status(500).json({ error: { code: "OWNER_LIST_ERROR", message: "Unable to load Ticket owners." } }); }
});

app.get("/api/staff/tickets/:ticketId", ...requireStaff, async (req: AuthenticatedRequest, res: Response) => {
  const ticketId = Number(req.params.ticketId);
  if (!Number.isInteger(ticketId) || ticketId < 1) { res.status(400).json({ error: { code: "INVALID_TICKET", message: "Invalid Ticket ID." } }); return; }
  try {
    const ticket = await getPrisma().ticket.findUnique({ where: { id: ticketId }, select: { id: true, ticketNumber: true, ticketDate: true, summary: true, description: true, requestedPriority: true, itPriority: true, currentStatus: true, createdAt: true, updatedAt: true, requester: { select: { id: true, name: true, email: true } }, owner: { select: { id: true, name: true, email: true, role: true } }, category: { select: { id: true, name: true } }, relatedSystem: { select: { id: true, name: true } }, problemAppearsResolvedAt: true, attachments: { orderBy: { createdAt: "asc" }, select: { id: true, originalName: true, mimeType: true, sizeBytes: true, createdAt: true, removedAt: true, removalReason: true } }, publicComments: { orderBy: { createdAt: "asc" }, select: { id: true, content: true, createdAt: true, author: { select: { id: true, name: true, email: true, role: true } } } }, internalNotes: { orderBy: { createdAt: "asc" }, select: { id: true, content: true, createdAt: true, author: { select: { id: true, name: true, email: true, role: true } } } } } });
    if (!ticket) { res.status(404).json({ error: { code: "TICKET_NOT_FOUND", message: "Ticket not found." } }); return; }
    res.status(200).json(ticket);
  } catch { res.status(500).json({ error: { code: "STAFF_TICKET_ERROR", message: "Unable to load Ticket Detail." } }); }
});

app.patch("/api/staff/tickets/:ticketId/owner", ...requireStaff, async (req: AuthenticatedRequest, res: Response) => {
  const ticketId = Number(req.params.ticketId); const body = authBody(req); const ownerId = !Object.prototype.hasOwnProperty.call(body, "ownerId") ? req.user!.id : body.ownerId === null ? null : Number(body.ownerId);
  if (!Number.isInteger(ticketId) || ticketId < 1 || (ownerId !== null && (!Number.isInteger(ownerId) || ownerId < 1))) { res.status(400).json({ error: { code: "INVALID_OWNER", message: "Owner must be an active IT Staff or Administrator." } }); return; }
  try { const owner = ownerId === null ? null : await getPrisma().user.findFirst({ where: { id: ownerId, active: true, role: { in: ["ITStaff", "Administrator"] } }, select: { id: true, name: true, email: true, role: true } }); if (ownerId !== null && !owner) { res.status(422).json({ error: { code: "INVALID_OWNER", message: "Owner must be an active IT Staff or Administrator." } }); return; } const ticket = await getPrisma().ticket.update({ where: { id: ticketId }, data: { ownerId }, select: { id: true, owner: { select: { id: true, name: true, email: true, role: true } } } }); res.status(200).json(ticket); } catch { res.status(404).json({ error: { code: "TICKET_NOT_FOUND", message: "Ticket not found." } }); }
});

app.patch("/api/staff/tickets/:ticketId/priority", ...requireStaff, async (req: AuthenticatedRequest, res: Response) => {
  const ticketId = Number(req.params.ticketId); const body = authBody(req); const priority = body.itPriority ?? body.priority;
  if (!Number.isInteger(ticketId) || !ALLOWED_PRIORITIES.includes(priority as (typeof ALLOWED_PRIORITIES)[number])) { res.status(400).json({ error: { code: "INVALID_PRIORITY", message: "Invalid IT Priority." } }); return; }
  try { const ticket = await getPrisma().ticket.update({ where: { id: ticketId }, data: { itPriority: priority as (typeof ALLOWED_PRIORITIES)[number] }, select: { id: true, itPriority: true } }); res.status(200).json(ticket); } catch { res.status(404).json({ error: { code: "TICKET_NOT_FOUND", message: "Ticket not found." } }); }
});

app.patch("/api/staff/tickets/:ticketId/status", ...requireStaff, async (req: AuthenticatedRequest, res: Response) => {
  const ticketId = Number(req.params.ticketId); const nextStatus = authBody(req).status as StaffStatus;
  if (!Number.isInteger(ticketId) || !STAFF_STATUSES.includes(nextStatus)) { res.status(400).json({ error: { code: "INVALID_STATUS", message: "Invalid Ticket status." } }); return; }
  try { const existing = await getPrisma().ticket.findUnique({ where: { id: ticketId }, select: { currentStatus: true } }); if (!existing) { res.status(404).json({ error: { code: "TICKET_NOT_FOUND", message: "Ticket not found." } }); return; } if (!STATUS_TRANSITIONS[existing.currentStatus as StaffStatus].includes(nextStatus)) { res.status(422).json({ error: { code: "INVALID_STATUS_TRANSITION", message: `Cannot change status from ${existing.currentStatus} to ${nextStatus}.` } }); return; } const ticket = await getPrisma().ticket.update({ where: { id: ticketId }, data: { currentStatus: nextStatus }, select: { id: true, currentStatus: true, updatedAt: true } }); res.status(200).json(ticket); } catch { res.status(500).json({ error: { code: "STATUS_UPDATE_ERROR", message: "Unable to update Ticket status." } }); }
});

app.post("/api/staff/tickets/:ticketId/comments", ...requireStaff, async (req: AuthenticatedRequest, res: Response) => {
  const ticketId = Number(req.params.ticketId); const content = typeof authBody(req).content === "string" ? String(authBody(req).content).trim() : "";
  if (!Number.isInteger(ticketId) || ticketId < 1 || content.length < 1 || content.length > 2000) { res.status(400).json({ error: { code: "INVALID_COMMENT", message: "Comment content must be between 1 and 2000 characters." } }); return; }
  try { const comment = await getPrisma().publicComment.create({ data: { ticketId, authorId: req.user!.id, content }, select: { id: true, content: true, createdAt: true, author: { select: { id: true, name: true, email: true, role: true } } } }); res.status(201).json(publicCommentResponse(comment)); } catch { res.status(404).json({ error: { code: "TICKET_NOT_FOUND", message: "Ticket not found." } }); }
});

app.get("/api/staff/tickets/:ticketId/comments", ...requireStaff, async (req: AuthenticatedRequest, res: Response) => {
  const ticketId = Number(req.params.ticketId); if (!Number.isInteger(ticketId) || ticketId < 1) { res.status(400).json({ error: { code: "INVALID_TICKET", message: "Invalid Ticket ID." } }); return; }
  try { const comments = await getPrisma().publicComment.findMany({ where: { ticketId }, orderBy: { createdAt: "asc" }, select: { id: true, content: true, createdAt: true, author: { select: { id: true, name: true, email: true, role: true } } } }); res.status(200).json(comments.map(publicCommentResponse)); } catch { res.status(404).json({ error: { code: "TICKET_NOT_FOUND", message: "Ticket not found." } }); }
});

app.post("/api/staff/tickets/:ticketId/notes", ...requireStaff, async (req: AuthenticatedRequest, res: Response) => {
  const ticketId = Number(req.params.ticketId); const content = typeof authBody(req).content === "string" ? String(authBody(req).content).trim() : "";
  if (!Number.isInteger(ticketId) || ticketId < 1 || content.length < 1 || content.length > 2000) { res.status(400).json({ error: { code: "INVALID_NOTE", message: "Internal Note content must be between 1 and 2000 characters." } }); return; }
  try { const note = await getPrisma().internalNote.create({ data: { ticketId, authorId: req.user!.id, content }, select: { id: true, content: true, createdAt: true, author: { select: { id: true, name: true, email: true, role: true } } } }); res.status(201).json(internalNoteResponse(note)); } catch { res.status(404).json({ error: { code: "TICKET_NOT_FOUND", message: "Ticket not found." } }); }
});

app.get("/api/staff/tickets/:ticketId/notes", ...requireStaff, async (req: AuthenticatedRequest, res: Response) => {
  const ticketId = Number(req.params.ticketId); if (!Number.isInteger(ticketId) || ticketId < 1) { res.status(400).json({ error: { code: "INVALID_TICKET", message: "Invalid Ticket ID." } }); return; }
  try { const notes = await getPrisma().internalNote.findMany({ where: { ticketId }, orderBy: { createdAt: "asc" }, select: { id: true, content: true, createdAt: true, author: { select: { id: true, name: true, email: true, role: true } } } }); res.status(200).json(notes.map(internalNoteResponse)); } catch { res.status(404).json({ error: { code: "TICKET_NOT_FOUND", message: "Ticket not found." } }); }
});

function attachmentRequesterId(req: Request) {
  const requesterId = Number(queryString(req.query.requesterId));
  return Number.isInteger(requesterId) && requesterId > 0 ? requesterId : null;
}

app.post("/api/tickets/:ticketId/attachments", ...requireRequester, (req: AuthenticatedRequest, res: Response) => {
  upload.single("file")(req, res, async (error) => {
    const ticketId = Number(req.params.ticketId);
    const requesterId = await legacyRequesterIdForUser(req.user!.id);
    if (!Number.isInteger(ticketId) || ticketId < 1 || requesterId === null) {
      res.status(400).json({ error: "Invalid ticket or requester ID." });
      return;
    }
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ error: "Each attachment must be 5 MB or smaller." });
      return;
    }
    if (error || !req.file || !ALLOWED_ATTACHMENT_TYPES.has(req.file.mimetype) || !ALLOWED_ATTACHMENT_EXTENSIONS.has(path.extname(req.file.originalname).toLowerCase())) {
      res.status(415).json({ error: "Only JPG, JPEG, PNG, WEBP, and PDF attachments are allowed." });
      return;
    }

    try {
      const prisma = getPrisma();
      const ticket = await prisma.ticket.findFirst({ where: { id: ticketId, OR: [{ requesterUserId: req.user!.id }, { requesterId }] }, select: { id: true } });
      if (!ticket) { res.status(404).json({ error: "Ticket not found." }); return; }
      const activeCount = await prisma.attachment.count({ where: { ticketId, removedAt: null } });
      if (activeCount >= MAX_ACTIVE_ATTACHMENTS) { res.status(409).json({ error: "A ticket may have at most five active attachments." }); return; }

      const extension = path.extname(req.file.originalname).toLowerCase();
      const storageKey = `${randomUUID()}${extension}`;
      await mkdir(attachmentStorage, { recursive: true });
      await writeFile(path.join(attachmentStorage, storageKey), req.file.buffer, { flag: "wx" });
      try {
        const attachment = await prisma.attachment.create({ data: { ticketId, originalName: safeOriginalName(req.file.originalname), storageKey, mimeType: req.file.mimetype, sizeBytes: req.file.size } });
        res.status(201).json(attachmentResponse(attachment));
      } catch (dbError) {
        await unlink(path.join(attachmentStorage, storageKey)).catch(() => undefined);
        throw dbError;
      }
    } catch {
      res.status(500).json({ error: "Unable to upload attachment." });
    }
  });
});

app.get("/api/tickets/:ticketId/attachments", ...requireRequester, async (req: AuthenticatedRequest, res: Response) => {
  const ticketId = Number(req.params.ticketId);
  const requesterId = await legacyRequesterIdForUser(req.user!.id);
  if (!Number.isInteger(ticketId) || ticketId < 1 || requesterId === null) { res.status(400).json({ error: "Invalid ticket or requester ID." }); return; }
  try {
    const ticket = await getPrisma().ticket.findFirst({ where: { id: ticketId, OR: [{ requesterUserId: req.user!.id }, { requesterId }] }, select: { id: true } });
    if (!ticket) { res.status(404).json({ error: "Ticket not found." }); return; }
    const attachments = await getPrisma().attachment.findMany({ where: { ticketId }, orderBy: { createdAt: "asc" } });
    res.status(200).json(attachments.map(attachmentResponse));
  } catch { res.status(500).json({ error: "Unable to load attachments." }); }
});

app.get("/api/attachments/:attachmentId/download", ...requireRequester, async (req: AuthenticatedRequest, res: Response) => {
  const attachmentId = Number(req.params.attachmentId);
  const requesterId = await legacyRequesterIdForUser(req.user!.id);
  if (!Number.isInteger(attachmentId) || attachmentId < 1 || requesterId === null) { res.status(400).json({ error: "Invalid attachment or requester ID." }); return; }
  try {
    const attachment = await getPrisma().attachment.findFirst({ where: { id: attachmentId, removedAt: null, ticket: { OR: [{ requesterUserId: req.user!.id }, { requesterId }] } } });
    if (!attachment) { res.status(404).json({ error: "Attachment not found." }); return; }
    const safePath = path.resolve(attachmentStorage, attachment.storageKey);
    if (path.dirname(safePath) !== attachmentStorage) { res.status(404).json({ error: "Attachment not found." }); return; }
    res.download(safePath, attachment.originalName, (error) => { if (error && !res.headersSent) res.status(404).json({ error: "Attachment not found." }); });
  } catch { res.status(500).json({ error: "Unable to download attachment." }); }
});

app.delete("/api/attachments/:attachmentId", ...requireRequester, async (req: AuthenticatedRequest, res: Response) => {
  const attachmentId = Number(req.params.attachmentId);
  const requesterId = await legacyRequesterIdForUser(req.user!.id);
  const reason = isRecord(req.body) && typeof req.body.reason === "string" ? req.body.reason.trim() : "";
  if (!Number.isInteger(attachmentId) || attachmentId < 1 || requesterId === null) { res.status(400).json({ error: "Invalid attachment or requester ID." }); return; }
  if (reason.length < 3 || reason.length > 200) { res.status(400).json({ error: "A removal reason between 3 and 200 characters is required." }); return; }
  try {
    const attachment = await getPrisma().attachment.findFirst({ where: { id: attachmentId, ticket: { OR: [{ requesterUserId: req.user!.id }, { requesterId }] } } });
    if (!attachment) { res.status(404).json({ error: "Attachment not found." }); return; }
    if (attachment.removedAt) { res.status(409).json({ error: "Attachment has already been removed." }); return; }
    const removed = await getPrisma().attachment.update({ where: { id: attachmentId }, data: { removedAt: new Date(), removalReason: reason } });
    await unlink(path.join(attachmentStorage, attachment.storageKey)).catch(() => undefined);
    res.status(200).json(attachmentResponse(removed));
  } catch { res.status(500).json({ error: "Unable to remove attachment." }); }
});

export default app;
