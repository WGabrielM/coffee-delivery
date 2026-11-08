import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

import { boxOf, openCheckoutWithTheCart } from "./checkout-helpers";

// These tests need the API: `yarn infra:up`, then `yarn api:dev` (port 3000). The confirmation test
// creates a real order through it. Breakpoints (DESIGN.md): mobile below 640 px, tablet 640 to
// 1023 px, desktop from 1024 px. The page margin is 16 px, 32 px, and up to 160 px.
const TOLERANCE = 2;
const close = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(TOLERANCE);

const DESKTOP = { width: 1440, height: 900 };
const NARROW_DESKTOP = { width: 1024, height: 768 };
const MID_DESKTOP = { width: 1280, height: 800 };
const TABLET = { width: 768, height: 1024 };
const MOBILE = { width: 390, height: 844 };
const SMALL_MOBILE = { width: 320, height: 568 };

async function createOrder(request: APIRequestContext) {
  const catalog = await request.get("/api/v1/coffees");
  const { coffees } = (await catalog.json()) as { coffees: { id: string }[] };
  const response = await request.post("/api/v1/orders", {
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
  return ((await response.json()) as { id: string }).id;
}

/** The four screens of the spec, each opened and ready. */
const screens: Record<string, (page: Page, request: APIRequestContext) => Promise<void>> = {
  Home: async (page) => {
    await page.goto("/");
    await expect(page.getByRole("article")).toHaveCount(14);
  },
  "Checkout with items": async (page) => {
    await openCheckoutWithTheCart(page);
    await expect(page.getByRole("radiogroup", { name: "Payment method" })).toBeVisible();
  },
  "Checkout, empty cart": async (page) => {
    await page.goto("/checkout");
    await expect(page.getByRole("heading", { name: "Your cart is empty" })).toBeVisible();
  },
  Confirmation: async (page, request) => {
    await page.goto(`/orders/${await createOrder(request)}`);
    await expect(
      page.getByRole("heading", { level: 1, name: "Uhu! Order confirmed" }),
    ).toBeVisible();
    await page.waitForFunction(() => [...document.images].every((image) => image.complete));
  },
};

const viewports = [
  ["desktop 1440", DESKTOP],
  ["desktop 1280", MID_DESKTOP],
  ["desktop 1024", NARROW_DESKTOP],
  ["tablet 768", TABLET],
  ["mobile 390", MOBILE],
  ["mobile 320", SMALL_MOBILE],
] as const;

for (const [viewportName, viewport] of viewports) {
  test.describe(viewportName, () => {
    test.use({ viewport });

    for (const [screenName, open] of Object.entries(screens)) {
      test(`${screenName}: no horizontal scroll`, async ({ page, request }) => {
        await open(page, request);

        const widths = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          client: document.documentElement.clientWidth,
        }));

        expect(widths.scroll).toBe(widths.client);
      });

      test(`${screenName}: every button, link, and input is at least 24 by 24 px`, async ({
        page,
        request,
      }) => {
        await open(page, request);

        const small = await page.evaluate(() => {
          const targets = document.querySelectorAll<HTMLElement>(
            "a[href], button, input, select, textarea, [role=button]",
          );
          const problems: string[] = [];
          for (const element of targets) {
            // A radio is hidden inside its label, and the label is what the person clicks.
            const clickable =
              element instanceof HTMLInputElement && element.type === "radio"
                ? (element.closest("label") ?? element)
                : element;
            const box = clickable.getBoundingClientRect();
            const style = getComputedStyle(clickable);
            const hidden =
              style.visibility === "hidden" ||
              style.display === "none" ||
              (box.width <= 1 && box.height <= 1);
            if (hidden) continue;
            if (box.width < 24 || box.height < 24) {
              const name = (
                clickable.getAttribute("aria-label") ??
                clickable.textContent ??
                ""
              ).trim();
              problems.push(
                clickable.tagName.toLowerCase() +
                  " " +
                  name.slice(0, 30) +
                  " " +
                  Math.round(box.width) +
                  "x" +
                  Math.round(box.height),
              );
            }
          }
          return problems;
        });

        expect(small).toEqual([]);
      });
    }
  });
}

// Locators the groups below share.
const title = (page: Page) => page.getByRole("heading", { level: 1 });
const image = (page: Page) => page.locator("section img[width='476']");
const benefits = (page: Page) =>
  page.locator("section ul li").filter({ hasText: "Simple and secure" });
