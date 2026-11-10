import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test, type APIRequestContext, type Page, type TestInfo } from "@playwright/test";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

import { boxOf, coffeeId, createOrder, fillTheSample } from "./checkout-helpers";
import { masks, type Screen } from "./visual-masks";

// The four screens of the app, in the state of the design frames, against the frames cut from the
// Figma export (`e2e/figma-reference`, made by `scripts/cut-figma-references.mjs`). The text of the
// design is Portuguese and in reais, so the pixel comparison ignores the rectangles of
// `visual-masks.ts`. These tests need the API (see QA.md).
const WIDTH = 1440;
const HEIGHTS: Record<Screen, number> = {
  home: 2293,
  checkout: 1013,
  "checkout-filled": 1013,
  success: 1013,
};
/** The most pixels that may differ, as a share of the pixels that are not masked. */
const MAX_DIFFERENT_SHARE = 0.02;
/** The color distance (0 to 1) from which two pixels count as different. */
const PIXEL_THRESHOLD = 0.1;
const TOLERANCE = 2;
const CART_KEY = "coffee-delivery:cart:v1";

const close = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(TOLERANCE);

/** The cart of the frames: Traditional Espresso × 1 and Latte × 2 (the badge shows 3). */
async function putTheFrameCartIn(page: Page, request: APIRequestContext) {
  const lines = [
    { coffeeId: await coffeeId(request, "Traditional Espresso"), quantity: 1 },
    { coffeeId: await coffeeId(request, "Latte"), quantity: 2 },
  ];
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: CART_KEY,
    value: lines,
  });
}

async function waitUntilSettled(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() =>
    [...document.images].every((image) => image.complete && image.naturalWidth > 0),
  );
  await page.mouse.move(0, 0);
  // The colors of the controls fade in 150 ms.
  await page.waitForTimeout(300);
}

/** The app in the state of the frame, in a window as large as the frame. */
async function openFrame(page: Page, request: APIRequestContext, screen: Screen) {
  await page.setViewportSize({ width: WIDTH, height: HEIGHTS[screen] });
  if (screen === "home") {
    await page.goto("/");
    await expect(page.getByRole("article")).toHaveCount(14);
  } else if (screen === "success") {
    const id = await createOrder(request, { coffeeName: "Latte", quantity: 2 });
    await page.goto(`/orders/${id}`);
    await expect(
      page.getByRole("heading", { level: 1, name: "Uhu! Order confirmed" }),
    ).toBeVisible();
  } else {
    await putTheFrameCartIn(page, request);
    await page.goto("/checkout");
    await expect(page.getByRole("radiogroup", { name: "Payment method" })).toBeVisible();
    await expect(page.getByRole("list").first()).toBeVisible();
    if (screen === "checkout-filled") {
      await fillTheSample(page);
    }
  }
  await waitUntilSettled(page);
}

const MASK_COLOR = [255, 0, 255, 255];

function paint(image: PNG, rectangle: { x: number; y: number; width: number; height: number }) {
  for (
    let y = Math.max(0, rectangle.y);
    y < Math.min(image.height, rectangle.y + rectangle.height);
    y += 1
  ) {
    for (
      let x = Math.max(0, rectangle.x);
      x < Math.min(image.width, rectangle.x + rectangle.width);
      x += 1
    ) {
      image.data.set(MASK_COLOR, (y * image.width + x) * 4);
    }
  }
}

