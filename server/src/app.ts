import express, { Request, Response } from "express";
import cors from "cors";
import { createHash } from "node:crypto";
import { getPrisma } from "./prisma.js";
// getPrisma() is your lazy database handle. Call it INSIDE a route when you
// need the DB (Issue 4). It is intentionally unused until then.
void getPrisma;

// The Express app is exported separately from app.listen() (see index.ts) so
// Supertest can import `app` without opening a port. Do not merge these files.
export const app = express();

app.use(cors());          // already wired: lets the Vite dev server call this API
app.use(express.json());

// ---------------------------------------------------------------------------
// Issue 2 — API health check
// Make the test in tests/lab-01/health.test.ts pass.
// It must return HTTP 200 with JSON: { status: "ok", service: "TokTickIT API" }
// ---------------------------------------------------------------------------
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "TokTickIT API" });
});

// ---------------------------------------------------------------------------
// Issue 4 — Category list
// Add:  GET /api/categories
//   -> read categories from PostgreSQL via getPrisma().category.findMany(...)
//   -> return each { id, name } in a predictable (id) order
//   -> on failure, respond 500 with a safe message (no internal details)
app.get("/api/categories", async (_req: Request, res: Response) => {
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

app.get("/api/related-systems", async (_req: Request, res: Response) => {
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

app.get("/api/requesters", async (_req: Request, res: Response) => {
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

app.post("/api/tickets", async (req: Request, res: Response) => {
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

  const requesterId = typeof body.requesterId === "number" ? body.requesterId : NaN;
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
        currentStatus: "New",
        idempotencyKey,
        requestFingerprint: fingerprint,
        requesterId,
        categoryId,
        relatedSystemId,
      },
    });
    const ticketNumber = `TK-${created.ticketDate.getUTCFullYear()}-${String(created.id).padStart(6, "0")}`;
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

export default app;
