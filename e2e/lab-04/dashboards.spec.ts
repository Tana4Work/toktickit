import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const screenshotRoot = "artifacts/lab-04/screenshots";
await mkdir(`${screenshotRoot}/requester-dashboard`, { recursive: true });
await mkdir(`${screenshotRoot}/staff-dashboard`, { recursive: true });

async function signIn(page: Page, email: string, password: string, newPassword: string) {
  await page.goto("/");
  await page.getByLabel("Email address").fill(email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  const changePassword = page.getByRole("heading", { name: "Change Your Password" });
  if (await changePassword.count()) {
    await page.getByLabel("Current (temporary) password").fill(password);
    await page.getByLabel("New password").fill(newPassword);
    await page.getByLabel("Confirm new password").fill(newPassword);
    await page.getByRole("button", { name: "Continue" }).click();
  }
}

test("Requester dashboard shows metrics and drills down to owned tickets", async ({ page }) => {
  await signIn(page, "anan.srisuk@example.com", "Requester123!", "Lab4RequesterE2e123!");
  await expect(page.getByRole("heading", { name: "Requester Dashboard" })).toBeVisible();
  await expect(page.getByText("Open Tickets")).toBeVisible();
  await page.screenshot({ path: `${screenshotRoot}/requester-dashboard/desktop.png`, fullPage: true });
  await page.getByRole("button", { name: /Open Tickets/ }).click();
  await expect(page.getByRole("heading", { name: "My Tickets" })).toBeVisible();
});

test("Staff dashboard shows operational metrics and drills down to the queue", async ({ page }) => {
  await signIn(page, "it.staff.one@example.com", "ITStaff123!", "Lab4StaffE2e123!");
  await expect(page.getByRole("heading", { name: "Staff Dashboard" })).toBeVisible();
  await expect(page.getByText("Ticket Status Counts")).toBeVisible();
  await page.screenshot({ path: `${screenshotRoot}/staff-dashboard/desktop.png`, fullPage: true });
  await page.getByRole("button", { name: /My Owned Tickets/ }).click();
  await expect(page.getByRole("heading", { name: "My Queue" })).toBeVisible();
});

for (const viewport of [{ name: "desktop", width: 1440, height: 900 }, { name: "tablet", width: 834, height: 1112 }, { name: "mobile", width: 390, height: 844 }]) {
  test(`Lab 4 dashboard has no horizontal overflow at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await signIn(page, "anan.srisuk@example.com", "Requester123!", "Lab4RequesterE2e123!");
    await expect(page.getByRole("heading", { name: "Requester Dashboard" })).toBeVisible();
    await page.screenshot({ path: `${screenshotRoot}/requester-dashboard/${viewport.name}.png`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow, `dashboard must not overflow horizontally at ${viewport.name}`).toBe(false);
  });
}