/** The share of unmasked pixels that differ from the frame; the images are attached to the report. */
async function differenceFromFrame(
  page: Page,
  screen: Screen,
  testInfo: TestInfo,
): Promise<number> {
  const expected = PNG.sync.read(
    readFileSync(join(import.meta.dirname, "figma-reference", `${screen}.png`)),
  );
  const actual = PNG.sync.read(await page.screenshot({ type: "png" }));
  expect({ width: actual.width, height: actual.height }).toEqual({
    width: expected.width,
    height: expected.height,
  });

  for (const mask of masks[screen]) {
    paint(expected, mask);
    paint(actual, mask);
  }
  const diff = new PNG({ width: expected.width, height: expected.height });
  const different = pixelmatch(
    expected.data,
    actual.data,
    diff.data,
    expected.width,
    expected.height,
    {
      threshold: PIXEL_THRESHOLD,
    },
  );
  let masked = 0;
  for (let index = 0; index < expected.data.length; index += 4) {
    if (
      expected.data[index] === 255 &&
      expected.data[index + 1] === 0 &&
      expected.data[index + 2] === 255 &&
      actual.data[index] === 255 &&
      actual.data[index + 1] === 0 &&
      actual.data[index + 2] === 255
    ) {
      masked += 1;
    }
  }
  const share = different / (expected.width * expected.height - masked);

  const note = `${screen}: ${(share * 100).toFixed(2)}% of ${expected.width * expected.height - masked} unmasked pixels differ (limit ${MAX_DIFFERENT_SHARE * 100}%)`;
  console.log(note);
  testInfo.annotations.push({ type: "difference", description: note });
  for (const [name, image] of [
    ["expected", expected],
    ["actual", actual],
    ["diff", diff],
  ] as const) {
    // The three images are written to the test output (test-results) so a failure can be looked at.
    const path = testInfo.outputPath(`${screen}-${name}.png`);
    writeFileSync(path, PNG.sync.write(image));
    await testInfo.attach(`${screen}-${name}`, { path, contentType: "image/png" });
  }
  return share;
}

for (const screen of ["home", "checkout", "checkout-filled", "success"] as const) {
  test(`${screen}: at most ${MAX_DIFFERENT_SHARE * 100}% of the pixels differ from the design`, async ({
    page,
    request,
  }, testInfo) => {
    await openFrame(page, request, screen);

    const share = await differenceFromFrame(page, screen, testInfo);

    expect(share).toBeLessThanOrEqual(MAX_DIFFERENT_SHARE);
  });
}

test.describe("the layout boxes of the design, within 2 px", () => {
  test("the navbar is 104 px high and the hero intro is 544 px wide", async ({ page, request }) => {
    await openFrame(page, request, "home");

    close((await boxOf(page.locator("header"))).height, 104);
    close((await boxOf(page.getByRole("heading", { level: 1 }).locator("xpath=.."))).width, 544);
  });

  test("a coffee card is 256 by 310, with 32 px between columns and 40 px between rows", async ({
    page,
    request,
  }) => {
    await openFrame(page, request, "home");
    const cards = page.getByRole("article");

    const first = await boxOf(cards.nth(0));
    const second = await boxOf(cards.nth(1));
    const fifth = await boxOf(cards.nth(4));

    close(first.width, 256);
    close(first.height, 310);
    close(second.x - (first.x + first.width), 32);
    close(fifth.y - (first.y + first.height), 40);
  });

  test("the checkout columns are 640 px at x=160 and 448 px at x=832, and Confirm order is 368 by 46", async ({
    page,
    request,
  }) => {
    await openFrame(page, request, "checkout");

    const left = await boxOf(page.getByRole("region", { name: "Complete your order" }));
    const right = await boxOf(page.getByRole("region", { name: "Selected coffees" }));
    const confirm = await boxOf(page.getByRole("button", { name: "Confirm order" }));

    close(left.x, 160);
    close(left.width, 640);
    close(right.x, 832);
    close(right.width, 448);
    close(confirm.width, 368);
    close(confirm.height, 46);
  });

  test("the payment options are 179 by 51", async ({ page, request }) => {
    await openFrame(page, request, "checkout");

    for (const label of ["Credit card", "Debit card", "Cash"]) {
      const box = await boxOf(
        page.locator("label", { has: page.getByRole("radio", { name: label }) }),
      );
      close(box.width, 179);
      close(box.height, 51);
    }
  });

  test("the success card is 526 by 270", async ({ page, request }) => {
    await openFrame(page, request, "success");

    const card = await boxOf(page.getByRole("list", { name: "Order details" }).locator("xpath=.."));

    close(card.width, 526);
    close(card.height, 270);
  });
});
