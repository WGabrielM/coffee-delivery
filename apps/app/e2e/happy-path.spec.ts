import { expect, test, type Page } from "@playwright/test";

import { field } from "./checkout-helpers";

// The whole purchase on the real app, API, and database: no request is mocked. `yarn test:e2e`
// starts what is missing (or reuses what is running), so only Postgres has to be up (`yarn infra:up`).
test.use({ viewport: { width: 1440, height: 900 } });

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

const card = (page: Page, name: string) => page.getByRole("article", { name });
const chip = (page: Page, name: string) =>
  page.getByRole("group", { name: "Filter by tag" }).getByRole("button", { name });
const summary = (page: Page) => page.getByRole("region", { name: "Selected coffees" });
const totalOf = (page: Page, label: string) =>
  summary(page).getByText(label, { exact: true }).locator("xpath=following-sibling::dd");

test("a visitor browses, filters, orders Latte × 2 and Traditional Espresso × 1, and sees the confirmation", async ({
  page,
  request,
}) => {
  await test.step("opens the home page with the 14 coffees", async () => {
    await page.goto("/");

    await expect(page.getByRole("article")).toHaveCount(14);
  });

  await test.step("filters by Special and Iced and sees only the Cuban", async () => {
    await chip(page, "Special").click();
    await chip(page, "Iced").click();

    await expect(page.getByRole("article")).toHaveCount(1);
    await expect(card(page, "Cuban")).toBeVisible();
  });

  await test.step("clears the filters and sees the 14 coffees again", async () => {
    await page.getByRole("button", { name: "Clear filters" }).click();

    await expect(page.getByRole("article")).toHaveCount(14);
  });

  await test.step("adds Latte × 2 and Traditional Espresso × 1: the badge shows 3", async () => {
    await card(page, "Latte").getByRole("button", { name: "Increase quantity" }).click();
    await card(page, "Latte").getByRole("button", { name: "Add Latte to cart" }).click();
    await card(page, "Traditional Espresso")
      .getByRole("button", { name: "Add Traditional Espresso to cart" })
      .click();

    await expect(page.getByRole("link", { name: "Cart, 3 items" })).toHaveText("3");
  });

  await test.step("opens the cart and sees the amounts of the design", async () => {
    await page.getByRole("link", { name: "Cart, 3 items" }).click();

    await expect(page).toHaveURL(/\/checkout$/);
    await expect(totalOf(page, "Items total")).toHaveText("$29.70");
    await expect(totalOf(page, "Delivery")).toHaveText("$3.50");
    await expect(totalOf(page, "Total")).toHaveText("$33.20");
  });

  await test.step("fills the sample address, chooses credit card, and confirms", async () => {
    await field(page, "ZIP code").fill("90250440");
    await field(page, "Street").fill("Rua João Daniel Martinelli");
    await field(page, "Number").fill("102");
    await field(page, "Neighborhood").fill("Farrapos");
    await field(page, "City").fill("Porto Alegre");
    await field(page, "State").fill("rs");
    await page.getByRole("radio", { name: "Credit card" }).check({ force: true });
    await page.getByRole("button", { name: "Confirm order" }).click();

    await expect(page).toHaveURL(new RegExp(`/orders/${UUID}$`));
  });

  const orderId = new URL(page.url()).pathname.split("/").pop()!;

  await test.step("sees the confirmation, with an empty cart", async () => {
    await expect(
      page.getByRole("heading", { level: 1, name: "Uhu! Order confirmed" }),
    ).toBeVisible();
    await expect(page.getByText("Rua João Daniel Martinelli, 102")).toBeVisible();
    await expect(page.getByText("20 min - 30 min")).toBeVisible();
    await expect(page.getByText("Credit card")).toBeVisible();
    await expect(page.getByRole("link", { name: "Cart, empty" })).toBeVisible();
  });

  await test.step("reloads and sees the same content", async () => {
    await page.reload();

    await expect(
      page.getByRole("heading", { level: 1, name: "Uhu! Order confirmed" }),
    ).toBeVisible();
    await expect(page.getByText("Rua João Daniel Martinelli, 102")).toBeVisible();
    await expect(page.getByText("20 min - 30 min")).toBeVisible();
    await expect(page.getByText("Credit card")).toBeVisible();
    await expect(page.getByRole("link", { name: "Cart, empty" })).toBeVisible();
  });

  await test.step("the stored order has the total of 3320 cents", async () => {
    const response = await request.get(`/api/v1/orders/${orderId}`);

    expect(response.status()).toBe(200);
    const order = (await response.json()) as {
      id: string;
      totalInCents: number;
      subtotalInCents: number;
      deliveryFeeInCents: number;
      paymentMethod: string;
      items: { name: string; quantity: number }[];
    };
    expect(order.id).toBe(orderId);
    expect(order.totalInCents).toBe(3320);
    expect(order.subtotalInCents).toBe(2970);
    expect(order.deliveryFeeInCents).toBe(350);
    expect(order.paymentMethod).toBe("credit_card");
    expect(order.items.map((item) => [item.name, item.quantity])).toEqual([
      ["Latte", 2],
      ["Traditional Espresso", 1],
    ]);
  });
});
