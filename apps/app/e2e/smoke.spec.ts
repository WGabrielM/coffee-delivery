import { expect, test } from "@playwright/test";

// These tests run without the API: the shell must open on its own.
test("the home page opens with the app title and heading", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Coffee Delivery");
  await expect(page.getByRole("heading", { level: 1, name: "Coffee Delivery" })).toBeVisible();
});

test("an unknown path shows the not-found page with a link home", async ({ page }) => {
  await page.goto("/does-not-exist");

  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  await page.getByRole("link", { name: "Back to the home page" }).click();
  await expect(page).toHaveURL("/");
});
