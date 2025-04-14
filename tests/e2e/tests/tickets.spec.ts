import { test, expect } from "@playwright/test";

const baseURL = `http://127.0.0.1:3000/?batch=${process.env.BATCHING === "true"}`;
const filtersDisabled = process.env.FILTERS !== "true";
const reasonsDisabled = process.env.REASONS !== "true";

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

test("select another tenant's user switches title and ticket list", async ({
  page,
}) => {
  await page.goto(baseURL);
  await page.getByLabel("User").selectOption("dylan");
  await expect(page).toHaveTitle(/Tickets - hooli/);
  await expect(page.locator("#ticket-list > tbody > tr ")).toHaveCount(4);
});

test.describe("data filtering using filters", () => {
  test.skip(filtersDisabled, "skipping filters test");

  const unassignTicket5 = async ({ page }) => {
    await page.goto(baseURL);
    await page.getByLabel("User").selectOption("alice");
    await page.locator("#ticket-5 select").selectOption("unassigned");
  };

  test.beforeEach(unassignTicket5);
  test.afterEach(unassignTicket5);

  test("ceasar can only see unresolved tickets and those assigned to them", async ({
    page,
  }) => {
    await page.goto(baseURL);
    await page.getByLabel("User").selectOption("ceasar");
    await expect(page.locator("#ticket-list > tbody > tr ")).toHaveCount(5);

    await page.getByLabel("User").selectOption("alice");
    const assign = page.waitForResponse(
      (response) =>
        response.url().endsWith("assign") &&
        response.request().method() === "POST",
    );
    await page.locator("#ticket-5 select").selectOption("Bob");
    await assign;

    await page.getByLabel("User").selectOption("ceasar");
    await expect(page.locator("#ticket-list > tbody > tr ")).toHaveCount(4);
  });
});

test.describe("showing reasons for denials", () => {
  test.skip(reasonsDisabled, "skipping reasons test");

  const unresolveTicket1 = async ({ page }) => {
    await page.goto(baseURL);
    await page.locator("#ticket-5 td:nth-child(1)").click();
    await page.getByLabel("User").selectOption("alice");

    const resolved = await page.locator("#resolved").textContent();
    if (resolved === "yes") {
      await page.getByRole("button", { name: "Resolve" }).click();
    }
  };

  test.beforeEach(unresolveTicket1);
  test.afterEach(unresolveTicket1);

  test("bob gets an error message when trying to resolve the ticket", async ({
    page,
  }) => {
    await page.goto(baseURL);
    await page.locator("#ticket-5 td:nth-child(1)").click();
    await page.getByLabel("User").selectOption("bob");
    const resolveButton = page.getByRole("button", { name: "Resolve" });
    await resolveButton.evaluate((element) =>
      element.removeAttribute("disabled"),
    );

    await resolveButton.click();
    await expect(page.locator(".update-status")).toContainText(
      "resolver role is required to resolve",
    );
  });
});
