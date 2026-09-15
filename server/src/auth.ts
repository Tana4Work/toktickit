import { createHash, randomBytes } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { User } from "@prisma/client";
import { getPrisma } from "./prisma.js";

export type AuthenticatedRequest = Request & { user?: User; sessionId?: number };

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function sessionExpiry() {
  return new Date(Date.now() + SESSION_TTL_MS);
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  if (!token) {
    res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Authentication is required." } });
    return;
  }

  try {
    const session = await getPrisma().session.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
    if (!session || session.expiresAt <= new Date() || !session.user.active) {
      res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Authentication is required." } });
      return;
    }
    req.user = session.user;
    req.sessionId = session.id;
    next();
  } catch {
    res.status(500).json({ error: { code: "AUTHENTICATION_ERROR", message: "Unable to verify authentication." } });
  }
}

export function publicUser(user: User) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, active: user.active, mustChangePassword: user.mustChangePassword };
}

export function passwordChangeRequired(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user?.mustChangePassword) {
    res.status(403).json({ error: { code: "PASSWORD_CHANGE_REQUIRED", message: "Change the initial password before continuing." } });
    return;
  }
  next();
}

export function requireRoles(...roles: User["role"][]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: { code: "FORBIDDEN", message: "You are not permitted to perform this operation." } });
      return;
    }
    next();
  };
}
