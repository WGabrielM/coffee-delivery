import { expect, test, type Page } from "@playwright/test";

import { axeViolations, boxOf, createOrder } from "./checkout-helpers";

test.use({ viewport: { width: 1440, height: 900 } });

// These tests need the API: `yarn infra:up`, then `yarn api:dev` (port 3000). Each test that needs
// an order creates one through the API first, so the page is checked against a real order.
const TOLERANCE = 2;
const close = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(TOLERANCE);

const details = (page: Page) => page.getByRole("list", { name: "Order details" });

test("an existing order shows the title, the subtitle, and the three rows", async ({
  page,
  request,
}) => {
  const id = await createOrder(request, { complement: "Apt 12" });

  await page.goto(`/orders/${id}`);

  await expect(page.getByRole("heading", { level: 1, name: "Uhu! Order confirmed" })).toBeVisible();
  await expect(page.getByText("Now just wait and your coffee will soon be with you")).toBeVisible();
  const rows = details(page).getByRole("listitem");
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toHaveText(
    "Delivery to Rua João Daniel Martinelli, 102Farrapos - Porto Alegre, RS",
  );
  await expect(rows.nth(1)).toHaveText("Estimated delivery20 min - 30 min");
  await expect(rows.nth(2)).toHaveText("Payment on deliveryCredit card");
  // The complement, the prices, and the items are not on this page.
  await expect(page.getByText("Apt 12")).toHaveCount(0);
  await expect(page.getByText("$")).toHaveCount(0);
});

test("an order whose address was removed says so in place of the address", async ({
  page,
  request,
}) => {
  const id = await createOrder(request);
  // The API of this machine may not have cleared an old order, so the cleared answer is the one of
  // the spec: the same order with `address: null`.
  await page.route(`**/api/v1/orders/${id}`, async (route) => {
    const response = await route.fetch();
    const order = (await response.json()) as Record<string, unknown>;
    await route.fulfill({
      response,
      json: { ...order, address: null, addressRetentionDays: 90 },
    });
  });

  await page.goto(`/orders/${id}`);

  await expect(page.getByRole("heading", { level: 1, name: "Uhu! Order confirmed" })).toBeVisible();
  const rows = details(page).getByRole("listitem");
  await expect(rows.nth(0)).toHaveText("The address was removed after 90 days.");
  await expect(rows.nth(1)).toHaveText("Estimated delivery20 min - 30 min");
  await expect(rows.nth(2)).toHaveText("Payment on deliveryCredit card");
  await expect(page.getByText(/Delivery to/)).toHaveCount(0);
});

test("the title and the subtitle have the fonts, sizes, and colors of the design", async ({
  page,
  request,
}) => {
  await page.goto(`/orders/${await createOrder(request)}`);
  await page.evaluate(() => document.fonts.ready);
  const style = (name: string, tag: "h1" | "p") =>
    page
      .locator(tag, { hasText: name })
      .first()
      .evaluate((element) => {
        const computed = getComputedStyle(element);
        return {
          family: computed.fontFamily,
          size: computed.fontSize,
          weight: computed.fontWeight,
          color: computed.color,
        };
      });

  const title = await style("Uhu! Order confirmed", "h1");
  const subtitle = await style("Now just wait", "p");

  expect(title.family).toContain("Baloo 2");
  expect(title).toMatchObject({ size: "32px", weight: "800", color: "rgb(196, 127, 23)" });
  expect(subtitle.family).toContain("Roboto");
  expect(subtitle).toMatchObject({ size: "20px", weight: "400", color: "rgb(64, 57, 55)" });
});

test("the content starts at the 160 px margin, the card is 526 by 270, and the illustration 492 by 293 at its right", async ({
  page,
  request,
}) => {
  await page.goto(`/orders/${await createOrder(request)}`);
  await expect(details(page)).toBeVisible();
  await page.waitForFunction(() => [...document.images].every((image) => image.complete));

  const title = await boxOf(page.getByRole("heading", { level: 1 }));
  const card = await boxOf(details(page).locator("xpath=.."));
  const illustration = await boxOf(page.locator("main img"));

  close(title.x, 160);
  close(card.x, 160);
  close(card.width, 526);
  close(card.height, 270);
  close(illustration.width, 492);
  close(illustration.height, 293);
  close(illustration.x + illustration.width, 1280);
  expect(card.x + card.width).toBeLessThan(illustration.x);
  // The card sits under the title. The drawing starts at the top edge of the card, and the picture
  // has 12 px of empty space above the drawing, so the picture starts 12 px above the card.
  expect(card.y).toBeGreaterThan(title.y + title.height);
  close(illustration.y, card.y - 12);
});

