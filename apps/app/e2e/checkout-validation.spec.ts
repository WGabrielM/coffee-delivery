import { expect, test, type Page } from "@playwright/test";

import { openCheckoutWithTheCart } from "./checkout-helpers";

// Blocked and changed checkouts on the real app and API: no request is mocked.
test.use({ viewport: { width: 1440, height: 900 } });

const CART_KEY = "coffee-delivery:cart:v1";

const summary = (page: Page) => page.getByRole("region", { name: "Selected coffees" });
const totalOf = (page: Page, label: string) =>
  summary(page).getByText(label, { exact: true }).locator("xpath=following-sibling::dd");

test("confirming an empty form shows the field errors and sends no order", async ({ page }) => {
  const orders: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && new URL(request.url()).pathname === "/api/v1/orders") {
      orders.push(request.url());
    }
  });
  await openCheckoutWithTheCart(page);

  await page.getByRole("button", { name: "Confirm order" }).click();

  await expect(page.getByText("Enter a ZIP code like 12345-678")).toBeVisible();
  await expect(page.getByText("Street is required")).toBeVisible();
  await expect(page.getByText("Number is required")).toBeVisible();
  await expect(page.getByText("Neighborhood is required")).toBeVisible();
  await expect(page.getByText("City is required")).toBeVisible();
  await expect(page.getByText("Enter the 2-letter state, like RS")).toBeVisible();
  await expect(page.getByText("Choose a payment method")).toBeVisible();
  await expect(page).toHaveURL(/\/checkout$/);
  expect(orders).toEqual([]);
});

test("removing a coffee on the checkout page updates the totals", async ({ page }) => {
  await openCheckoutWithTheCart(page);
  await expect(totalOf(page, "Total")).toHaveText("$33.20");

  await page.getByRole("button", { name: "Remove Latte" }).click();

  await expect(page.getByRole("listitem", { name: "Latte" })).toHaveCount(0);
  await expect(totalOf(page, "Items total")).toHaveText("$9.90");
  await expect(totalOf(page, "Delivery")).toHaveText("$3.50");
  await expect(totalOf(page, "Total")).toHaveText("$13.40");
  await expect(page.getByRole("link", { name: "Cart, 1 item" })).toBeVisible();
});

test("a cart with a coffee that does not exist is cleaned and shows the empty state", async ({
  page,
}) => {
  const unknown = crypto.randomUUID();
  await page.addInitScript(
    ({ key, id }) => {
      localStorage.setItem(key, JSON.stringify([{ coffeeId: id, quantity: 3 }]));
    },
    { key: CART_KEY, id: unknown },
  );

  await page.goto("/checkout");

  await expect(page.getByRole("heading", { level: 2, name: "Your cart is empty" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse coffees" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cart, empty" })).toBeVisible();
  const stored = await page.evaluate((key) => localStorage.getItem(key), CART_KEY);
  expect(stored).toBe("[]");
});
