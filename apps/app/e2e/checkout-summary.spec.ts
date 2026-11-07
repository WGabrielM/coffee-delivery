import { expect, test, type Page } from "@playwright/test";

import {
  axeViolations,
  boxOf,
  fillTheCart,
  openCheckoutWithTheCart,
  summary,
} from "./checkout-helpers";

test.use({ viewport: { width: 1440, height: 900 } });

// These tests need the API: `yarn infra:up`, then `yarn api:dev` (port 3000). The dev server of the
// app proxies /api to it.
const TOLERANCE = 2;

const CART_KEY = "coffee-delivery:cart:v1";

const row = (page: Page, name: string) => page.getByRole("listitem", { name });
const valueOf = (page: Page, label: string) =>
  summary(page).getByText(label, { exact: true }).locator("xpath=following-sibling::dd");

test("a cart of Latte × 2 and Traditional Espresso × 1 shows $19.80, $9.90, items $29.70, delivery $3.50, total $33.20", async ({
  page,
}) => {
  await openCheckoutWithTheCart(page);

  await expect(row(page, "Latte").getByText("$19.80")).toBeVisible();
  await expect(row(page, "Traditional Espresso").getByText("$9.90")).toBeVisible();
  await expect(valueOf(page, "Items total")).toHaveText("$29.70");
  await expect(valueOf(page, "Delivery")).toHaveText("$3.50");
  await expect(valueOf(page, "Total")).toHaveText("$33.20");
  await expect(page.getByRole("heading", { level: 2, name: "Complete your order" })).toBeVisible();
});

test("a counter changes the line, the totals, and the badge; Remove deletes the row", async ({
  page,
}) => {
  await openCheckoutWithTheCart(page);

  await row(page, "Traditional Espresso")
    .getByRole("button", { name: "Increase quantity" })
    .click();

  await expect(row(page, "Traditional Espresso").getByText("$19.80")).toBeVisible();
  await expect(valueOf(page, "Items total")).toHaveText("$39.60");
  await expect(valueOf(page, "Total")).toHaveText("$43.10");
  await expect(page.getByRole("link", { name: "Cart, 4 items" })).toHaveText("4");

  await page.getByRole("button", { name: "Remove Latte" }).click();

  await expect(row(page, "Latte")).toHaveCount(0);
  await expect(valueOf(page, "Items total")).toHaveText("$19.80");
  await expect(valueOf(page, "Total")).toHaveText("$23.30");
  await expect(page.getByRole("link", { name: "Cart, 2 items" })).toHaveText("2");
  await expect(summary(page).getByRole("heading", { level: 2 })).toBeFocused();
});

test("the changes stay after a reload", async ({ page }) => {
  await openCheckoutWithTheCart(page);
  await page.getByRole("button", { name: "Remove Latte" }).click();
  await expect(valueOf(page, "Total")).toHaveText("$13.40");

  await page.reload();

  await expect(row(page, "Traditional Espresso")).toBeVisible();
  await expect(row(page, "Latte")).toHaveCount(0);
  await expect(valueOf(page, "Total")).toHaveText("$13.40");
});

test("removing the last coffee shows the empty cart, and Browse coffees goes to the home page", async ({
  page,
}) => {
  await openCheckoutWithTheCart(page);
  await page.getByRole("button", { name: "Remove Latte" }).click();
  await page.getByRole("button", { name: "Remove Traditional Espresso" }).click();

  const message = page.getByRole("heading", { level: 2, name: "Your cart is empty" });
  await expect(message).toBeFocused();
  await expect(page.getByRole("link", { name: "Cart, empty" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Selected coffees" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Complete your order" })).toHaveCount(0);

  await page.getByRole("link", { name: "Browse coffees" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 2, name: "Our coffees" })).toBeVisible();
});

