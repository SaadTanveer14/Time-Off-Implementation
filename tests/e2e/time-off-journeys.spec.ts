import { expect, test } from "@playwright/test";

test.describe("time off journeys", () => {
  test("employee to manager tab switch works", async ({ page }) => {
    await page.goto("/time-off");
    await expect(page.getByRole("heading", { name: /your time off, at a glance/i })).toBeVisible();

    await page.getByRole("link", { name: /switch to manager/i }).click();
    await expect(page.getByRole("heading", { name: /requests need your call/i })).toBeVisible();

    await page.getByRole("link", { name: /switch to employee/i }).click();
    await expect(page.getByRole("heading", { name: /your time off, at a glance/i })).toBeVisible();
  });

  test("employee can submit a request and see it in history", async ({ page }) => {
    await page.goto("/time-off");
    await expect(page.getByRole("heading", { name: /history/i })).toBeVisible();

    await page.getByRole("button", { name: /submit request/i }).click();
    await expect(page.getByRole("button", { name: /cancel/i }).first()).toBeVisible();
  });
});
