import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page) {
  await page.goto("/");
  await page.getByLabel("Email address").fill("it.staff.one@example.com");
  await page.locator("#login-password").fill("ITStaff123!");
  await page.getByRole("button", { name: "Sign In" }).click();
  const changePassword = page.getByRole("heading", { name: "Change Your Password" });
  if (await changePassword.count()) {
    await page.getByLabel("Current (temporary) password").fill("ITStaff123!");
    await page.getByLabel("New password").fill("Lab4WorkflowE2e123!");
    await page.getByLabel("Confirm new password").fill("Lab4WorkflowE2e123!");
    await page.getByRole("button", { name: "Continue" }).click();
  }
}

test("IT Staff can use the Ticket status workflow control", async ({ page }) => {
  await signIn(page);
  await page.getByRole("button", { name: "My Queue" }).click();
  await page.getByLabel("Search tickets").fill("Printer driver installation request");
  await page.keyboard.press("Enter");
  const ticketButton = page.getByRole("button", { name: /TK-2026-000027/ });
  await expect(ticketButton).toBeVisible();
  await ticketButton.click();
  await expect(page.getByRole("heading", { name: "TK-2026-000027" })).toBeVisible();
  const status = page.getByLabel("Status");
  await expect(status).toHaveValue("New");
  await status.selectOption("Open");
  await expect(status).toHaveValue("Open");
  await expect(page.getByRole("heading", { name: "TK-2026-000027" })).toBeVisible();
});
