import { createRequire } from "node:module";

import { expect, test, type Locator, type Page } from "@playwright/test";

const require = createRequire(import.meta.url);

test.use({ viewport: { width: 1440, height: 900 } });

// These tests need the API: `yarn infra:up`, then `yarn api:dev` (port 3000). The dev server of the
// app proxies /api to it.
const TOLERANCE = 2;

const card = (page: Page, name: string) => page.getByRole("article", { name });
const addButton = (page: Page, name: string) =>
  card(page, name).getByRole("button", { name: `Add ${name} to cart` });
const counter = (page: Page, name: string) =>
  card(page, name).getByRole("group", { name: `Quantity of ${name}` });
const increase = (page: Page, name: string) =>
  counter(page, name).getByRole("button", { name: "Increase quantity" });

async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("The element has no box.");
  return box;
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("article")).toHaveCount(14);
});

test("each card has a counter at 1 and a button named for the coffee", async ({ page }) => {
  for (const name of ["Traditional Espresso", "Latte", "Irish"]) {
    await expect(counter(page, name).getByText("1", { exact: true })).toBeVisible();
    await expect(addButton(page, name)).toBeVisible();
  }
  await expect(page.getByRole("button", { name: /^Add .* to cart$/ })).toHaveCount(14);
});

test("adding Latte × 2, Traditional Espresso × 1, then Latte × 1 makes the badge 3 and then 4", async ({
  page,
}) => {
  await expect(page.getByRole("link", { name: "Cart, empty" })).toBeVisible();

  await increase(page, "Latte").click();
  await addButton(page, "Latte").click();
  await addButton(page, "Traditional Espresso").click();

  const cart = page.getByRole("link", { name: "Cart, 3 items" });
  await expect(cart).toBeVisible();
  await expect(cart).toHaveText("3");

  await addButton(page, "Latte").click();

  await expect(page.getByRole("link", { name: "Cart, 4 items" })).toHaveText("4");
});

test("the counter goes back to 1 after adding, and a click on a counter adds nothing", async ({
  page,
}) => {
  await increase(page, "Cuban").click();
  await increase(page, "Cuban").click();
  await expect(counter(page, "Cuban").getByText("3", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cart, empty" })).toBeVisible();

  await addButton(page, "Cuban").click();

  await expect(counter(page, "Cuban").getByText("1", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cart, 3 items" })).toBeVisible();
});

test("the counters of different cards change independently", async ({ page }) => {
  await increase(page, "Arabic").click();

  await expect(counter(page, "Arabic").getByText("2", { exact: true })).toBeVisible();
  await expect(counter(page, "Irish").getByText("1", { exact: true })).toBeVisible();
  await expect(counter(page, "Latte").getByText("1", { exact: true })).toBeVisible();
});

test("the badge keeps its value after a reload", async ({ page }) => {
  await increase(page, "Latte").click();
  await addButton(page, "Latte").click();
  await addButton(page, "Mochaccino").click();
  await expect(page.getByRole("link", { name: "Cart, 3 items" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("article")).toHaveCount(14);

  await expect(page.getByRole("link", { name: "Cart, 3 items" })).toHaveText("3");
});

test("the counter stops at 99, and the cart never holds more than 99 of a coffee", async ({
  page,
}) => {
  const plus = increase(page, "Latte");
  for (let click = 0; click < 98; click += 1) await plus.click();
  await expect(counter(page, "Latte").getByText("99", { exact: true })).toBeVisible();
  // At the limit the button is aria-disabled (it keeps the focus), so it stops there.
  await expect(plus).toHaveAttribute("aria-disabled", "true");

  await addButton(page, "Latte").click();
  await increase(page, "Latte").click();
  await addButton(page, "Latte").click();

  // 99 is the most of one coffee; the badge draws 99+ above that, here the total is exactly 99.
  await expect(page.getByRole("link", { name: "Cart, 99 items" })).toHaveText("99");
});

test("a polite live region announces each addition and nothing opens", async ({ page }) => {
  await increase(page, "Latte").click();

  await addButton(page, "Latte").click();

  await expect(card(page, "Latte").locator("[aria-live=polite]")).toHaveText(
    "Added 2 × Latte to cart",
  );
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
});

test("the buy row has the price at the left, a 72 by 38 counter and a 38 by 38 button", async ({
  page,
}) => {
  const latte = card(page, "Latte");
  const cardBox = await boxOf(latte);
  const price = await boxOf(latte.getByText("9.90", { exact: true }));
  const counterBox = await boxOf(counter(page, "Latte"));
  const buttonBox = await boxOf(addButton(page, "Latte"));

  expect(Math.abs(counterBox.width - 72)).toBeLessThanOrEqual(TOLERANCE);
  expect(Math.abs(counterBox.height - 38)).toBeLessThanOrEqual(TOLERANCE);
  expect(Math.abs(buttonBox.width - 38)).toBeLessThanOrEqual(TOLERANCE);
  expect(Math.abs(buttonBox.height - 38)).toBeLessThanOrEqual(TOLERANCE);
  // Price, then counter, then button, on one line, with the button on the right padding (20 px).
  expect(price.x + price.width).toBeLessThan(counterBox.x);
  expect(counterBox.x + counterBox.width).toBeLessThan(buttonBox.x);
  expect(
    Math.abs(buttonBox.x + buttonBox.width - (cardBox.x + cardBox.width - 20)),
  ).toBeLessThanOrEqual(TOLERANCE);
  expect(Math.abs(buttonBox.x - (counterBox.x + counterBox.width) - 8)).toBeLessThanOrEqual(
    TOLERANCE,
  );
  // The row is centered on one line and the card keeps its size.
  expect(Math.abs(counterBox.y - buttonBox.y)).toBeLessThanOrEqual(TOLERANCE);
  expect(Math.abs(cardBox.width - 256)).toBeLessThanOrEqual(TOLERANCE);
  expect(Math.abs(cardBox.height - 310)).toBeLessThanOrEqual(TOLERANCE);
});

test("the cart button is purple-dark with a white icon and a 6 px radius", async ({ page }) => {
  const style = await addButton(page, "Latte").evaluate((element) => {
    const computed = getComputedStyle(element);
    return { background: computed.backgroundColor, radius: computed.borderTopLeftRadius };
  });

  expect(style).toEqual({ background: "rgb(75, 41, 149)", radius: "6px" });
});

test("a real browser axe scan of the page reports no violation (color contrast is recorded apart)", async ({
  page,
}) => {
  await increase(page, "Latte").click();
  await addButton(page, "Latte").click();
  await page.evaluate(() => document.fonts.ready);
  await page.addScriptTag({ path: require.resolve("axe-core") });

  const result = await page.evaluate(async () => {
    const axe = (
      window as unknown as {
        axe: {
          run: (
            context: Document,
            options: { rules: Record<string, { enabled: boolean }> },
          ) => Promise<{ violations: { id: string; nodes: { html: string }[] }[] }>;
        };
      }
    ).axe;
    // The contrast of the card description and some palette pairs is below AA by the owner's choice
    // (DESIGN_SYSTEM.md), so that one rule is left out here.
    const { violations } = await axe.run(document, {
      rules: { "color-contrast": { enabled: false } },
    });
    return violations.map((violation) => `${violation.id}: ${violation.nodes[0]?.html}`);
  });

  expect(result).toEqual([]);
});