test("an empty cart shows only the message and the link", async ({ page }) => {
  await page.goto("/checkout");

  await expect(page.getByRole("heading", { level: 2, name: "Your cart is empty" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse coffees" })).toHaveAttribute("href", "/");
  await expect(page.getByRole("button", { name: "Confirm order" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Selected coffees" })).toHaveCount(0);
});

test("a coffee that is not in the catalog is removed from the cart when the catalog loads", async ({
  page,
}) => {
  await fillTheCart(page);
  await page.evaluate((key) => {
    const lines = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown[];
    lines.unshift({ coffeeId: "00000000-0000-4000-8000-000000000000", quantity: 5 });
    localStorage.setItem(key, JSON.stringify(lines));
  }, CART_KEY);

  await page.goto("/checkout");

  await expect(summary(page).getByRole("list")).toBeVisible();
  await expect(page.getByRole("listitem")).toHaveCount(2);
  await expect(valueOf(page, "Total")).toHaveText("$33.20");
  await expect(page.getByRole("link", { name: "Cart, 3 items" })).toBeVisible();
  const stored = await page.evaluate((key) => localStorage.getItem(key), CART_KEY);
  expect(stored).not.toContain("00000000-0000-4000-8000-000000000000");
});

test("the columns are 640 and 448 px wide at x=160 and x=832, and Confirm order is 368 by 46", async ({
  page,
}) => {
  await openCheckoutWithTheCart(page);

  const left = await boxOf(page.getByRole("region", { name: "Complete your order" }));
  const right = await boxOf(summary(page));
  const confirm = await boxOf(page.getByRole("button", { name: "Confirm order" }));

  expect(Math.abs(left.x - 160)).toBeLessThanOrEqual(TOLERANCE);
  expect(Math.abs(left.width - 640)).toBeLessThanOrEqual(TOLERANCE);
  expect(Math.abs(right.x - 832)).toBeLessThanOrEqual(TOLERANCE);
  expect(Math.abs(right.width - 448)).toBeLessThanOrEqual(TOLERANCE);
  expect(Math.abs(confirm.width - 368)).toBeLessThanOrEqual(TOLERANCE);
  expect(Math.abs(confirm.height - 46)).toBeLessThanOrEqual(TOLERANCE);
  // The button sits inside the 40 px padding of the card (832 + 40).
  expect(Math.abs(confirm.x - 872)).toBeLessThanOrEqual(TOLERANCE);
});

test("each row has a 64 px photo, a 72 by 32 counter, a 32 px high Remove button, and a price at the right", async ({
  page,
}) => {
  await openCheckoutWithTheCart(page);
  // The width of the text depends on the font, so wait for it.
  await page.evaluate(() => document.fonts.ready);
  const latte = row(page, "Latte");

  const rowBox = await boxOf(latte);
  const photo = await boxOf(latte.getByRole("img", { name: "Latte" }));
  const counter = await boxOf(latte.getByRole("group", { name: "Quantity of Latte" }));
  const remove = await boxOf(latte.getByRole("button", { name: "Remove Latte" }));
  const price = await boxOf(latte.getByText("$19.80"));

  expect(Math.abs(rowBox.width - 368)).toBeLessThanOrEqual(TOLERANCE);
  expect(Math.abs(rowBox.height - 80)).toBeLessThanOrEqual(TOLERANCE);
  expect(Math.abs(photo.width - 64)).toBeLessThanOrEqual(TOLERANCE);
  expect(Math.abs(photo.height - 64)).toBeLessThanOrEqual(TOLERANCE);
  expect(Math.abs(counter.width - 72)).toBeLessThanOrEqual(TOLERANCE);
  expect(Math.abs(counter.height - 32)).toBeLessThanOrEqual(TOLERANCE);
  // The design is 91 wide with the label REMOVER; the English label Remove is a little shorter
  // (8 px padding, a 16 px icon, a 4 px gap, and the text), so the width is a range.
  expect(remove.width).toBeGreaterThan(78);
  expect(remove.width).toBeLessThanOrEqual(91 + TOLERANCE);
  expect(Math.abs(remove.height - 32)).toBeLessThanOrEqual(TOLERANCE);
  // Photo, then the counter and Remove on one line, then the price at the right edge of the row.
  expect(photo.x + photo.width).toBeLessThan(counter.x);
  expect(counter.x + counter.width).toBeLessThan(remove.x);
  expect(Math.abs(counter.y - remove.y)).toBeLessThanOrEqual(TOLERANCE);
  expect(remove.x + remove.width).toBeLessThan(price.x);
  expect(Math.abs(price.x + price.width - (rowBox.x + rowBox.width - 4))).toBeLessThanOrEqual(
    TOLERANCE,
  );
});

test("the card and the button follow the design: radius 6/44/6/44 and a #DBAC2C Confirm order", async ({
  page,
}) => {
  await openCheckoutWithTheCart(page);

  const cardStyle = await summary(page)
    .locator("xpath=./div")
    .evaluate((element) => {
      const computed = getComputedStyle(element);
      return {
        background: computed.backgroundColor,
        padding: computed.padding,
        radii: [
          computed.borderTopLeftRadius,
          computed.borderTopRightRadius,
          computed.borderBottomRightRadius,
          computed.borderBottomLeftRadius,
        ],
      };
    });
  const confirmStyle = await page
    .getByRole("button", { name: "Confirm order" })
    .evaluate((element) => {
      const computed = getComputedStyle(element);
      return { background: computed.backgroundColor, color: computed.color };
    });
  const totalStyle = await valueOf(page, "Total").evaluate((element) => {
    const computed = getComputedStyle(element.querySelector("output") ?? element);
    return { size: computed.fontSize, weight: computed.fontWeight, family: computed.fontFamily };
  });

  expect(cardStyle).toEqual({
    background: "rgb(243, 242, 242)",
    padding: "40px",
    radii: ["6px", "44px", "6px", "44px"],
  });
  expect(confirmStyle).toEqual({
    background: "rgb(219, 172, 44)",
    color: "rgb(255, 255, 255)",
  });
  expect(totalStyle.size).toBe("20px");
  expect(totalStyle.weight).toBe("700");
  expect(totalStyle.family).toContain("Roboto");
});

test("a real browser axe scan of the page reports no violation (color contrast is recorded apart)", async ({
  page,
}) => {
  await openCheckoutWithTheCart(page);

  expect(await axeViolations(page)).toEqual([]);
});

test("an empty cart page has no axe violation either", async ({ page }) => {
  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Your cart is empty" })).toBeVisible();

  expect(await axeViolations(page)).toEqual([]);
});