const columnsOf = (page: Page) =>
  page.getByRole("article").evaluateAll((cards) => {
    const lefts = cards.map((card) => Math.round(card.getBoundingClientRect().left));
    return new Set(lefts).size;
  });
const sections = (page: Page) => ({
  left: page.getByRole("region", { name: "Complete your order" }),
  right: page.getByRole("region", { name: "Selected coffees" }),
});
const orderCard = (page: Page) =>
  page.getByRole("list", { name: "Order details" }).locator("xpath=..");

test.describe("page margin", () => {
  for (const [name, viewport, margin] of [
    ["tablet", TABLET, 32],
    ["mobile", MOBILE, 16],
  ] as const) {
    test(`${name}: the content starts ${margin} px from the edge on every screen`, async ({
      page,
      request,
    }) => {
      await page.setViewportSize(viewport);

      await screens["Home"]!(page, request);
      close((await boxOf(page.getByRole("heading", { level: 2, name: "Our coffees" }))).x, margin);
      close((await boxOf(page.getByRole("link", { name: "Coffee Delivery, home" }))).x, margin);

      await screens["Checkout, empty cart"]!(page, request);
      close((await boxOf(page.getByRole("heading", { name: "Your cart is empty" }))).x, margin);

      await screens["Confirmation"]!(page, request);
      close(
        (await boxOf(page.getByRole("heading", { level: 1, name: "Uhu! Order confirmed" }))).x,
        margin,
      );
    });
  }
});

test.describe("navbar", () => {
  test.use({ viewport: MOBILE });

  test("the logo, the pill, and the cart stay on one row at 390 px", async ({ page }) => {
    await page.goto("/");

    const logo = await boxOf(page.getByRole("link", { name: "Coffee Delivery, home" }));
    const pill = await boxOf(page.getByText("Porto Alegre, RS"));
    const cart = await boxOf(page.getByRole("link", { name: "Cart, empty" }));

    close(logo.y + logo.height / 2, cart.y + cart.height / 2);
    close(pill.y + pill.height / 2, cart.y + cart.height / 2);
    expect(logo.x + logo.width).toBeLessThanOrEqual(pill.x);
    expect(pill.x + pill.width).toBeLessThanOrEqual(cart.x);
  });

  test("below 640 px the pill text is cut with an ellipsis instead of wrapping", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 260, height: 568 });
    await page.goto("/");

    const text = page.getByText("Porto Alegre, RS");
    const style = await text.evaluate((element) => {
      const computed = getComputedStyle(element);
      return {
        overflow: computed.overflow,
        textOverflow: computed.textOverflow,
        wrap: computed.whiteSpace,
        cut: element.scrollWidth > element.clientWidth,
      };
    });
    const nav = await page.getByRole("navigation", { name: "Main" }).evaluate((element) => ({
      scroll: element.scrollWidth,
      client: element.clientWidth,
    }));
    const box = await boxOf(text);

    expect(style).toEqual({
      overflow: "hidden",
      textOverflow: "ellipsis",
      wrap: "nowrap",
      cut: true,
    });
    expect(box.height).toBeLessThan(24);
    expect(nav.scroll).toBe(nav.client);
  });
});

test.describe("hero", () => {
  for (const [name, viewport, size, columns] of [
    ["desktop", DESKTOP, "48px", 2],
    ["tablet", TABLET, "40px", 2],
    ["mobile", MOBILE, "32px", 1],
  ] as const) {
    test(`${name}: the title is ${size} and the benefits have ${columns} column(s)`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");

      await expect(title(page)).toHaveCSS("font-size", size);
      const items = page.locator("section ul").first().getByRole("listitem");
      const tops = await items.evaluateAll((elements) =>
        elements.map((element) => Math.round(element.getBoundingClientRect().top)),
      );
      expect(new Set(tops).size).toBe(columns === 2 ? 2 : 4);
      await expect(benefits(page)).toBeVisible();
    });
  }

  for (const [name, viewport] of [
    ["tablet", TABLET],
    ["mobile", MOBILE],
  ] as const) {
    test(`${name}: the intro is above the cup image and both are centered`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");

      const heading = await boxOf(title(page));
      const picture = await boxOf(image(page));
      const centerOfPage = viewport.width / 2;

      expect(picture.y).toBeGreaterThan(heading.y + heading.height);
      close(picture.x + picture.width / 2, centerOfPage);
      close(heading.x + heading.width / 2, centerOfPage);
      expect(picture.width).toBeLessThanOrEqual(476 + TOLERANCE);
    });
  }

  test("desktop: the intro and the image stay side by side", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/");

    const heading = await boxOf(title(page));
    const picture = await boxOf(image(page));

    expect(picture.x).toBeGreaterThan(heading.x + heading.width);
    close(picture.width, 476);
  });
});

