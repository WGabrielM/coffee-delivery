// Helpers the checkout tests share. This file has no tests, so Playwright does not run it.
import { createRequire } from "node:module";

import { expect, type APIRequestContext, type Locator, type Page } from "@playwright/test";

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

/** The address of the design, as the API takes it. */
export const sampleAddress = {
  zipCode: "90250-440",
  street: "Rua João Daniel Martinelli",
  number: "102",
  complement: "",
  neighborhood: "Farrapos",
  city: "Porto Alegre",
  state: "RS",
};

export const field = (page: Page, name: string) => page.getByRole("textbox", { name, exact: true });
// The radio is visually hidden; the label around it is the option that is drawn and clicked.
export const drawn = (page: Page, label: string) =>
  page.locator("label", { has: page.getByRole("radio", { name: label }) });

/** Types the sample address into the form, the way a person does (the masks add the hyphen). */
export async function fillTheAddress(page: Page) {
  await field(page, "ZIP code").fill("90250440");
  await field(page, "Street").fill("Rua João Daniel Martinelli");
  await field(page, "Number").fill("102");
  await field(page, "Neighborhood").fill("Farrapos");
  await field(page, "City").fill("Porto Alegre");
  await field(page, "State").fill("rs");
}

/** The sample address and the credit card: everything the form needs for a valid submit. */
export async function fillTheSample(page: Page) {
  await fillTheAddress(page);
  await drawn(page, "Credit card").click();
}

/** The coffees of the catalog, as the API lists them. */
export async function listCoffees(request: APIRequestContext) {
  const response = await request.get("/api/v1/coffees");
  const { coffees } = (await response.json()) as { coffees: { id: string; name: string }[] };
  return coffees;
}

export async function coffeeId(request: APIRequestContext, name: string): Promise<string> {
  const coffee = (await listCoffees(request)).find((candidate) => candidate.name === name);
  if (!coffee) throw new Error(`The catalog has no ${name}.`);
  return coffee.id;
}

type OrderOptions = {
  paymentMethod?: string;
  complement?: string;
  /** The name of the coffee to order; the first of the catalog by default. */
  coffeeName?: string;
  quantity?: number;
};

/** Creates a real order through the API with the sample address, and returns its id. */
export async function createOrder(
  request: APIRequestContext,
  { paymentMethod = "credit_card", complement = "", coffeeName, quantity = 1 }: OrderOptions = {},
): Promise<string> {
  const coffee =
    coffeeName === undefined
      ? (await listCoffees(request))[0]!.id
      : await coffeeId(request, coffeeName);
  const response = await request.post("/api/v1/orders", {
    data: {
      items: [{ coffeeId: coffee, quantity }],
      address: { ...sampleAddress, complement },
      paymentMethod,
    },
  });
  expect(response.status()).toBe(201);
  return ((await response.json()) as { id: string }).id;
}
