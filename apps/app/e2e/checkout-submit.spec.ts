import { expect, test, type Page, type Route } from "@playwright/test";

import { axeViolations, openCheckoutWithTheCart } from "./checkout-helpers";

test.use({ viewport: { width: 1440, height: 900 } });

// These tests need the API: `yarn infra:up`, then `yarn api:dev` (port 3000). The first ones create
// a real order. The others answer `POST /api/v1/orders` themselves to reach every outcome.
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const TRY_AGAIN = "We couldn't place your order. Please try again.";

const field = (page: Page, name: string) => page.getByRole("textbox", { name, exact: true });
const confirm = (page: Page) => page.getByRole("button", { name: "Confirm order" });
const drawn = (page: Page, label: string) =>
  page.locator("label", { has: page.getByRole("radio", { name: label }) });

async function fillTheSample(page: Page) {
  await field(page, "ZIP code").fill("90250440");
  await field(page, "Street").fill("Rua João Daniel Martinelli");
  await field(page, "Number").fill("102");
  await field(page, "Neighborhood").fill("Farrapos");
  await field(page, "City").fill("Porto Alegre");
  await field(page, "State").fill("rs");
  await drawn(page, "Credit card").click();
}

/** Counts the `POST /api/v1/orders` requests that leave the page, and keeps their bodies. */
function watchOrders(page: Page) {
  const bodies: unknown[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && new URL(request.url()).pathname === "/api/v1/orders") {
      bodies.push(request.postDataJSON());
    }
  });
  return bodies;
}

/** Answers the orders with this status and body instead of reaching the server. */
async function answerOrders(page: Page, status: number, body: unknown) {
  await page.route("**/api/v1/orders", (route: Route) =>
    route.request().method() === "POST"
      ? route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) })
      : route.continue(),
  );
}

const serverError = {
  error: { code: "unexpected_error", message: "Something went wrong. Please try again." },
};

test.beforeEach(async ({ page }) => {
  await openCheckoutWithTheCart(page);
  await expect(page.getByRole("radiogroup", { name: "Payment method" })).toBeVisible();
});

test("the design sample with credit card creates the order and opens /orders/<uuid>", async ({
  page,
}) => {
  const bodies = watchOrders(page);
  await fillTheSample(page);

  await confirm(page).click();

  await expect(page).toHaveURL(new RegExp(`/orders/${UUID}$`));
  expect(bodies).toHaveLength(1);
  const body = bodies[0] as {
    items: { coffeeId: string; quantity: number }[];
    address: Record<string, string>;
    paymentMethod: string;
  };
  expect(Object.keys(body).toSorted()).toEqual(["address", "items", "paymentMethod"]);
  expect(body.paymentMethod).toBe("credit_card");
  expect(body.address).toEqual({
    zipCode: "90250-440",
    street: "Rua João Daniel Martinelli",
    number: "102",
    complement: "",
    neighborhood: "Farrapos",
    city: "Porto Alegre",
    state: "RS",
  });
  expect(body.items.map((item) => item.quantity).toSorted()).toEqual([1, 2]);
  for (const item of body.items) {
    expect(Object.keys(item).toSorted()).toEqual(["coffeeId", "quantity"]);
  }
});

test("after the order the cart is empty, and Back does not return to the form", async ({
  page,
}) => {
  await fillTheSample(page);

  await confirm(page).click();
  await expect(page).toHaveURL(new RegExp(`/orders/${UUID}$`));

  await expect(page.getByRole("link", { name: "Cart, empty" })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 2, name: "Our coffees" })).toBeVisible();
});

test("an invalid form shows every error, focuses the first one, and sends no request", async ({
  page,
}) => {
  const bodies = watchOrders(page);

  await confirm(page).click();

  await expect(page.getByText("Enter a ZIP code like 12345-678")).toBeVisible();
  await expect(page.getByText("Street is required")).toBeVisible();
  await expect(page.getByText("Number is required")).toBeVisible();
  await expect(page.getByText("Neighborhood is required")).toBeVisible();
  await expect(page.getByText("City is required")).toBeVisible();
  await expect(page.getByText("Enter the 2-letter state, like RS")).toBeVisible();
  await expect(page.getByText("Choose a payment method")).toBeVisible();
  await expect(field(page, "ZIP code")).toBeFocused();
  expect(bodies).toHaveLength(0);
  await expect(page).toHaveURL(/\/checkout$/);
});

