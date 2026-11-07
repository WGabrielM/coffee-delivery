// Helpers the checkout tests share. This file has no tests, so Playwright does not run it.
import { createRequire } from "node:module";

import { expect, type Locator, type Page } from "@playwright/test";

const require = createRequire(import.meta.url);

export const card = (page: Page, name: string) => page.getByRole("article", { name });
export const addButton = (page: Page, name: string) =>
  card(page, name).getByRole("button", { name: `Add ${name} to cart` });
export const summary = (page: Page) => page.getByRole("region", { name: "Selected coffees" });

export async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("The element has no box.");
  return box;
}

/** The cart of the spec: Latte × 2 and Traditional Espresso × 1, put in through the home page. */
export async function fillTheCart(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("article")).toHaveCount(14);
  await card(page, "Latte").getByRole("button", { name: "Increase quantity" }).click();
  await addButton(page, "Latte").click();
  await addButton(page, "Traditional Espresso").click();
  await expect(page.getByRole("link", { name: "Cart, 3 items" })).toBeVisible();
}

export async function openCheckoutWithTheCart(page: Page) {
  await fillTheCart(page);
  await page.getByRole("link", { name: "Cart, 3 items" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(summary(page).getByRole("list")).toBeVisible();
}

type AxeResult = { violations: { id: string; nodes: { html: string }[] }[] };

/**
 * Runs axe-core in the page and returns one line per violation (`rule: first node`). The color
 * contrast rule is left out: some palette pairs are below AA by the owner's choice (see
 * DESIGN_SYSTEM.md), and the contrast is recorded apart.
 */
export async function axeViolations(page: Page): Promise<string[]> {
  await page.evaluate(() => document.fonts.ready);
  await page.addScriptTag({ path: require.resolve("axe-core") });
  return page.evaluate(async () => {
    const axe = (
      window as unknown as {
        axe: {
          run: (
            context: Document,
            options: { rules: Record<string, { enabled: boolean }> },
          ) => Promise<AxeResult>;
        };
      }
    ).axe;
    const { violations } = await axe.run(document, {
      rules: { "color-contrast": { enabled: false } },
    });
    return violations.map((violation) => `${violation.id}: ${violation.nodes[0]?.html}`);
  });
}
