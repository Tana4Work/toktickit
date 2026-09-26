import { expect, test } from "@playwright/test";

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 834, height: 1112 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`login remains usable at ${viewport.name} size`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Sign in to your account" })).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.locator("#login-password")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow, "the login screen must not overflow horizontally").toBe(false);
  });
}
