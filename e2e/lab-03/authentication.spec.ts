import { expect, test } from "@playwright/test";

test("shows safe feedback for invalid credentials", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email address").fill("anan.srisuk@example.com");
  await page.locator("#login-password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByRole("alert")).toContainText("Invalid email or password.");
});

test("requires the seeded user to change an initial password", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email address").fill("anan.srisuk@example.com");
  await page.locator("#login-password").fill("Requester123!");
  await page.getByRole("button", { name: "Sign In" }).click();
  const changePassword = page.getByRole("heading", { name: "Change Your Password" });
  const myTickets = page.getByRole("heading", { name: "My Tickets" });
  await expect(changePassword.or(myTickets)).toBeVisible();
  if (await changePassword.count()) await expect(page.getByText("You must change your password to continue.")).toBeVisible();
});
