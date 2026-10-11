import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page) {
  await page.goto("/");
  await page.getByLabel("Email address").fill("it.staff.one@example.com");
  await page.locator("#login-password").fill("ITStaff123!");
  await page.getByRole("button", { name: "Sign In" }).click();
  const changePassword = page.getByRole("heading", { name: "Change Your Password" });
  if (await changePassword.count()) {
    await page.getByLabel("Current (temporary) password").fill("ITStaff123!");
    await page.getByLabel("New password").fill("Lab4ActionsE2e123!");
    await page.getByLabel("Confirm new password").fill("Lab4ActionsE2e123!");
    await page.getByRole("button", { name: "Continue" }).click();
  }
}

test("IT Staff can view and record an Action Taken", async ({ page }) => {
  await signIn(page);
  await page.getByRole("button", { name: "My Queue" }).click();
  await expect(page.getByRole("heading", { name: "My Queue" })).toBeVisible();
  await page.getByLabel("Search tickets").fill("Campus Wi-Fi disconnects repeatedly");
  await page.keyboard.press("Enter");
  const ticketButton = page.getByRole("button", { name: /TK-2026-000021/ });
  await expect(ticketButton).toBeVisible();
  await ticketButton.click();
  await expect(page.getByRole("heading", { name: "TK-2026-000021" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Actions Taken" })).toBeVisible();
  await page.getByRole("button", { name: "Add Action Taken" }).click();
  await page.getByLabel("Description *").fill(`E2E action ${Date.now()}`);
  await page.getByLabel("Result *").fill("The service was checked successfully.");
  await page.getByRole("button", { name: "Save Action Taken" }).click();
  await expect(page.getByText("Action Taken created successfully.", { exact: true })).toBeVisible();
});
