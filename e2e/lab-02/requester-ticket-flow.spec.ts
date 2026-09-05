import { expect, test } from "@playwright/test";

test("requester can create, list, and open an owned ticket with an attachment", async ({ page }) => {
  await page.goto("/");

  const requesterSelect = page.getByLabel("Development Requester", { exact: true });
  await expect(requesterSelect).toBeVisible();
  await expect(page.getByRole("button", { name: "My Tickets" })).toBeDisabled();
  await requesterSelect.selectOption({ index: 1 });
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "My Tickets" })).toBeVisible();
  await page.getByRole("button", { name: "Create Ticket" }).click();
  await expect(page.getByRole("heading", { name: "Create Ticket" })).toBeVisible();

  await expect(page.getByLabel("Category *")).toBeVisible();
  await page.getByLabel("Category *").selectOption({ index: 1 });
  await page.getByLabel("Related System *").selectOption({ index: 1 });
  await page.getByLabel("Summary *").fill(`E2E requester flow ${Date.now()}`);
  await page.getByLabel("Requested Priority *").selectOption("MEDIUM");
  await page.getByLabel("Description *").fill("This ticket verifies the Lab 2 requester flow end to end.");
  await page.getByLabel("Attachments").setInputFiles({ name: "e2e-proof.pdf", mimeType: "application/pdf", buffer: Buffer.from("e2e attachment") });
  await page.getByRole("button", { name: "Submit Ticket" }).click();

  const ticketNumber = page.getByText(/Ticket created: TK-\d{4}-\d{6}/);
  await expect(ticketNumber).toBeVisible();
  const number = (await ticketNumber.textContent())?.match(/TK-\d{4}-\d{6}/)?.[0];
  expect(number).toBeTruthy();

  await page.getByRole("button", { name: "My Tickets" }).click();
  await expect(page.getByRole("button", { name: number! })).toBeVisible();
  await page.getByRole("button", { name: number! }).click();
  await expect(page.getByRole("heading", { name: "Ticket Detail" })).toBeVisible();
  await expect(page.getByText(number!)).toBeVisible();
  await expect(page.getByText("e2e-proof.pdf")).toBeVisible();

});