test.describe("coffee list", () => {
  for (const [name, viewport, columns] of [
    ["desktop 1440", DESKTOP, 4],
    ["tablet", TABLET, 2],
    ["mobile", MOBILE, 1],
  ] as const) {
    test(`${name}: ${columns} column(s) of 256 px cards`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await expect(page.getByRole("article")).toHaveCount(14);

      expect(await columnsOf(page)).toBe(columns);
      close((await boxOf(page.getByRole("article").first())).width, 256);
    });
  }

  test("mobile: the cards are centered", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/");

    const card = await boxOf(page.getByRole("article").first());

    close(card.x + card.width / 2, MOBILE.width / 2);
  });

  test("tablet and mobile: the chips are below the title and wrap onto more rows when needed", async ({
    page,
  }) => {
    for (const viewport of [TABLET, MOBILE]) {
      await page.setViewportSize(viewport);
      await page.goto("/");
      const heading = await boxOf(page.getByRole("heading", { level: 2, name: "Our coffees" }));
      const chips = await page
        .getByRole("group", { name: "Filter by tag" })
        .getByRole("button")
        .evaluateAll((buttons) =>
          buttons.map((button) => {
            const box = button.getBoundingClientRect();
            return { top: Math.round(box.top), right: box.right };
          }),
        );

      expect(chips).toHaveLength(5);
      for (const chip of chips) expect(chip.top).toBeGreaterThanOrEqual(heading.y + heading.height);
      for (const chip of chips) expect(chip.right).toBeLessThanOrEqual(viewport.width);
    }

    await page.setViewportSize(MOBILE);
    await page.goto("/");
    const rows = await page
      .getByRole("button", { pressed: false })
      .evaluateAll(
        (buttons) =>
          new Set(buttons.map((button) => Math.round(button.getBoundingClientRect().top))).size,
      );
    expect(rows).toBeGreaterThan(1);
  });

  test("desktop: the chips share the row of the title", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/");

    const heading = await boxOf(page.getByRole("heading", { level: 2, name: "Our coffees" }));
    const chip = await boxOf(page.getByRole("button", { name: "Special" }));

    close(chip.y + chip.height / 2, heading.y + heading.height / 2);
  });
});