test("a double click on Confirm order sends one request while it runs", async ({ page }) => {
  const bodies = watchOrders(page);
  await page.route("**/api/v1/orders", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    await new Promise((resolve) => setTimeout(resolve, 600));
    return route.continue();
  });
  await fillTheSample(page);

  await confirm(page).dblclick();

  await expect(confirm(page)).toBeDisabled();
  await expect(confirm(page)).toHaveAttribute("aria-busy", "true");
  await expect(page).toHaveURL(new RegExp(`/orders/${UUID}$`));
  expect(bodies).toHaveLength(1);
});

test("a 400 with fields puts the messages under the fields and keeps the cart and the values", async ({
  page,
}) => {
  await answerOrders(page, 400, {
    error: {
      code: "validation_failed",
      message: "The request has invalid fields.",
      fields: { "address.city": "Enter the city.", paymentMethod: "Choose a payment method." },
    },
  });
  await fillTheSample(page);

  await confirm(page).click();

  await expect(page.getByText("Enter the city.")).toBeVisible();
  await expect(field(page, "City")).toHaveAttribute("aria-invalid", "true");
  await expect(field(page, "City")).toBeFocused();
  await expect(page.getByText("Choose a payment method.")).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(field(page, "Street")).toHaveValue("Rua João Daniel Martinelli");
  await expect(page.getByRole("link", { name: "Cart, 3 items" })).toBeVisible();
  await expect(confirm(page)).toBeEnabled();
});

test("a 400 about anything else shows the review alert and keeps the cart", async ({ page }) => {
  await answerOrders(page, 400, {
    error: {
      code: "validation_failed",
      message: "The request has invalid fields.",
      fields: { items: "Add at least one coffee." },
    },
  });
  await fillTheSample(page);

  await confirm(page).click();

  await expect(page.getByRole("alert")).toHaveText("Please review your order and try again.");
  await expect(page.getByRole("link", { name: "Cart, 3 items" })).toBeVisible();
});

test("a 422 shows the alert about coffees that are no longer available and keeps the cart", async ({
  page,
}) => {
  await answerOrders(page, 422, {
    error: {
      code: "unprocessable_content",
      message: "The order cannot be processed.",
      fields: { items: "Unknown coffee." },
    },
  });
  await fillTheSample(page);

  await confirm(page).click();

  await expect(page.getByRole("alert")).toHaveText(
    "Some coffees are no longer available. Please review your cart.",
  );
  await expect(page.getByRole("link", { name: "Cart, 3 items" })).toBeVisible();
  await expect(page).toHaveURL(/\/checkout$/);
});

test("a 500 shows the try again alert, enables the button, keeps the values, and the next click can work", async ({
  page,
}) => {
  const bodies = watchOrders(page);
  await answerOrders(page, 500, serverError);
  await fillTheSample(page);

  await confirm(page).click();

  await expect(page.getByRole("alert")).toHaveText(TRY_AGAIN);
  await expect(page.getByRole("alert")).toBeFocused();
  await expect(confirm(page)).toBeEnabled();
  await expect(field(page, "Number")).toHaveValue("102");
  await expect(page.getByRole("radio", { name: "Credit card" })).toBeChecked();
  expect(bodies).toHaveLength(1);

  await page.unroute("**/api/v1/orders");
  await confirm(page).click();

  await expect(page).toHaveURL(new RegExp(`/orders/${UUID}$`));
  expect(bodies).toHaveLength(2);
});

test("a network error shows the try again alert and keeps the cart", async ({ page }) => {
  await page.route("**/api/v1/orders", (route) =>
    route.request().method() === "POST" ? route.abort("failed") : route.continue(),
  );
  await fillTheSample(page);

  await confirm(page).click();

  await expect(page.getByRole("alert")).toHaveText(TRY_AGAIN);
  await expect(page.getByRole("link", { name: "Cart, 3 items" })).toBeVisible();
  await expect(confirm(page)).toBeEnabled();
});

test("a real browser axe scan reports no violation with the alert shown", async ({ page }) => {
  await answerOrders(page, 500, serverError);
  await fillTheSample(page);
  await confirm(page).click();
  await expect(page.getByRole("alert")).toBeVisible();

  expect(await axeViolations(page)).toEqual([]);
});
