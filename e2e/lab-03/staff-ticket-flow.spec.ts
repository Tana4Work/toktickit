import { expect, test } from "@playwright/test";

test("IT Staff can complete first login and reach the ticket queue", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email address").fill("it.staff.one@example.com");
  await page.locator("#login-password").fill("ITStaff123!");
  await page.getByRole("button", { name: "Sign In" }).click();
  const changePassword = page.getByRole("heading", { name: "Change Your Password" });
  if (await changePassword.count()) {
    await page.getByLabel("Current (temporary) password").fill("ITStaff123!");
    await page.getByLabel("New password").fill("Lab3StaffE2e123!");
    await page.getByLabel("Confirm new password").fill("Lab3StaffE2e123!");
    await page.getByRole("button", { name: "Continue" }).click();
  }
  await expect(page.getByRole("heading", { name: "My Queue" })).toBeVisible();
  await expect(page.getByLabel("Search tickets")).toBeVisible();
});
