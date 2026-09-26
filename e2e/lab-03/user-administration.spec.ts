import { expect, test } from "@playwright/test";

test("Administrator can complete first login and reach User Management", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email address").fill("admin@example.com");
  await page.locator("#login-password").fill("Admin123456!");
  await page.getByRole("button", { name: "Sign In" }).click();
  const changePassword = page.getByRole("heading", { name: "Change Your Password" });
  if (await changePassword.count()) {
    await page.getByLabel("Current (temporary) password").fill("Admin123456!");
    await page.getByLabel("New password").fill("Lab3AdminE2e123!");
    await page.getByLabel("Confirm new password").fill("Lab3AdminE2e123!");
    await page.getByRole("button", { name: "Continue" }).click();
  }
  await expect(page.getByRole("heading", { name: "User Management" })).toBeVisible();
  await expect(page.getByLabel("Search users")).toBeVisible();
  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
});
