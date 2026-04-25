import { expect, test } from "@playwright/test";

test.describe("time off journeys", () => {
  test("employee to manager tab switch works", async ({ page }) => {
    await page.goto("/time-off");
    await expect(page.getByRole("heading", { name: /your time off, at a glance/i })).toBeVisible();

    await page.getByRole("link", { name: /switch to manager/i }).click();
    await expect(
      page.getByRole("heading", { name: /requests need your call|all caught up/i }),
    ).toBeVisible();

    await page.getByRole("link", { name: /switch to employee/i }).click();
    await expect(page.getByRole("heading", { name: /your time off, at a glance/i })).toBeVisible();
  });

  test("employee request composer behaves correctly", async ({ page }) => {
    await page.goto("/time-off");
    await expect(page.getByRole("heading", { name: /history/i })).toBeVisible();

    // Pick a non-overlapping date/location combo so submit stays enabled.
    await page.getByRole("button", { name: /^remote\s+\d+\s+avail\.$/i }).click();
    await page.getByLabel(/from/i).fill("2026-05-12");
    await page.getByLabel(/to/i).fill("2026-05-12");
    const submit = page.getByRole("button", { name: /submit request/i });
    if (await submit.isEnabled()) {
      await submit.click();
      await expect(page.getByRole("button", { name: /cancel/i }).first()).toBeVisible();
    } else {
      await expect(submit).toBeDisabled();
      await expect(page.getByText(/short by|already have a request/i)).toBeVisible();
    }
  });
});
