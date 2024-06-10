import { test, expect } from "@playwright/test";

test("has title with tenant and list of tickets", async ({ page }) => {
  await page.goto("http://127.0.0.1:3000/");
  await expect(page).toHaveTitle(/Tickets - acmecorp/);

  await expect(page.locator("#ticket-list > tbody > tr ")).toHaveCount(6);
});

test("alice (default user) can create new tickets", async ({ page }) => {
  await page.goto("http://127.0.0.1:3000/");
  await expect(
    page.getByRole("button", { name: "+ New Ticket" }),
  ).toBeEnabled();
});

test("bob can not create new tickets", async ({ page }) => {
  await page.goto("http://127.0.0.1:3000/");
  await page.getByLabel("User").selectOption("bob");
  await expect(
    page.getByRole("button", { name: "+ New Ticket" }),
  ).toBeDisabled();
});

test("select another tenant's user switches title and ticket list", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:3000/");
  await page.getByLabel("User").selectOption("dylan");
  await expect(page).toHaveTitle(/Tickets - hooli/);
  await expect(page.locator("#ticket-list > tbody > tr ")).toHaveCount(4);
});
