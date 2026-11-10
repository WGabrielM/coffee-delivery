import { expect, test, type Page } from "@playwright/test";

import { axeViolations, boxOf, drawn, openCheckoutWithTheCart } from "./checkout-helpers";

test.use({ viewport: { width: 1440, height: 900 } });

// These tests need the API, because the cart is filled from the catalog and the payment methods come
// from the checkout config: `yarn infra:up`, then `yarn api:dev` (port 3000). The dev server of the
// app proxies /api to it.
const TOLERANCE = 2;

const METHODS = [
  ["Credit card", "credit_card"],
  ["Debit card", "debit_card"],
  ["Cash", "cash"],
] as const;

const close = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(TOLERANCE);

const group = (page: Page) => page.getByRole("radiogroup", { name: "Payment method" });
const option = (page: Page, label: string) => page.getByRole("radio", { name: label });

/** The form of the page is submitted as the Confirm order button will do in spec 025. */
const submitTheForm = (page: Page) =>
  page.locator("form").evaluate((form) => (form as HTMLFormElement).requestSubmit());

test.beforeEach(async ({ page }) => {
  await openCheckoutWithTheCart(page);
  await expect(group(page)).toBeVisible();
});

test("the card has the title, the line, and one option per method of the API, in its order, none selected", async ({
  page,
}) => {
  const card = page.getByRole("group", { name: "Payment" });

  await expect(card.getByRole("heading", { level: 3, name: "Payment" })).toBeVisible();
  await expect(
    card.getByText("Payment is made on delivery. Choose the way you want to pay"),
  ).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(3);
  const values = await page
    .getByRole("radio")
    .evaluateAll((radios) => radios.map((radio) => (radio as HTMLInputElement).value));
  expect(values).toEqual(METHODS.map(([, code]) => code));
  for (const [label] of METHODS) {
    await expect(drawn(page, label)).toBeVisible();
    await expect(option(page, label)).not.toBeChecked();
  }
});

test("each option is 179 by 51 px, 12 px apart, and the card sits under the address card", async ({
  page,
}) => {
  const address = await boxOf(page.getByRole("group", { name: "Delivery address" }));
  const card = await boxOf(page.getByRole("group", { name: "Payment" }));
  const boxes = [];
  for (const [label] of METHODS) boxes.push(await boxOf(drawn(page, label)));

  close(card.x, 160);
  close(card.width, 640);
  close(card.y, address.y + address.height + 12);
  for (const box of boxes) {
    close(box.width, 179);
    close(box.height, 51);
  }
  close(boxes[0]!.x, card.x + 40);
  close(boxes[1]!.x - (boxes[0]!.x + boxes[0]!.width), 12);
  close(boxes[2]!.x - (boxes[1]!.x + boxes[1]!.width), 12);
  close(boxes[0]!.y, boxes[1]!.y);
  close(boxes[1]!.y, boxes[2]!.y);
});

test("a click selects an option and unselects the previous one", async ({ page }) => {
  await drawn(page, "Credit card").click();
  await expect(option(page, "Credit card")).toBeChecked();

  await drawn(page, "Cash").click();

  await expect(option(page, "Cash")).toBeChecked();
  await expect(option(page, "Credit card")).not.toBeChecked();
  await expect(option(page, "Debit card")).not.toBeChecked();
});

test("Space selects the focused option and the arrow keys move the selection", async ({ page }) => {
  await option(page, "Credit card").focus();
  await page.keyboard.press("Space");
  await expect(option(page, "Credit card")).toBeChecked();

  await page.keyboard.press("ArrowRight");
  await expect(option(page, "Debit card")).toBeChecked();
  await expect(option(page, "Debit card")).toBeFocused();

  await page.keyboard.press("ArrowRight");
  await expect(option(page, "Cash")).toBeChecked();

  await page.keyboard.press("ArrowLeft");
  await expect(option(page, "Debit card")).toBeChecked();
});

test("the selected option has the purple-light fill and a 1 px purple border; the others are idle", async ({
  page,
}) => {
  await drawn(page, "Debit card").click();

  // The colors fade in 150 ms, so each check waits for the end of the transition.
  await expect(drawn(page, "Debit card")).toHaveCSS("background-color", "rgb(235, 229, 249)");
  await expect(drawn(page, "Debit card")).toHaveCSS("border-top-color", "rgb(128, 71, 248)");
  await expect(drawn(page, "Debit card")).toHaveCSS("border-top-width", "1px");
  await expect(drawn(page, "Cash")).toHaveCSS("background-color", "rgb(230, 229, 229)");
});

test("the value of each option is the code of the API", async ({ page }) => {
  for (const [label, code] of METHODS) {
    await drawn(page, label).click();
    await expect(page.locator("input[type=radio]:checked")).toHaveAttribute("value", code);
  }
});

test("a submit with no option selected shows Choose a payment method and marks the group", async ({
  page,
}) => {
  await submitTheForm(page);

  await expect(page.getByText("Choose a payment method")).toBeVisible();
  await expect(group(page)).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Choose a payment method")).toHaveCSS("color", "rgb(204, 41, 55)");

  await drawn(page, "Cash").click();

  await expect(page.getByText("Choose a payment method")).toHaveCount(0);
  await expect(group(page)).not.toHaveAttribute("aria-invalid", "true");
});

test("a real browser axe scan reports no violation, with and without the message", async ({
  page,
}) => {
  expect(await axeViolations(page)).toEqual([]);

  await submitTheForm(page);
  await expect(page.getByText("Choose a payment method")).toBeVisible();

  expect(await axeViolations(page)).toEqual([]);
});
