import { expect, test } from "@playwright/test";

import {
  axeViolations,
  boxOf,
  field,
  fillTheAddress,
  openCheckoutWithTheCart,
} from "./checkout-helpers";

test.use({ viewport: { width: 1440, height: 900 } });

// These tests need the API, because the cart is filled from the catalog: `yarn infra:up`, then
// `yarn api:dev` (port 3000). The dev server of the app proxies /api to it.
const TOLERANCE = 2;

const FIELDS = [
  "ZIP code",
  "Street",
  "Number",
  "Complement",
  "Neighborhood",
  "City",
  "State",
] as const;

const close = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(TOLERANCE);

test.beforeEach(async ({ page }) => {
  await openCheckoutWithTheCart(page);
});

test("the card has the title, the line, and seven fields with their placeholders", async ({
  page,
}) => {
  const card = page.getByRole("group", { name: "Delivery address" });

  await expect(card.getByRole("heading", { level: 3, name: "Delivery address" })).toBeVisible();
  await expect(
    card.getByText("Enter the address where you want to receive your order"),
  ).toBeVisible();
  for (const name of FIELDS) {
    await expect(field(page, name)).toHaveAttribute("placeholder", name);
  }
  await expect(page.getByRole("textbox")).toHaveCount(7);
  await expect(card.getByText("Optional", { exact: true })).toBeVisible();
});

test("the fields have the sizes of the design, 12 px apart in a row and 16 px between rows", async ({
  page,
}) => {
  const card = await boxOf(page.getByRole("group", { name: "Delivery address" }));
  const zip = await boxOf(field(page, "ZIP code"));
  const street = await boxOf(field(page, "Street"));
  const number = await boxOf(field(page, "Number"));
  const complement = await boxOf(field(page, "Complement"));
  const neighborhood = await boxOf(field(page, "Neighborhood"));
  const city = await boxOf(field(page, "City"));
  const state = await boxOf(field(page, "State"));

  close(card.x, 160);
  close(card.width, 640);
  for (const [box, width] of [
    [zip, 200],
    [street, 560],
    [number, 200],
    [complement, 348],
    [neighborhood, 200],
    [city, 276],
    [state, 60],
  ] as const) {
    close(box.width, width);
    close(box.height, 42);
  }
  // The fields start on the 40 px padding of the card.
  close(zip.x, card.x + 40);
  close(street.x, card.x + 40);
  close(street.x + street.width, card.x + card.width - 40);
  // 12 px between the columns of a row.
  close(complement.x - (number.x + number.width), 12);
  close(city.x - (neighborhood.x + neighborhood.width), 12);
  close(state.x - (city.x + city.width), 12);
  // 16 px between the rows.
  close(street.y - (zip.y + zip.height), 16);
  close(number.y - (street.y + street.height), 16);
  close(neighborhood.y - (number.y + number.height), 16);
  close(complement.y, number.y);
  close(state.y, neighborhood.y);
});

test("the ZIP code gets its hyphen after the fifth digit and ignores extra digits and letters", async ({
  page,
}) => {
  await field(page, "ZIP code").pressSequentially("90250a440999");

  await expect(field(page, "ZIP code")).toHaveValue("90250-440");
});

test("the state turns into capitals and stops at two letters", async ({ page }) => {
  await field(page, "State").pressSequentially("rsx");

  await expect(field(page, "State")).toHaveValue("RS");
});

test("each invalid field shows its message, the error border, and a linked description", async ({
  page,
}) => {
  const cases = [
    ["ZIP code", "123", "Enter a ZIP code like 12345-678"],
    ["Street", "   ", "Street is required"],
    ["Number", "", "Number is required"],
    ["Neighborhood", "  ", "Neighborhood is required"],
    ["City", "", "City is required"],
    ["State", "R", "Enter the 2-letter state, like RS"],
    ["Complement", "a".repeat(61), "Complement must have at most 60 characters"],
  ] as const;

  for (const [name, value, message] of cases) {
    const input = field(page, name);
    await input.fill(value);
    await input.blur();

    await expect(page.getByText(message, { exact: true })).toBeVisible();
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveCSS("border-top-color", "rgb(204, 41, 55)");
    const describedBy = (await input.getAttribute("aria-describedby")) ?? "";
    const messageId = await page.getByText(message, { exact: true }).getAttribute("id");
    expect(describedBy.split(" ")).toContain(messageId);
  }
});

test("no message shows before a field loses focus, and a fixed field loses its message", async ({
  page,
}) => {
  await field(page, "Street").focus();
  await page.keyboard.press("Space");

  await expect(page.getByText("Street is required")).toHaveCount(0);

  await field(page, "Street").blur();
  await expect(page.getByText("Street is required")).toBeVisible();

  await field(page, "Street").fill("Rua João Daniel Martinelli");
  await expect(page.getByText("Street is required")).toHaveCount(0);
  await expect(field(page, "Street")).not.toHaveAttribute("aria-invalid", "true");
});

test("the sample address of the design is accepted: no message, and the filled border is yellow-dark", async ({
  page,
}) => {
  await fillTheAddress(page);
  for (const name of FIELDS) await field(page, name).blur();

  await expect(field(page, "State")).toHaveValue("RS");
  await expect(field(page, "ZIP code")).toHaveValue("90250-440");
  await expect(page.locator("[aria-invalid=true]")).toHaveCount(0);
  await expect(field(page, "Street")).toHaveCSS("border-top-color", "rgb(196, 127, 23)");
  // The empty Complement keeps the idle border.
  await expect(field(page, "Complement")).toHaveCSS("border-top-color", "rgb(230, 229, 229)");
});

test("the idle border is #E6E5E5 and the input fill is #EDEDED", async ({ page }) => {
  const style = await field(page, "City").evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      border: computed.borderTopColor,
      background: computed.backgroundColor,
      radius: computed.borderTopLeftRadius,
    };
  });

  expect(style).toEqual({
    border: "rgb(230, 229, 229)",
    background: "rgb(237, 237, 237)",
    radius: "4px",
  });
});

test("Tab goes through the fields in the visual order", async ({ page }) => {
  await field(page, "ZIP code").focus();

  const order: string[] = ["ZIP code"];
  for (let step = 1; step < FIELDS.length; step += 1) {
    await page.keyboard.press("Tab");
    order.push(
      (await page.evaluate(() => (document.activeElement as HTMLInputElement).placeholder)) ?? "",
    );
  }

  expect(order).toEqual([...FIELDS]);
});

test("a real browser axe scan reports no violation, empty or with every message shown", async ({
  page,
}) => {
  expect(await axeViolations(page)).toEqual([]);

  for (const name of FIELDS) {
    await field(page, name).focus();
    await field(page, name).blur();
  }
  await expect(page.getByText("City is required")).toBeVisible();

  expect(await axeViolations(page)).toEqual([]);
});