test("the card has a 1 px gradient border from yellow to purple with the corners 6/36/6/36", async ({
  page,
  request,
}) => {
  await page.goto(`/orders/${await createOrder(request)}`);

  const border = await details(page)
    .locator("xpath=..")
    .evaluate((element) => {
      const computed = getComputedStyle(element);
      return {
        image: computed.backgroundImage,
        padding: computed.paddingTop,
        radii: [
          computed.borderTopLeftRadius,
          computed.borderTopRightRadius,
          computed.borderBottomRightRadius,
          computed.borderBottomLeftRadius,
        ],
      };
    });

  expect(border.image).toContain("linear-gradient");
  expect(border.image).toContain("219, 172, 44");
  expect(border.image).toContain("128, 71, 248");
  expect(border.padding).toBe("1px");
  expect(border.radii).toEqual(["6px", "36px", "6px", "36px"]);
});

test("the icons are 32 px circles: purple, yellow, and yellow-dark, with the illustration's alt empty", async ({
  page,
  request,
}) => {
  await page.goto(`/orders/${await createOrder(request)}`);
  await expect(details(page)).toBeVisible();

  const circles = await page.locator("[data-icon-circle]").evaluateAll((elements) =>
    elements.map((element) => {
      const box = element.getBoundingClientRect();
      return {
        width: Math.round(box.width),
        height: Math.round(box.height),
        background: getComputedStyle(element).backgroundColor,
      };
    }),
  );

  expect(circles).toEqual([
    { width: 32, height: 32, background: "rgb(128, 71, 248)" },
    { width: 32, height: 32, background: "rgb(219, 172, 44)" },
    { width: 32, height: 32, background: "rgb(196, 127, 23)" },
  ]);
  await expect(page.locator("main img")).toHaveAttribute("alt", "");
});

test.describe("the payment label", () => {
  for (const [code, label] of [
    ["credit_card", "Credit card"],
    ["debit_card", "Debit card"],
    ["cash", "Cash"],
  ] as const) {
    test(`${code} is shown as ${label}`, async ({ page, request }) => {
      await page.goto(`/orders/${await createOrder(request, { paymentMethod: code })}`);

      await expect(details(page).getByRole("listitem").nth(2)).toHaveText(
        `Payment on delivery${label}`,
      );
    });
  }
});

test("a reload shows the same page, and the cart badge is empty", async ({ page, request }) => {
  const id = await createOrder(request);
  await page.goto(`/orders/${id}`);
  await expect(page.getByRole("heading", { level: 1, name: "Uhu! Order confirmed" })).toBeVisible();

  await page.reload();

  await expect(page.getByRole("heading", { level: 1, name: "Uhu! Order confirmed" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cart, empty" })).toBeVisible();
});

test("an unknown order id shows Order not found and a link back to the coffees", async ({
  page,
}) => {
  await page.goto("/orders/00000000-0000-4000-8000-000000000000");

  await expect(page.getByRole("heading", { level: 1, name: "Order not found" })).toBeVisible();
  await page.getByRole("link", { name: "Back to coffees" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 2, name: "Our coffees" })).toBeVisible();
});

test("a malformed order id shows Order not found too", async ({ page }) => {
  await page.goto("/orders/not-an-order");

  await expect(page.getByRole("heading", { level: 1, name: "Order not found" })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("a failed request shows We couldn't load your order, and Try again loads it", async ({
  page,
  request,
}) => {
  const id = await createOrder(request);
  await page.route(`**/api/v1/orders/${id}`, (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: "unexpected_error", message: "Something went wrong." },
      }),
    }),
  );

  await page.goto(`/orders/${id}`);
  await expect(page.getByRole("alert")).toHaveText(/We couldn't load your order\./);

  await page.unroute(`**/api/v1/orders/${id}`);
  await page.getByRole("button", { name: "Try again" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Uhu! Order confirmed" })).toBeVisible();
});

test("a real browser axe scan reports no violation on the order and on the not-found page", async ({
  page,
  request,
}) => {
  await page.goto(`/orders/${await createOrder(request)}`);
  await expect(details(page)).toBeVisible();
  expect(await axeViolations(page)).toEqual([]);

  await page.goto("/orders/00000000-0000-4000-8000-000000000000");
  await expect(page.getByRole("heading", { level: 1, name: "Order not found" })).toBeVisible();
  expect(await axeViolations(page)).toEqual([]);
});
