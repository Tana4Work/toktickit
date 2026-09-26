import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const baseURL = "http://127.0.0.1:5173";
const root = path.resolve("artifacts/lab-03/screenshots/capture-2026-09-26");
const viewports = {
  desktop: { width: 1440, height: 1000 },
  tablet: { width: 1024, height: 1000 },
  mobile: { width: 390, height: 844 },
};

async function ensureFolders() {
  for (const folder of ["authentication", "staff-queue", "staff-ticket-detail", "user-management"]) {
    await fs.mkdir(path.join(root, folder), { recursive: true });
  }
}

async function clearSession(page) {
  await page.goto(`${baseURL}/`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

async function login(page, email, passwords, newPassword) {
  for (const password of passwords) {
    await clearSession(page);
    await page.locator("#login-email").fill(email);
    await page.locator("#login-password").fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();
    const changePassword = page.getByRole("heading", { name: "Change Your Password" });
    const destination = page.getByRole("heading", { name: /My Queue|User Management/ });
    await Promise.race([changePassword.waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined), destination.waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined)]);
    if (await changePassword.isVisible().catch(() => false)) {
      await page.getByLabel("Current (temporary) password").fill(password);
      await page.getByLabel("New password", { exact: true }).fill(newPassword);
      await page.getByLabel("Confirm new password", { exact: true }).fill(newPassword);
      await page.getByRole("button", { name: "Continue" }).click();
      await destination.waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    }
    if (await destination.isVisible().catch(() => false)) return;
  }
  throw new Error(`Unable to authenticate ${email} with the local seed credentials.`);
}

async function captureViewports(page, folder, name, action = async () => undefined) {
  for (const [size, viewport] of Object.entries(viewports)) {
    await page.setViewportSize(viewport);
    await action(size);
    await page.screenshot({ path: path.join(root, folder, `${name}-${size}.png`), fullPage: true });
  }
}

await ensureFolders();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await captureViewports(page, "authentication", "login", async () => { await clearSession(page); });

await login(page, "it.staff.one@example.com", ["CaptureStaff123!", "ITStaff123!", "Lab3StaffE2e123!"], "CaptureStaff123!");
await captureViewports(page, "staff-queue", "queue");
const ticketButton = page.locator(".staff-ticket-number").first();
if (await ticketButton.count()) {
  await ticketButton.click();
  await page.getByRole("heading", { name: /TK-\d{4}-\d{6}/ }).waitFor({ state: "visible" });
  await captureViewports(page, "staff-ticket-detail", "detail");
}

await login(page, "admin@example.com", ["Admin123456!", "Lab3AdminE2e123!"], "CaptureAdmin123!");
await page.getByRole("button", { name: "User Management" }).click();
await page.getByRole("heading", { name: "User Management" }).waitFor({ state: "visible" });
await captureViewports(page, "user-management", "users");

await browser.close();
console.log(`Captured Lab 3 screenshots under ${root}`);