test.describe("checkout", () => {
  for (const [name, viewport] of [
    ["tablet", TABLET],
    ["mobile", MOBILE],
  ] as const) {
    test(`${name}: one column with the address, the payment, then the summary`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await openCheckoutWithTheCart(page);
      await expect(page.getByRole("radiogroup", { name: "Payment method" })).toBeVisible();

      const address = await boxOf(page.getByRole("group", { name: "Delivery address" }));
      const payment = await boxOf(page.getByRole("group", { name: "Payment" }));
      const summary = await boxOf(sections(page).right);

      close(address.x, summary.x);
      close(payment.x, summary.x);
      close(address.width, summary.width);
      expect(payment.y).toBeGreaterThanOrEqual(address.y + address.height);
      expect(summary.y).toBeGreaterThanOrEqual(payment.y + payment.height);
      // The summary card fills the width of the content.
      close(summary.width, viewport.width - 2 * (viewport.width === 768 ? 32 : 16));
    });
  }

  test("mobile: each address field is on its own row and the payment options stack", async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE);
    await openCheckoutWithTheCart(page);
    await expect(page.getByRole("radiogroup", { name: "Payment method" })).toBeVisible();

    const names = ["ZIP code", "Street", "Number", "Complement", "Neighborhood", "City", "State"];
    const boxes = [];
    for (const name of names)
      boxes.push(await boxOf(page.getByRole("textbox", { name, exact: true })));
    for (let index = 1; index < boxes.length; index += 1) {
      expect(boxes[index]!.y).toBeGreaterThanOrEqual(
        boxes[index - 1]!.y + boxes[index - 1]!.height,
      );
      close(boxes[index]!.x, boxes[0]!.x);
      close(boxes[index]!.width, boxes[0]!.width);
    }

    const options = [];
    for (const label of ["Credit card", "Debit card", "Cash"]) {
      options.push(
        await boxOf(page.locator("label", { has: page.getByRole("radio", { name: label }) })),
      );
    }
    for (let index = 1; index < options.length; index += 1) {
      expect(options[index]!.y).toBeGreaterThanOrEqual(
        options[index - 1]!.y + options[index - 1]!.height,
      );
      close(options[index]!.x, options[0]!.x);
      close(options[index]!.width, options[0]!.width);
      close(options[index]!.height, 51);
    }
  });

  test("tablet: the address rows keep their columns and the options stay in one row", async ({
    page,
  }) => {
    await page.setViewportSize(TABLET);
    await openCheckoutWithTheCart(page);
    await expect(page.getByRole("radiogroup", { name: "Payment method" })).toBeVisible();

    const number = await boxOf(page.getByRole("textbox", { name: "Number", exact: true }));
    const complement = await boxOf(page.getByRole("textbox", { name: "Complement", exact: true }));
    const city = await boxOf(page.getByRole("textbox", { name: "City", exact: true }));
    const state = await boxOf(page.getByRole("textbox", { name: "State", exact: true }));
    const credit = await boxOf(
      page.locator("label", { has: page.getByRole("radio", { name: "Credit card" }) }),
    );
    const cash = await boxOf(
      page.locator("label", { has: page.getByRole("radio", { name: "Cash" }) }),
    );

    close(number.y, complement.y);
    close(city.y, state.y);
    close(credit.y, cash.y);
    expect(state.width).toBeGreaterThanOrEqual(60 - TOLERANCE);
  });

  test("mobile: the summary rows fit in the card and Confirm order fills it", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await openCheckoutWithTheCart(page);

    const card = await boxOf(sections(page).right.locator("xpath=./div"));
    const confirm = await boxOf(page.getByRole("button", { name: "Confirm order" }));
    const rows = await page
      .getByRole("listitem")
      .evaluateAll((items) => items.map((item) => item.getBoundingClientRect().right));

    expect(confirm.x).toBeGreaterThanOrEqual(card.x);
    expect(confirm.x + confirm.width).toBeLessThanOrEqual(card.x + card.width);
    for (const right of rows) expect(right).toBeLessThanOrEqual(card.x + card.width);
  });

  test("desktop 1024: two columns share the width without overflow", async ({ page }) => {
    await page.setViewportSize(NARROW_DESKTOP);
    await openCheckoutWithTheCart(page);

    const left = await boxOf(sections(page).left);
    const right = await boxOf(sections(page).right);

    expect(right.x).toBeGreaterThan(left.x + left.width);
    close(right.y, left.y);
    expect(right.x + right.width).toBeLessThanOrEqual(1024);
  });
});

test.describe("confirmation", () => {
  for (const [name, viewport] of [
    ["tablet", TABLET],
    ["mobile", MOBILE],
  ] as const) {
    test(`${name}: the card is above the illustration and the illustration scales to fit`, async ({
      page,
      request,
    }) => {
      await page.setViewportSize(viewport);
      await screens["Confirmation"]!(page, request);

      const cardBox = await boxOf(orderCard(page));
      const picture = await boxOf(page.locator("main img"));
      const margin = viewport.width === 768 ? 32 : 16;

      expect(picture.y).toBeGreaterThanOrEqual(cardBox.y + cardBox.height);
      expect(cardBox.width).toBeLessThanOrEqual(526 + TOLERANCE);
      expect(picture.width).toBeLessThanOrEqual(viewport.width - 2 * margin + TOLERANCE);
      // The picture keeps its proportions (492 by 293).
      close(picture.width / picture.height, 492 / 293);
    });
  }

  test("mobile: the card fills the width of the content", async ({ page, request }) => {
    await page.setViewportSize(MOBILE);
    await screens["Confirmation"]!(page, request);

    close((await boxOf(orderCard(page))).width, MOBILE.width - 32);
  });

  test("desktop 1440: the card and the illustration stay side by side", async ({
    page,
    request,
  }) => {
    await page.setViewportSize(DESKTOP);
    await screens["Confirmation"]!(page, request);

    const cardBox = await boxOf(orderCard(page));
    const picture = await boxOf(page.locator("main img"));

    expect(picture.x).toBeGreaterThan(cardBox.x + cardBox.width);
    close(picture.width, 492);
  });
});
