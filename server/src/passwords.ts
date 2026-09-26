import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const HASH_PREFIX = "scrypt";
const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${HASH_PREFIX}$${salt}$${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [prefix, salt, expectedHex] = storedHash.split("$");
  if (prefix !== HASH_PREFIX || !salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = scryptSync(password, salt, KEY_LENGTH);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function isValidPassword(password: unknown): password is string {
  return typeof password === "string" && password.length >= 8 && password.length <= 128;
}
