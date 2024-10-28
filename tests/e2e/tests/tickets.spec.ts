import { test, expect } from "@playwright/test";

const baseURL = `http://127.0.0.1:3000/?batch=${process.env.BATCHING == "true"}`;

test("has title with tenant and list of tickets", async ({ page }) => {
  await page.goto(baseURL);
  await expect(page).toHaveTitle(/Tickets - acmecorp/);

  await expect(page.locator("#ticket-list > tbody > tr ")).toHaveCount(6);
});

test("alice (default user) can create new tickets", async ({ page }) => {
  await page.goto(baseURL);
  await expect(
    page.getByRole("button", { name: "+ New Ticket" }),
  ).toBeEnabled();
});

test("bob can not create new tickets", async ({ page }) => {
  await page.goto(baseURL);
  await page.getByLabel("User").selectOption("bob");
  await expect(
    page.getByRole("button", { name: "+ New Ticket" }),
  ).toBeDisabled();
});

test("ceasar can only see unresolved tickets", async ({ page }) => {
  test.skip(process.env.CONDITIONS != "true", "skipping conditions test");
  await page.goto(baseURL);
  await page.getByLabel("User").selectOption("ceasar");
  await expect(page.locator("#ticket-list > tbody > tr ")).toHaveCount(4);
});

test("select another tenant's user switches title and ticket list", async ({
  page,
}) => {
  await page.goto(baseURL);
  await page.getByLabel("User").selectOption("dylan");
  await expect(page).toHaveTitle(/Tickets - hooli/);
  await expect(page.locator("#ticket-list > tbody > tr ")).toHaveCount(4);
});
