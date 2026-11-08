import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { openCheckoutWithTheCart } from "./checkout-helpers";

// An axe scan of every screen on the real app and API. A violation of impact critical or serious
// fails the test; the lesser ones (moderate, minor) are not part of this check.
test.use({ viewport: { width: 1440, height: 900 } });

/**
 * The text colors of the design that are below 4.5:1 (foreground on background), by the owner's
 * choice: they are listed with their ratios in DESIGN_SYSTEM.md ("Contrast"). A contrast failure
 * with any other pair is a new problem and fails the scan.
 */
const KNOWN_LOW_CONTRAST_PAIRS = new Set([
  "#ffffff on #dbac2c", // white on yellow: primary button, selected chip (2.11)
  "#ffffff on #c47f17", // white on yellow-dark: primary hover, cart badge (3.28)
  "#c47f17 on #f1e9c9", // yellow-dark on yellow-light: tag (2.70)
  "#c47f17 on #fafafa", // yellow-dark on background: unselected chip (3.15)
  "#8d8686 on #ededed", // label on input: placeholder, "Optional" hint (3.05)
  "#8d8686 on #f3f2f2", // label on card: coffee description (3.19)
]);

type ContrastData = { fgColor?: string; bgColor?: string };

/** The lines of the violations that are critical or serious: `rule (impact): node`. */
async function seriousViolations(page: Page): Promise<string[]> {
  await page.evaluate(() => document.fonts.ready);
  const { violations } = await new AxeBuilder({ page }).analyze();
  const lines: string[] = [];
  for (const violation of violations) {
    if (violation.impact !== "critical" && violation.impact !== "serious") continue;
    for (const node of violation.nodes) {
      if (violation.id === "color-contrast") {
        const data = (node.any[0]?.data ?? {}) as ContrastData;
        const pair = `${data.fgColor} on ${data.bgColor}`;
        if (KNOWN_LOW_CONTRAST_PAIRS.has(pair)) continue;
        lines.push(`color-contrast (${violation.impact}): ${pair} at ${node.target.join(" ")}`);
        continue;
      }
      lines.push(`${violation.id} (${violation.impact}): ${node.target.join(" ")}`);
    }
  }
  return lines;
}

test("Home has no critical or serious violation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("article")).toHaveCount(14);

  expect(await seriousViolations(page)).toEqual([]);
});

test("Home with a filter has no critical or serious violation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("article")).toHaveCount(14);
  await page
    .getByRole("group", { name: "Filter by tag" })
    .getByRole("button", { name: "Special" })
    .click();
  await expect(page.getByRole("article")).toHaveCount(5);

  expect(await seriousViolations(page)).toEqual([]);
});

test("Checkout with an empty cart has no critical or serious violation", async ({ page }) => {
  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Your cart is empty" })).toBeVisible();

  expect(await seriousViolations(page)).toEqual([]);
});

test("Checkout with items has no critical or serious violation", async ({ page }) => {
  await openCheckoutWithTheCart(page);
  await expect(page.getByRole("radiogroup", { name: "Payment method" })).toBeVisible();

  expect(await seriousViolations(page)).toEqual([]);
});

test("Checkout with every error shown has no critical or serious violation", async ({ page }) => {
  await openCheckoutWithTheCart(page);
  await page.getByRole("button", { name: "Confirm order" }).click();
  await expect(page.getByText("Choose a payment method")).toBeVisible();

  expect(await seriousViolations(page)).toEqual([]);
});

test("Confirmation has no critical or serious violation", async ({ page, request }) => {
  const catalog = await request.get("/api/v1/coffees");
  const { coffees } = (await catalog.json()) as { coffees: { id: string }[] };
  const created = await request.post("/api/v1/orders", {
    data: {
      items: [{ coffeeId: coffees[0]!.id, quantity: 1 }],
      address: {
        zipCode: "90250-440",
        street: "Rua João Daniel Martinelli",
        number: "102",
        complement: "",
        neighborhood: "Farrapos",
        city: "Porto Alegre",
        state: "RS",
      },
      paymentMethod: "credit_card",
    },
  });
  const { id } = (await created.json()) as { id: string };

  await page.goto(`/orders/${id}`);
  await expect(page.getByRole("heading", { level: 1, name: "Uhu! Order confirmed" })).toBeVisible();

  expect(await seriousViolations(page)).toEqual([]);
});
